import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/profile';
import { DEFAULT_SHOP_NAME, ERROR_MESSAGES, TIMEOUTS } from './constants';
import { logError, withTimeout } from './helpers';
import { createShop, getUserShops } from './ShopService';

// Single in-flight tracker to prevent concurrent ensureOwnerProfile calls
const inFlightEnsureRequests = new Map<string, Promise<UserProfile>>();

export async function fetchProfile(
  userId: string,
  client: SupabaseClient = supabase
): Promise<UserProfile | null> {
  try {
    const { data, error } = (await withTimeout(
      client
        .from('profiles')
        .select('id, name, username, phone, shop_logo_url, role, shop_id, shops!profiles_shop_id_fkey(shop_name)')
        .eq('id', userId)
        .maybeSingle() as unknown as Promise<any>,
      TIMEOUTS.QUERY_MS,
      'profiles table select timed out'
    )) as { data: any; error: any };

    if (error || !data) {
      if (error) logError('fetchProfile error', error);
      return null;
    }

    const dbShopName = data.shops
      ? Array.isArray(data.shops)
        ? data.shops[0]?.shop_name || ''
        : data.shops.shop_name || ''
      : '';

    return {
      id: data.id,
      name: data.name ?? '',
      username: data.username ?? '',
      phone: data.phone ?? '',
      shopLogoUrl: data.shop_logo_url ?? '',
      role: (data.role as UserRole) || 'owner',
      shopId: data.shop_id ?? '',
      shopName: dbShopName,
    };
  } catch (err) {
    logError('fetchProfile failed', err);
    return null;
  }
}

async function ensureOwnerProfile(
  userId: string,
  customShopName?: string,
  client: SupabaseClient = supabase
): Promise<UserProfile> {
  // Check if a request for this userId is already in flight
  if (inFlightEnsureRequests.has(userId)) {
    return inFlightEnsureRequests.get(userId)!;
  }

  const promise = (async () => {
    try {
      // Validate active session user ID from Supabase auth
      let targetUserId = userId;
      let userMetaName = '';
      let userMetaShopName = '';
      let userMetaPhone = '';
      let authenticatedUserFound = false;
      try {
        const {
          data: { user },
        } = await client.auth.getUser();
        if (user?.id) {
          // Guard against stale session reuse: the active auth user must match the intended user.
          if (userId && user.id !== userId) {
            throw new Error('Stale auth session detected for a different user.');
          }

          authenticatedUserFound = true;
          targetUserId = user.id;
          userMetaName = userMetaName || user.user_metadata?.name || '';
          userMetaShopName = userMetaShopName || user.user_metadata?.shop_name || '';
          userMetaPhone = userMetaPhone || String(user.user_metadata?.phone ?? '').trim();
        }
      } catch (e) {
        logError('ensureOwnerProfile auth user check', e);
      }

      if (!authenticatedUserFound) {
        // getUser() can fail on a flaky network while the cached session is still
        // perfectly usable for RLS writes, so fall back to the local session.
        try {
          const {
            data: { session },
          } = await client.auth.getSession();
          if (session?.user?.id && (!userId || session.user.id === userId)) {
            authenticatedUserFound = true;
            targetUserId = session.user.id;
            userMetaName = userMetaName || session.user.user_metadata?.name || '';
            userMetaShopName = userMetaShopName || session.user.user_metadata?.shop_name || '';
            userMetaPhone = userMetaPhone || String(session.user.user_metadata?.phone ?? '').trim();
          }
        } catch (e) {
          logError('ensureOwnerProfile session fallback', e);
        }
      }

      if (!authenticatedUserFound) {
        throw new Error(ERROR_MESSAGES.SESSION_MISSING);
      }

      const existing = await fetchProfile(targetUserId, client);

      // If existing profile has a valid shopId, return it directly
      if (existing && existing.shopId) {
        if (userMetaPhone && existing.phone !== userMetaPhone) {
          await client
            .from('profiles')
            .update({ phone: userMetaPhone })
            .eq('id', targetUserId);
        }
        return userMetaPhone && existing.phone !== userMetaPhone
          ? { ...existing, phone: userMetaPhone }
          : existing;
      }

      const name = existing?.name || userMetaName || '';
      const initialShopName = customShopName?.trim() || userMetaShopName?.trim() || DEFAULT_SHOP_NAME;
      const phone = existing?.phone || userMetaPhone;

      // Resolve the shop. A failure here must NOT abort profile creation: the
      // profile row is what makes an account usable at all, so keep whatever
      // shop id we already have (e.g. the one created by the DB trigger) and
      // let the next retry create the shop if it is still missing.
      let shopId = existing?.shopId || '';
      let shopName = existing?.shopName || initialShopName;

      // First, try to find an existing shop for this user
      if (!shopId) {
        try {
          const userShops = await getUserShops(targetUserId, client);
          if (userShops.length > 0) {
            shopId = userShops[0].id;
            shopName = userShops[0].shop_name || initialShopName;
          }
        } catch (lookupErr) {
          logError('ensureOwnerProfile shop lookup failed, will attempt creation', lookupErr);
        }
      }

      // If no shop found, attempt to create one — independently of the lookup
      if (!shopId) {
        try {
          const shop = await createShop(targetUserId, initialShopName, phone, client);
          shopId = shop.id;
          shopName = shop.shop_name;
        } catch (createErr) {
          logError('ensureOwnerProfile shop creation notice', createErr);
        }
      }

      if (existing) {
        if (shopId && shopId !== existing.shopId) {
          await client
            .from('profiles')
            .update({
              shop_id: shopId,
              role: existing.role || 'owner',
              name: name || existing.name,
              phone,
            })
            .eq('id', targetUserId);
        }

        return {
          ...existing,
          name: name || existing.name,
          phone,
          shopId: shopId || existing.shopId || '',
          shopName: shopName || existing.shopName || DEFAULT_SHOP_NAME,
        };
      }

      // Create the profile row. This is the most important write in the whole
      // signup flow, so a failure is surfaced loudly instead of silently
      // leaving the account with no profile (the "skipped" row bug).
      const { error: profErr } = await client.from('profiles').upsert(
        {
          id: targetUserId,
          name,
          phone,
          role: 'owner',
          shop_id: shopId || null,
        },
        { onConflict: 'id' }
      );

      if (profErr) {
        throw new Error(`${ERROR_MESSAGES.CREATE_PROFILE_FAILED}${profErr.message}`);
      }

      // If the shop wasn't created in the first attempt (e.g. DB trigger missing
      // or column mismatch), try again now that the profile exists.
      if (!shopId) {
        // Look for existing shops first
        try {
          const retryShops = await getUserShops(targetUserId, client);
          if (retryShops.length > 0) {
            shopId = retryShops[0].id;
            shopName = retryShops[0].shop_name || initialShopName;
          }
        } catch (lookupErr) {
          logError('ensureOwnerProfile shop retry lookup failed', lookupErr);
        }

        // If still no shop, create one — independently of the lookup
        if (!shopId) {
          try {
            const shop = await createShop(targetUserId, initialShopName, phone, client);
            shopId = shop.id;
            shopName = shop.shop_name;
          } catch (createErr) {
            logError('ensureOwnerProfile shop retry creation failed', createErr);
          }
        }

        // Update the profile with the newly acquired shop_id
        if (shopId) {
          await client
            .from('profiles')
            .update({ shop_id: shopId })
            .eq('id', targetUserId);
        }
      }

      // Backfill existing unassigned repairs & inventory
      if (shopId) {
        await client
          .from('repairs')
          .update({ shop_id: shopId, created_by: targetUserId })
          .eq('user_id', targetUserId)
          .is('shop_id', null);

        await client
          .from('inventory')
          .update({ shop_id: shopId })
          .eq('user_id', targetUserId)
          .is('shop_id', null);
      }

      return {
        id: targetUserId,
        name,
        username: '',
        phone,
        role: 'owner' as UserRole,
        shopId: shopId || '',
        shopName: shopName || DEFAULT_SHOP_NAME,
      };
    } catch (err) {
      logError('ensureOwnerProfile fallback', err);
      throw err;
    } finally {
      inFlightEnsureRequests.delete(userId);
    }
  })();

  inFlightEnsureRequests.set(userId, promise);
  return promise;
}

