import type { DirectoryCustomer } from '../types/customer';
import { supabase } from '../lib/supabase';
import type { LockType, Repair, RepairInput, RepairStatus } from '../types/repair';
import { orderCodeFromRepairId } from '../utils/orderCode';
import { removeAllRepairImages } from '../utils/repairImageUpload';
import type { InventoryItem, InventoryInput } from '../types/inventory';
import type { UserProfile, UserRole } from '../types/profile';

// ------------------------------------------------------------------
// AUTH HELPERS
// ------------------------------------------------------------------

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not signed in');
  return user.id;
}

async function requireUserContext(): Promise<{ userId: string; shopId: string }> {
  const userId = await requireUserId();
  const { data } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', userId)
    .maybeSingle();
  const shopId = data?.shop_id ?? '';
  return { userId, shopId };
}

// ------------------------------------------------------------------
// PROFILE / LABOUR
// ------------------------------------------------------------------

export async function getShopLabourList(): Promise<UserProfile[]> {
  const { shopId } = await requireUserContext();
  if (!shopId) return [];
  
  let { data, error } = await supabase
    .from('profiles')
    .select('id, name, username, phone, role, shop_id')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: true });

  if (error && (error.message.includes('column') || error.message.includes('does not exist'))) {
    console.warn('[getShopLabourList] Retrying without username column...');
    const retry = await supabase
      .from('profiles')
      .select('id, name, phone, role, shop_id')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: true });
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[getShopLabourList] Error:', error);
  }
  if (error || !data) return [];
  return data.map((row: any) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    username: row.username ? String(row.username) : undefined,
    phone: String(row.phone ?? ''),
    role: (row.role as UserRole) || 'owner',
    shopId: String(row.shop_id ?? ''),
  }));
}

export async function deleteLabourUser(labourUserId: string): Promise<void> {
  // Only delete the profile row — the auth user remains but can't access the shop
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', labourUserId);
  if (error) throw new Error('Failed to remove labour: ' + error.message);
}

export async function updateLabourUser(labourUserId: string, name: string, phone: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ name: name.trim(), phone: phone.trim() })
    .eq('id', labourUserId);
  if (error) throw new Error('Failed to update labour: ' + error.message);
}

// ------------------------------------------------------------------
// REPAIRS — row mapper
// ------------------------------------------------------------------

function rowToRepair(row: Record<string, unknown>): Repair {
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
    createdBy: String(row.created_by ?? ''),
    createdByName: '', // populated separately if needed
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

function mapInputToRow(input: RepairInput): Record<string, any> {
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
  };
}

function getMissingColumn(message: string): string | null {
  const match = message.match(/Could not find the '([^']+)' column/) ||
                message.match(/column "([^"]+)" of relation/);
  return match ? match[1] : null;
}

// ------------------------------------------------------------------
// REPAIRS — CRUD
// ------------------------------------------------------------------

export async function deleteRepair(repairId: number): Promise<void> {
  const userId = await requireUserId();
  await removeAllRepairImages(userId, repairId);
  const { error } = await supabase
    .from('repairs')
    .delete()
    .eq('id', repairId);
  if (error) throw new Error('Failed to delete repair');
}

export async function getDirectoryCustomers(limit = 300): Promise<DirectoryCustomer[]> {
  const { shopId } = await requireUserContext();
  const safeLimit = Math.min(500, Math.max(1, Math.floor(Number(limit))));
  const query = supabase
    .from('repairs')
    .select('phone, customer_name, device_model, updated_at')
    .order('updated_at', { ascending: false })
    .limit(2000);
  // Filter by shop if available, otherwise fall back to user_id
  if (shopId) {
    query.eq('shop_id', shopId);
  } else {
    const userId = await requireUserId();
    query.eq('user_id', userId);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  const seen = new Set<string>();
  const out: DirectoryCustomer[] = [];
  for (const row of data) {
    const phone = String(row.phone ?? '');
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);
    out.push({
      phone,
      customerName: String(row.customer_name ?? ''),
      deviceModel: String(row.device_model ?? ''),
    });
    if (out.length >= safeLimit) break;
  }
  return out;
}

