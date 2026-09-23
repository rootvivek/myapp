import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEFAULT_SHOP_NAME, ERROR_MESSAGES } from './constants';

interface ShopRow {
  id: string;
  shop_name: string;
  owner_id?: string;
}

export async function getUserShops(
  userId: string,
  client: SupabaseClient = supabase
): Promise<ShopRow[]> {
  const { data: userShops, error } = await client
    .from('shops')
    .select('id, shop_name')
    .eq('owner_id', userId);

  if (error) throw error;
  return (userShops as ShopRow[]) || [];
}

export async function createShop(
  userId: string,
  shopName: string = DEFAULT_SHOP_NAME,
  phone: string = '',
  client: SupabaseClient = supabase
): Promise<ShopRow> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user || user.id !== userId) {
    throw new Error('Supabase session is invalid during signup. Please sign out and sign in again.');
  }

  const payload: Record<string, string> = {
    shop_name: shopName,
    owner_id: userId,
  };

  // Only include phone if it has a value; older schemas may not have the column.
  if (phone.trim()) {
    payload.phone = phone.trim();
  }

  let lastErrorMessage = '';

  // Retry once on failure (handles JWT propagation delays for new users)
  for (let attempt = 0; attempt < 2; attempt++) {
    // Re-check first so retries/trigger races never create duplicate shops.
    try {
      const existing = await getUserShops(userId, client);
      if (existing.length > 0) return existing[0];
    } catch {
      // Lookup can fail on a stale session; the insert below will surface it.
    }

    const { data: newShop, error } = await client
      .from('shops')
      .insert(payload)
      .select('id, shop_name, owner_id')
      .single();

    if (!error && newShop) {
      return newShop as ShopRow;
    }

    lastErrorMessage = error?.message ?? 'unknown error';

    // The insert can succeed while RETURNING/SELECT is blocked by RLS (PGRST116).
    // Re-query before treating this as a failure so we don't lose the shop id.
    if (error) {
      try {
        const existing = await getUserShops(userId, client);
        if (existing.length > 0) return existing[0];
      } catch {
        // ignore and report the original insert error
      }
    }

    if (attempt === 0) {
      // Wait and retry once
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }
  }

  const isSessionOrAuthIssue =
    lastErrorMessage.includes('foreign key constraint') ||
    lastErrorMessage.includes('shops_owner_id_fkey') ||
    lastErrorMessage.includes('violates row-level security') ||
    lastErrorMessage.includes('auth.uid()') ||
    lastErrorMessage.includes('JWT') ||
    lastErrorMessage.includes('session');

  if (isSessionOrAuthIssue) {
    throw new Error('Supabase session is invalid during signup. Please sign out and sign in again.');
  }
  throw new Error(`${ERROR_MESSAGES.CREATE_SHOP_FAILED}${lastErrorMessage || 'unknown'}`);
}