export async function loadProfileWithRetry(
  userId: string,
  retries = 2,
  client: SupabaseClient = supabase,
  customShopName?: string
): Promise<UserProfile | null> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(
        ensureOwnerProfile(userId, customShopName, client),
        TIMEOUTS.PROFILE_MS,
        'ensureOwnerProfile timed out'
      );
    } catch (err) {
      lastError = err;
      logError(`loadProfile attempt ${attempt} failed`, err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Could not create or load the user profile.');
}

export async function updateProfileLogo(
  userId: string,
  logoUrl: string | null,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ shop_logo_url: logoUrl })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateProfileDetails(
  userId: string,
  name: string,
  shopId: string,
  shopName: string,
  isOwner: boolean,
  client: SupabaseClient = supabase
): Promise<void> {
  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('Name is required.');
  const trimmedShopName = shopName.trim();
  if (isOwner && !trimmedShopName) throw new Error('Shop name is required.');

  let resolvedShopId = shopId;
  if (isOwner && !resolvedShopId) {
    const shops = await getUserShops(userId, client);
    if (shops.length > 0) {
      resolvedShopId = shops[0].id;
    } else {
      const shop = await createShop(userId, trimmedShopName, '', client);
      resolvedShopId = shop.id;
    }
  }

  const profileUpdate: Record<string, string> = { name: trimmedName };
  if (isOwner && resolvedShopId !== shopId) profileUpdate.shop_id = resolvedShopId;
  const { data: profileData, error: profileError } = await client
    .from('profiles')
    .update(profileUpdate)
    .eq('id', userId)
    .select('id')
    .maybeSingle();
  if (profileError) throw profileError;
  if (!profileData) throw new Error('User name could not be updated. Check profile permissions.');

  if (isOwner) {
    if (!resolvedShopId) throw new Error('Shop profile is missing. Please sign in again.');

    const { data: shopData, error: shopError } = await client
      .from('shops')
      .update({ shop_name: trimmedShopName })
      .eq('id', resolvedShopId)
      .eq('owner_id', userId)
      .select('id')
      .maybeSingle();
    if (shopError) throw shopError;
    if (!shopData) throw new Error('Shop name could not be updated. Check owner permissions.');
  }
}