export async function getAllRepairs(): Promise<Repair[]> {
  const { shopId } = await requireUserContext();
  const query = supabase
    .from('repairs')
    .select('*')
    .order('date_received', { ascending: false })
    .order('id', { ascending: false });

  if (shopId) {
    query.eq('shop_id', shopId);
  } else {
    const userId = await requireUserId();
    query.eq('user_id', userId);
  }
  const { data, error } = await query;
  if (error) throw error;

  const repairs = (data ?? []).map((r: any) => rowToRepair(r as Record<string, unknown>));

  // Populate createdByName from profiles
  if (repairs.length > 0 && shopId) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, role')
      .eq('shop_id', shopId);
    if (profiles) {
      const profileMap = new Map<string, any>(profiles.map((p: any) => [p.id, p]));
      for (const repair of repairs) {
        const p = profileMap.get(repair.createdBy) as any;
        if (p) {
          repair.createdByName = (p.name as string) || ((p.role as string) === 'owner' ? 'Owner' : 'Staff');
        }
      }
    }
  }

  return repairs;
}

export async function searchRepairs(query: string): Promise<Repair[]> {
  const sanitized = query.replace(/[%_,]/g, '').trim();
  if (!sanitized) return getAllRepairs();
  await requireUserId();
  const { data, error } = await supabase.rpc('search_repairs_for_user', { p_query: sanitized });
  if (error) throw error;
  return (data ?? []).map((r: Record<string, unknown>) => rowToRepair(r));
}

export async function getRepairById(id: number): Promise<Repair | null> {
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const repair = rowToRepair(data as Record<string, unknown>);

  // Populate createdByName
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
}

async function safeInsert(payload: Record<string, any>, retryCount = 0): Promise<any> {
  if (retryCount > 10) {
    throw new Error('Too many schema discrepancy retries');
  }
  const { data, error } = await supabase
    .from('repairs')
    .insert(payload)
    .select('id')
    .single();

  if (error) {
    const columnName = getMissingColumn(error.message);
    if (columnName) {
      const nextPayload = { ...payload };
      delete nextPayload[columnName];
      return safeInsert(nextPayload, retryCount + 1);
    }
    throw error;
  }
  return data;
}

async function safeUpdate(id: number, payload: Record<string, any>, retryCount = 0): Promise<any> {
  if (retryCount > 10) {
    throw new Error('Too many schema discrepancy retries');
  }
  const { error } = await supabase
    .from('repairs')
    .update(payload)
    .eq('id', id);

  if (error) {
    const columnName = getMissingColumn(error.message);
    if (columnName) {
      const nextPayload = { ...payload };
      delete nextPayload[columnName];
      return safeUpdate(id, nextPayload, retryCount + 1);
    }
    throw error;
  }
}

export async function insertRepair(input: RepairInput): Promise<number> {
  const { userId, shopId } = await requireUserContext();
  const now = new Date().toISOString();

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
  const orderCode = orderCodeFromRepairId(newId);
  await safeUpdate(newId, { order_code: orderCode });
  return newId;
}

export async function updateRepairStatus(id: number, status: RepairStatus): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('repairs')
    .update({ status, updated_at: now })
    .eq('id', id);
  if (error) throw error;
}

export async function updateRepair(input: RepairInput & { id: number }): Promise<void> {
  const now = new Date().toISOString();

  const payload = {
    ...mapInputToRow(input),
    order_code: input.orderCode,
    updated_at: now,
  };

  await safeUpdate(input.id, payload);
}

// ------------------------------------------------------------------
// INVENTORY
// ------------------------------------------------------------------

function rowToInventory(row: Record<string, unknown>): InventoryItem {
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
  const { shopId } = await requireUserContext();
  const query = supabase
    .from('inventory')
    .select('*')
    .order('name', { ascending: true });
  if (shopId) {
    query.eq('shop_id', shopId);
  } else {
    const userId = await requireUserId();
    query.eq('user_id', userId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: any) => rowToInventory(r as Record<string, unknown>));
}

export async function insertInventoryItem(input: InventoryInput): Promise<number> {
  const { userId, shopId } = await requireUserContext();
  const now = new Date().toISOString();

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
}

export async function updateInventoryItem(input: InventoryInput & { id: number }): Promise<void> {
  const now = new Date().toISOString();

  const payload = {
    name: input.name,
    sku: input.sku,
    stock_count: input.stockCount,
    price: input.price,
    updated_at: now,
  };

  const { error } = await supabase
    .from('inventory')
    .update(payload)
    .eq('id', input.id);

  if (error) throw error;
}

export async function deleteInventoryItem(id: number): Promise<void> {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', id);
  if (error) throw error;
}
