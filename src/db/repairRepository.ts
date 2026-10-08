import { supabase } from '../lib/supabase';
import type { LockType, Repair, RepairInput, RepairStatus } from '../types/repair';
import { orderCodeFromRepairId } from '../utils/orderCode';
import { removeAllRepairImages } from '../utils/repairImageUpload';
import {
  applyShopOrUserFilter,
  getNowIso,
  handleRepositoryError,
  requireUserContext,
  requireUserId,
  safeInsert,
} from './helpers';

export function rowToRepair(row: Record<string, unknown>): Repair {
  return {
    id: Number(row.id),
    orderCode: String(row.order_code ?? '').trim() || orderCodeFromRepairId(Number(row.id)),
    customerName: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    deviceModel: String(row.device_model ?? ''),
    imei: String(row.imei ?? ''),
    lockType: (String(row.lock_type ?? '') as LockType) || '',
    lockValue: String(row.lock_value ?? ''),
    problem: String(row.problem ?? ''),
    warranty: String(row.warranty ?? ''),
    dateReceived: String(row.date_received ?? '').slice(0, 10),
    status: (row.status as RepairStatus) || 'pending',
    repairCost: Number(row.repair_cost ?? 0),
    expense: Number(row.expense ?? 0),
    advanceAmount: Number(row.advance_amount ?? 0),
    isPaid: Boolean(row.is_paid),
    imagePhoneFront: String(row.image_phone_front ?? ''),
    imagePhoneBack: String(row.image_phone_back ?? ''),
    imageThumbnail: String(row.image_thumbnail ?? ''),
    imageId1: String(row.image_id_1 ?? ''),
    imageId2: String(row.image_id_2 ?? ''),
    accSimTray: Boolean(row.acc_sim_tray),
    accBackCover: Boolean(row.acc_back_cover),
    paymentType: (row.payment_type as 'cash' | 'online') || 'cash',
    sellerId: row.seller_id != null ? Number(row.seller_id) : null,
    createdBy: String(row.created_by ?? ''),
    createdByName: '',
    createdByRole: (row.created_by_role as 'owner' | 'labour') ?? null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export function mapInputToRow(input: RepairInput): Record<string, any> {
  return {
    customer_name: input.customerName,
    phone: input.phone,
    device_model: input.deviceModel,
    imei: input.imei,
    lock_type: input.lockType,
    lock_value: input.lockValue,
    problem: input.problem,
    warranty: input.warranty,
    date_received: input.dateReceived,
    status: input.status,
    repair_cost: input.repairCost,
    expense: input.expense,
    advance_amount: input.advanceAmount,
    is_paid: input.isPaid,
    image_phone_front: input.imagePhoneFront,
    image_phone_back: input.imagePhoneBack,
    image_thumbnail: input.imageThumbnail,
    image_id_1: input.imageId1,
    image_id_2: input.imageId2,
    acc_sim_tray: input.accSimTray,
    acc_back_cover: input.accBackCover,
    payment_type: input.paymentType,
    seller_id: input.sellerId ?? null,
  };
}

export async function deleteRepair(repairId: number): Promise<void> {
  try {
    const ctx = await requireUserContext();

    // Delete the row first: if storage cleanup fails afterwards the repair is
    // still gone (the previous order could leave a repair pointing at images
    // that had already been removed).
    let query = supabase.from('repairs').delete().eq('id', repairId);
    query = applyShopOrUserFilter(query, ctx);
    const { error } = await query;
    if (error) throw error;

    await removeAllRepairImages(ctx.userId, repairId);
  } catch (err) {
    handleRepositoryError(err, 'Failed to delete repair');
  }
}

// PostgREST caps a single response at `max-rows` (default 1000), so a plain
// `.limit(5000)` silently truncates. Page through with `.range()` instead.
const REPAIRS_PAGE_SIZE = 1000;
const REPAIRS_MAX = 20000;

async function fetchAllRepairRows(ctx: { userId: string; shopId: string }): Promise<Record<string, unknown>[]> {
  const rows: Record<string, unknown>[] = [];

  for (let from = 0; from < REPAIRS_MAX; from += REPAIRS_PAGE_SIZE) {
    let pageQuery = supabase
      .from('repairs')
      .select('*')
      .order('date_received', { ascending: false })
      .order('id', { ascending: false })
      .range(from, from + REPAIRS_PAGE_SIZE - 1);

    pageQuery = applyShopOrUserFilter(pageQuery, ctx);

    const { data, error } = await pageQuery;
    if (error) throw error;

    const page = data ?? [];
    rows.push(...page);
    if (page.length < REPAIRS_PAGE_SIZE) break;
  }

  return rows;
}

export async function getAllRepairs(): Promise<Repair[]> {
  try {
    const ctx = await requireUserContext();
    const rows = await fetchAllRepairRows(ctx);
    const repairs = rows.map((r) => rowToRepair(r));

    if (repairs.length > 0 && ctx.shopId) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, role')
        .eq('shop_id', ctx.shopId);
      if (profiles) {
        const profileMap = new Map<string, Record<string, unknown>>(
          profiles.map((p: Record<string, unknown>) => [String(p.id), p])
        );
        for (const repair of repairs) {
          const p = profileMap.get(repair.createdBy);
          if (p) {
            repair.createdByName = String(p.name || (p.role === 'owner' ? 'Owner' : 'Staff'));
          }
        }
      }
    }

    return repairs;
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch repairs');
  }
}

export async function getPaginatedRepairs(page = 1, limit = 50): Promise<{ data: Repair[]; hasMore: boolean }> {
  try {
    const ctx = await requireUserContext();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('repairs')
      .select('*', { count: 'exact' })
      .order('date_received', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to);

    query = applyShopOrUserFilter(query, ctx);

    const { data, error, count } = await query;
    if (error) throw error;

    const repairs = (data ?? []).map((r: Record<string, unknown>) => rowToRepair(r));
    const hasMore = count ? from + repairs.length < count : repairs.length === limit;

    return { data: repairs, hasMore };
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch paginated repairs');
  }
}

export async function searchRepairs(query: string): Promise<Repair[]> {
  try {
    const sanitized = query.replace(/[%_,]/g, '').trim();
    if (!sanitized) return [];
    await requireUserId();
    const { data, error } = await supabase.rpc('search_repairs_for_user', { p_query: sanitized });
    if (error) throw error;
    return (data ?? []).map((r: Record<string, unknown>) => rowToRepair(r));
  } catch (err) {
    handleRepositoryError(err, 'Failed to search repairs');
  }
}

export async function getRepairById(id: number): Promise<Repair | null> {
  try {
    const ctx = await requireUserContext();
    let query = supabase
      .from('repairs')
      .select('*')
      .eq('id', id);

    query = applyShopOrUserFilter(query, ctx);

    const { data, error } = await query.maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const repair = rowToRepair(data as Record<string, unknown>);

    if (repair.createdBy) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', repair.createdBy)
        .maybeSingle();
      if (profile) {
        repair.createdByName = profile.name || (profile.role === 'owner' ? 'Owner' : 'Staff');
      }
    }
    return repair;
  } catch (err) {
    handleRepositoryError(err, 'Failed to get repair by ID');
  }
}

