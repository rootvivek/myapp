import { supabase } from '../lib/supabase';
import type { DirectoryCustomer } from '../types/customer';
import { applyShopOrUserFilter, handleRepositoryError, requireUserContext } from './helpers';

export async function getDirectoryCustomers(limit = 300): Promise<DirectoryCustomer[]> {
  try {
    const ctx = await requireUserContext();
    const safeLimit = Math.min(500, Math.max(1, Math.floor(Number(limit))));
    let query = supabase
      .from('repairs')
      .select('phone, customer_name, device_model, updated_at')
      .order('updated_at', { ascending: false })
      .limit(2000);

    query = applyShopOrUserFilter(query, ctx);

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
  } catch (err) {
    handleRepositoryError(err, 'Failed to fetch directory customers');
  }
}
