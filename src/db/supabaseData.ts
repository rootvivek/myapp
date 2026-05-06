import type { DirectoryCustomer } from '../types/customer';
import { supabase } from '../lib/supabase';
import type { Repair, RepairInput, RepairStatus } from '../types/repair';
import { orderCodeFromRepairId } from '../utils/orderCode';

async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not signed in');
  return user.id;
}

function rowToRepair(row: Record<string, unknown>): Repair {
  return {
    id: Number(row.id),
    orderCode: String(row.order_code ?? '').trim() || orderCodeFromRepairId(Number(row.id)),
    customerName: String(row.customer_name ?? ''),
    phone: String(row.phone ?? ''),
    deviceModel: String(row.device_model ?? ''),
    imei: String(row.imei ?? ''),
    problem: String(row.problem ?? ''),
    dateReceived: String(row.date_received ?? '').slice(0, 10),
    status: row.status as RepairStatus,
    repairCost: Number(row.repair_cost ?? 0),
    advanceAmount: Number(row.advance_amount ?? 0),
    isPaid: Boolean(row.is_paid),
    imagePhoneFront: String(row.image_phone_front ?? ''),
    imagePhoneBack: String(row.image_phone_back ?? ''),
    imageThumbnail: String(row.image_thumbnail ?? ''),
    imageId1: String(row.image_id_1 ?? ''),
    imageId2: String(row.image_id_2 ?? ''),
    accSimTray: Boolean(row.acc_sim_tray),
    accBackCover: Boolean(row.acc_back_cover),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function deleteRepair(repairId: number): Promise<void> {
  const userId = await requireUserId();
  const { error } = await supabase
    .from('repairs')
    .delete()
    .eq('id', repairId)
    .eq('user_id', userId);
  if (error) throw new Error('Failed to delete repair');
}

export async function getDirectoryCustomers(limit = 300): Promise<DirectoryCustomer[]> {
  const userId = await requireUserId();
  const safeLimit = Math.min(500, Math.max(1, Math.floor(Number(limit))));
  const { data, error } = await supabase
    .from('repairs')
    .select('phone, customer_name, device_model, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(2000);
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
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('user_id', userId)
    .order('date_received', { ascending: false })
    .order('id', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => rowToRepair(r as Record<string, unknown>));
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
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('user_id', userId)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return rowToRepair(data as Record<string, unknown>);
}

export async function insertRepair(input: RepairInput): Promise<number> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('repairs')
    .insert({
      user_id: userId,
      order_code: '',
      customer_name: input.customerName,
      phone: input.phone,
      device_model: input.deviceModel,
      imei: input.imei,
      problem: input.problem,
      date_received: input.dateReceived,
      status: input.status,
      repair_cost: input.repairCost,
      advance_amount: input.advanceAmount,
      is_paid: input.isPaid,
      image_phone_front: input.imagePhoneFront,
      image_phone_back: input.imagePhoneBack,
      image_thumbnail: input.imageThumbnail,
      image_id_1: input.imageId1,
      image_id_2: input.imageId2,
      acc_sim_tray: input.accSimTray,
      acc_back_cover: input.accBackCover,
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single();
  if (error) throw error;
  const newId = Number(data?.id);
  const orderCode = orderCodeFromRepairId(newId);
  await supabase.from('repairs').update({ order_code: orderCode }).eq('id', newId).eq('user_id', userId);
  return newId;
}

export async function updateRepairStatus(id: number, status: RepairStatus): Promise<void> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('repairs')
    .update({ status, updated_at: now })
    .eq('id', id)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function updateRepair(input: RepairInput & { id: number }): Promise<void> {
  const userId = await requireUserId();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('repairs')
    .update({
      customer_name: input.customerName,
      phone: input.phone,
      device_model: input.deviceModel,
      imei: input.imei,
      problem: input.problem,
      date_received: input.dateReceived,
      status: input.status,
      repair_cost: input.repairCost,
      advance_amount: input.advanceAmount,
      is_paid: input.isPaid,
      image_phone_front: input.imagePhoneFront,
      image_phone_back: input.imagePhoneBack,
      image_thumbnail: input.imageThumbnail,
      image_id_1: input.imageId1,
      image_id_2: input.imageId2,
      acc_sim_tray: input.accSimTray,
      acc_back_cover: input.accBackCover,
      order_code: input.orderCode,
      updated_at: now,
    })
    .eq('id', input.id)
    .eq('user_id', userId);
  if (error) throw error;
}
