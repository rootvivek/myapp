// @ts-ignore react-native-dotenv exposes the app's build-time environment values.
import { UPDATE_API_URL } from '@env';
import { MASTER_ADMIN_KEY } from '../config/masterAdmin';

export type AdminStats = {
  shops: number;
  users: number;
  repairs: number;
  inventory: number;
};

export type AdminUser = {
  id: string;
  name: string;
  username: string | null;
  phone: string;
  role: string;
  shop_id: string | null;
  created_at: string;
  shops?: { name: string } | null;
};

function apiUrl(path: string): string {
  return `${String(UPDATE_API_URL ?? '').replace(/\/$/, '')}${path}`;
}

async function adminPost<T>(path: string, body?: Record<string, unknown>): Promise<T> {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-master-key': MASTER_ADMIN_KEY },
    body: JSON.stringify(body ?? {}),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || !result?.ok) {
    throw new Error(result?.error || 'Master admin request failed.');
  }
  return result as T;
}

/** Load global stats + all user profiles through the service-role backend. */
export async function fetchAdminData(): Promise<{ stats: AdminStats; users: AdminUser[] }> {
  const result = await adminPost<{ stats: AdminStats; users: AdminUser[] }>('/api/admin/data');
  return { stats: result.stats, users: result.users ?? [] };
}

/** Delete a user's Auth account (related rows cascade). */
export async function deleteAdminUser(userId: string): Promise<void> {
  await adminPost('/api/admin/user/delete', { userId });
}
