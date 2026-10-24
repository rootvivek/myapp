import { supabase } from '../lib/supabase';
import type { BuySellRecord, BuySellInput, BuySellType } from '../types/buySell';
import { orderCodeFromRepairId } from '../utils/orderCode';
import {
  applyShopOrUserFilter,
  getNowIso,
  handleRepositoryError,
  requireUserContext,
} from './helpers';

export function rowToBuySell(row: Record<string, unknown>): BuySellRecord {
  return {
    id: Number(row.id),
    orderCode: String(row.order_code ?? '').trim() || orderCodeFromRepairId(Number(row.id)),
    type: (row.type as BuySellType) || 'buy',
    customerName: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    deviceModel: String(row.device_model ?? ''),
    imei: String(row.imei ?? ''),
    price: Number(row.price ?? 0),
    notes: String(row.notes ?? ''),
    date: String(row.date ?? '').slice(0, 10),
    deviceImage: String(row.device_image ?? ''),
    idProofImage: String(row.id_proof_image ?? ''),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function mapBuySellInputToRow(input: BuySellInput): Record<string, any> {
  return {
    type: input.type,
    customer_name: input.customerName,
    phone: input.phone,
    device_model: input.deviceModel,
    imei: input.imei,
    price: input.price,
    notes: input.notes,
    date: input.date || getNowIso().slice(0, 10),
    device_image: input.deviceImage || '',
    id_proof_image: input.idProofImage || '',
  };
}

export async function getBuySellRecords(): Promise<BuySellRecord[]> {
  try {
    const ctx = await requireUserContext();
    let query = supabase.from('buy_sell_records').select('*').order('created_at', { ascending: false });
    query = applyShopOrUserFilter(query, ctx);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => rowToBuySell(r));
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch buy/sell records');
    return [];
  }
}

export async function insertBuySellRecord(input: BuySellInput): Promise<BuySellRecord> {
  try {
    const ctx = await requireUserContext();
    const now = getNowIso();
    const row = {
      ...mapBuySellInputToRow(input),
      user_id: ctx.userId,
      shop_id: ctx.shopId || null,
      created_by: ctx.userId,
      order_code: '',
      created_at: now,
      updated_at: now,
    };
    const { data, error } = await supabase
      .from('buy_sell_records')
      .insert(row as any)
      .select('*')
      .single();
    if (error) throw error;
    return rowToBuySell(data as Record<string, unknown>);
  } catch (err) {
    handleRepositoryError(err, 'Failed to create buy/sell record');
  }
}

