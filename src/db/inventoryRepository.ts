import { supabase } from '../lib/supabase';
import type { InventoryInput, InventoryItem } from '../types/inventory';
import {
  applyShopOrUserFilter,
  getNowIso,
  handleRepositoryError,
  requireUserContext,
} from './helpers';

export function rowToInventory(row: Record<string, unknown>): InventoryItem {
  return {
    id: Number(row.id),
    name: String(row.name ?? ''),
    sku: String(row.sku ?? ''),
    stockCount: Number(row.stock_count ?? 0),
    price: Number(row.price ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function getAllInventory(): Promise<InventoryItem[]> {
  try {
    const ctx = await requireUserContext();
    let query = supabase.from('inventory').select('*').order('name', { ascending: true });

    query = applyShopOrUserFilter(query, ctx);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => rowToInventory(r));
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch inventory');
  }
}

export async function insertInventoryItem(input: InventoryInput): Promise<number> {
  try {
    const { userId, shopId } = await requireUserContext();
    const now = getNowIso();

    const payload = {
      user_id: userId,
      shop_id: shopId || null,
      name: input.name,
      sku: input.sku,
      stock_count: input.stockCount,
      price: input.price,
      created_at: now,
      updated_at: now,
    };

    const { data, error } = await supabase
      .from('inventory')
      .insert(payload)
      .select('id')
      .single();

    if (error) throw error;
    return Number(data.id);
  } catch (err) {
    handleRepositoryError(err, 'Failed to insert inventory item');
  }
}

export async function updateInventoryItem(input: InventoryInput & { id: number }): Promise<void> {
  try {
    const ctx = await requireUserContext();
    const now = getNowIso();

    const payload = {
      name: input.name,
      sku: input.sku,
      stock_count: input.stockCount,
      price: input.price,
      updated_at: now,
    };

    let query = supabase.from('inventory').update(payload).eq('id', input.id);
    query = applyShopOrUserFilter(query, ctx);

    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    handleRepositoryError(err, 'Failed to update inventory item');
  }
}

export async function deleteInventoryItem(id: number): Promise<void> {
  try {
    const ctx = await requireUserContext();
    let query = supabase.from('inventory').delete().eq('id', id);
    query = applyShopOrUserFilter(query, ctx);

    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    handleRepositoryError(err, 'Failed to delete inventory item');
  }
}

/** True when the RPC is missing from the database (migration not applied yet). */
function isMissingFunctionError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();
  return (
    code === '42883' ||
    code === 'PGRST202' ||
    message.includes('does not exist') ||
    message.includes('could not find the function')
  );
}

/**
 * Decrement stock in a single atomic, shop-scoped statement. Falls back to a
 * scoped read-modify-write only when the RPC migration is not installed yet.
 */
export async function deductInventoryStock(inventoryItemId: number, quantity = 1): Promise<void> {
  try {
    const { error } = await supabase.rpc('deduct_inventory_stock', {
      p_item_id: inventoryItemId,
      p_quantity: quantity,
    });

    if (!error) return;

    if (!isMissingFunctionError(error)) {
      // Non-fatal: a stock update failure shouldn't block the repair save.
      console.warn('[deductInventoryStock] Failed to update stock:', error.message);
      return;
    }

    await deductInventoryStockFallback(inventoryItemId, quantity);
  } catch (err) {
    console.warn('[deductInventoryStock] Failed:', err);
  }
}

async function deductInventoryStockFallback(inventoryItemId: number, quantity: number): Promise<void> {
  const ctx = await requireUserContext();

  let readQuery = supabase
    .from('inventory')
    .select('stock_count')
    .eq('id', inventoryItemId);
  readQuery = applyShopOrUserFilter(readQuery, ctx);

  const { data, error } = await readQuery.maybeSingle();
  if (error || !data) return;

  const currentStock = Number(data.stock_count) || 0;
  const newStock = Math.max(0, currentStock - quantity);

  let writeQuery = supabase
    .from('inventory')
    .update({ stock_count: newStock, updated_at: getNowIso() })
    .eq('id', inventoryItemId);
  writeQuery = applyShopOrUserFilter(writeQuery, ctx);

  const { error: updateErr } = await writeQuery;
  if (updateErr) {
    console.warn('[deductInventoryStock] Failed to update stock:', updateErr.message);
  }
}

