/**
 * Data-access layer for Sellers.
 * Follows the same conventions as customerRepository.ts / repairRepository.ts:
 *   - requireUserContext() for auth + shop scoping
 *   - applyShopOrUserFilter() for RLS-compatible queries
 *   - handleRepositoryError() for uniform error wrapping
 */

import { supabase } from '../lib/supabase';
import type { Seller, SellerInput } from '../types/seller';
import {
  applyShopOrUserFilter,
  getNowIso,
  handleRepositoryError,
  requireUserContext,
} from './helpers';

function rowToSeller(row: Record<string, unknown>): Seller {
  return {
    id: Number(row.id),
    sellerName: String(row.seller_name ?? '').trim(),
    phone: String(row.phone ?? ''),
    createdBy: String(row.created_by ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

/** Fetch all sellers visible to the current user/shop, ordered by name. */
export async function getAllSellers(): Promise<Seller[]> {
  try {
    const ctx = await requireUserContext();
    let query = supabase
      .from('sellers')
      .select('*')
      .order('seller_name', { ascending: true });
    query = applyShopOrUserFilter(query, ctx);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => rowToSeller(r));
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch sellers');
  }
}

/**
 * Insert a new seller.
 * Duplicate prevention: trims name and checks case-insensitively before inserting.
 * Returns the existing seller if a match is found (idempotent).
 */
export async function insertSeller(input: SellerInput): Promise<Seller> {
  try {
    const ctx = await requireUserContext();
    const now = getNowIso();
    const normalizedName = input.sellerName.trim();

    // Case-insensitive duplicate check
    let checkQuery = supabase
      .from('sellers')
      .select('*')
      .ilike('seller_name', normalizedName)
      .limit(1);
    checkQuery = applyShopOrUserFilter(checkQuery, ctx);
    const { data: existing } = await checkQuery;
    if (existing && existing.length > 0) {
      return rowToSeller(existing[0] as Record<string, unknown>);
    }

    const payload: Record<string, unknown> = {
      seller_name: normalizedName,
      phone: input.phone?.trim() ?? '',
      user_id: ctx.userId,
      shop_id: ctx.shopId || null,
      created_by: ctx.userId,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('sellers')
      .insert(payload as any)
      .select('*')
      .single();
    if (error) throw error;
    return rowToSeller(data as Record<string, unknown>);
  } catch (err) {
    handleRepositoryError(err, 'Failed to create seller');
  }
}
