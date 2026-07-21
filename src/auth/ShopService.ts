import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { DEFAULT_SHOP_NAME, ERROR_MESSAGES } from './constants';

export interface ShopRow {
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
  client: SupabaseClient = supabase
): Promise<ShopRow> {
  const payload = {
    shop_name: shopName,
    owner_id: userId,
  };

  const { data: newShop, error } = await client
    .from('shops')
    .insert(payload)
    .select('id, shop_name, owner_id')
    .single();

  if (error || !newShop) {
    throw new Error(`${ERROR_MESSAGES.CREATE_SHOP_FAILED}${error?.message ?? 'unknown'}`);
  }

  return newShop as ShopRow;
}

export async function resolveActiveShop(
  userId: string,
  client: SupabaseClient = supabase
): Promise<{ activeShopId: string }> {
  const userShops = await getUserShops(userId, client);

  if (userShops.length > 0) {
    return { activeShopId: userShops[0].id };
  }

  const newShop = await createShop(userId, DEFAULT_SHOP_NAME, client);
  return { activeShopId: newShop.id };
}