export async function insertRepair(input: RepairInput): Promise<number> {
  try {
    const { userId, shopId } = await requireUserContext();
    const now = getNowIso();

    const payload = {
      ...mapInputToRow(input),
      user_id: userId,
      shop_id: shopId || null,
      created_by: userId,
      order_code: '',
      created_at: now,
      updated_at: now,
    };

    const data = await safeInsert(payload);
    const newId = Number(data?.id);
    if (!Number.isFinite(newId) || newId <= 0) {
      throw new Error('Repair was created but no id was returned.');
    }

    // Best-effort: the row already exists, so a failed order_code write must
    // NOT throw — otherwise the caller retries and creates a duplicate repair.
    try {
      await supabase
        .from('repairs')
        .update({ order_code: orderCodeFromRepairId(newId) })
        .eq('id', newId);
    } catch (err) {
      console.warn('[insertRepair] Could not set order_code for repair', newId, err);
    }

    return newId;
  } catch (err) {
    handleRepositoryError(err, 'Failed to insert repair');
  }
}

export async function updateRepairStatus(
  id: number,
  status: RepairStatus,
  paymentUpdate?: { isPaid: boolean; paymentType?: 'cash' | 'online' }
): Promise<void> {
  try {
    const ctx = await requireUserContext();
    const now = getNowIso();
    const updatePayload: Record<string, any> = { status, updated_at: now };
    if (paymentUpdate) {
      updatePayload.is_paid = paymentUpdate.isPaid;
      if (paymentUpdate.paymentType) {
        updatePayload.payment_type = paymentUpdate.paymentType;
      }
    }

    let query = supabase.from('repairs').update(updatePayload).eq('id', id);
    query = applyShopOrUserFilter(query, ctx);

    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    handleRepositoryError(err, 'Failed to update repair status');
  }
}

export async function updateRepair(input: RepairInput & { id: number }): Promise<void> {
  try {
    const ctx = await requireUserContext();
    const now = getNowIso();

    const payload = {
      ...mapInputToRow(input),
      order_code: input.orderCode,
      updated_at: now,
    };

    // Apply the same scope as every other query so shop-less owners can update
    // their own repairs (`.eq('shop_id', null)` never matches a NULL column).
    let query = supabase.from('repairs').update(payload).eq('id', input.id);
    query = applyShopOrUserFilter(query, ctx);
    const { error } = await query;
    if (error) throw error;
  } catch (err) {
    handleRepositoryError(err, 'Failed to update repair');
  }
}
