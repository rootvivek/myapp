import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/profile';
import { saveShopBranding } from '../utils/shopSettings';
import { DEFAULT_SHOP_NAME, ERROR_MESSAGES, TIMEOUTS } from './constants';
import { logError, withTimeout } from './helpers';
import { createShop } from './ShopService';

// Single in-flight tracker to prevent concurrent ensureOwnerProfile calls
const inFlightEnsureRequests = new Map<string, Promise<UserProfile>>();

export async function fetchProfile(
  userId: string,
  client: SupabaseClient = supabase
): Promise<UserProfile | null> {
  try {
    let queryResult = await withTimeout(
      client
        .from('profiles')
        .select('id, name, username, phone, role, shop_id, shops!profiles_shop_id_fkey(shop_name)')
        .eq('id', userId)
        .maybeSingle() as unknown as Promise<any>,
      TIMEOUTS.QUERY_MS,
      'profiles table select timed out'
    );

    let data = queryResult.data;
    let error = queryResult.error;

    // Fallback if username column doesn't exist yet
    if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
      logError('fetchProfile', 'Retrying fetch without username column');
      const retryResult = await withTimeout(
        client
          .from('profiles')
          .select('id, name, phone, role, shop_id, shops!profiles_shop_id_fkey(shop_name)')
          .eq('id', userId)
          .maybeSingle() as unknown as Promise<any>,
        TIMEOUTS.QUERY_MS,
        'profiles table fallback select timed out'
      );
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) {
      if (error) logError('fetchProfile error', error);
      return null;
    }

    const shopsVal = data.shops;
    let dbShopName = '';
    if (shopsVal) {
      if (Array.isArray(shopsVal)) {
        dbShopName = shopsVal[0]?.shop_name || '';
      } else {
        dbShopName = (shopsVal as any).shop_name || '';
      }
    }

    return {
      id: data.id,
      name: data.name ?? '',
      username: data.username ?? '',
      phone: data.phone ?? '',
      role: (data.role as UserRole) || 'owner',
      shopId: data.shop_id ?? '',
      shopName: dbShopName,
    };
  } catch (err) {
    logError('fetchProfile failed', err);
    return null;
  }
}

export async function ensureOwnerProfile(
  userId: string,
  client: SupabaseClient = supabase
): Promise<UserProfile> {
  // Check if a request for this userId is already in flight
  if (inFlightEnsureRequests.has(userId)) {
    return inFlightEnsureRequests.get(userId)!;
  }

  const promise = (async () => {
    try {
      const existing = await fetchProfile(userId, client);
      if (existing) return existing;

      let name = '';
      try {
        const {
          data: { user },
        } = await client.auth.getUser();
        if (user && user.id === userId && user.user_metadata?.name) {
          name = user.user_metadata.name;
        }
      } catch (e) {
        logError('ensureOwnerProfile metadata', e);
      }

      const shop = await createShop(userId, DEFAULT_SHOP_NAME, client);

      // Create owner profile
      const { error: profErr } = await client.from('profiles').insert({
        id: userId,
        name,
        phone: '',
        role: 'owner',
        shop_id: shop.id,
      });

      if (profErr) {
        throw new Error(`${ERROR_MESSAGES.CREATE_PROFILE_FAILED}${profErr.message}`);
      }

      // Backfill existing unassigned repairs & inventory
      await client
        .from('repairs')
        .update({ shop_id: shop.id, created_by: userId })
        .eq('user_id', userId)
        .is('shop_id', null);

      await client
        .from('inventory')
        .update({ shop_id: shop.id })
        .eq('user_id', userId)
        .is('shop_id', null);

      return {
        id: userId,
        name,
        username: '',
        phone: '',
        role: 'owner' as UserRole,
        shopId: shop.id,
        shopName: shop.shop_name,
      };
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
  client: SupabaseClient = supabase
): Promise<UserProfile | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await withTimeout(
        ensureOwnerProfile(userId, client),
        TIMEOUTS.PROFILE_MS,
        'ensureOwnerProfile timed out'
      );
    } catch (err) {
      logError(`loadProfile attempt ${attempt} failed`, err);
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }
  }
  return null;
}

export async function updateActiveShop(
  userId: string,
  shopId: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client.from('profiles').update({ shop_id: shopId }).eq('id', userId);
  if (error) throw error;
}

export async function updateProfileName(
  userId: string,
  name: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const { error } = await client
    .from('profiles')
    .update({ name: name.trim() })
    .eq('id', userId);
  if (error) throw error;
}

export async function updateShopName(
  shopId: string,
  shopName: string,
  client: SupabaseClient = supabase
): Promise<void> {
  const trimmed = shopName.trim();
  const { error } = await client
    .from('shops')
    .update({ shop_name: trimmed })
    .eq('id', shopId);

  if (error) throw error;

  await saveShopBranding({ shopName: trimmed });
}
