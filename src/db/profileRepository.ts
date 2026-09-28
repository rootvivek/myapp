import { supabase } from '../lib/supabase';
import type { UserProfile, UserRole } from '../types/profile';
import { logger } from '../utils/logger';
import { requireUserContext } from './helpers';

/**
 * Verify the target user belongs to the caller's shop.
 * Returns the caller's shop_id if authorized, null otherwise.
 */
async function requireSameShop(labourUserId: string): Promise<string | null> {
  const ctx = await requireUserContext();
  if (!ctx.shopId) return null;

  const { data: target } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', labourUserId)
    .maybeSingle();

  if (!target || String(target.shop_id) !== ctx.shopId) return null;
  return ctx.shopId;
}

export async function getShopLabourList(): Promise<UserProfile[]> {
  const { shopId } = await requireUserContext();
  if (!shopId) return [];

  let { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, phone, role, shop_id')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: true });

  if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
    logger.warn('[getShopLabourList] Retrying without username column...');
    const retry = await supabase
      .from('profiles')
      .select('id, name, phone, role, shop_id')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    logger.error('[getShopLabourList] Error:', error);
  }
  if (error || !data) return [];
  return data.map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: row.username ? String(row.username) : undefined,
    phone: String(row.phone ?? ''),
    role: (row.role as UserRole) || 'owner',
    shopId: String(row.shop_id ?? ''),
  }));
}

export async function deleteLabourUser(labourUserId: string): Promise<void> {
  const shopId = await requireSameShop(labourUserId);
  if (!shopId) throw new Error('Unauthorized: user does not belong to your shop');

  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', labourUserId)
    .eq('shop_id', shopId);
  if (error) throw new Error('Failed to remove labour: ' + error.message);
}

export async function updateLabourUser(labourUserId: string, name: string, phone: string): Promise<void> {
  const shopId = await requireSameShop(labourUserId);
  if (!shopId) throw new Error('Unauthorized: user does not belong to your shop');

  const { error } = await supabase
    .from('profiles')
    .update({ name: name.trim(), phone: phone.trim() })
    .eq('id', labourUserId)
    .eq('shop_id', shopId);
  if (error) throw new Error('Failed to update labour: ' + error.message);
}
