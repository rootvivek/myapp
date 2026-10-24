import { supabase } from '../lib/supabase';

export async function requireUserId(): Promise<string> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Not signed in');
  return user.id;
}

export async function requireUserContext(): Promise<{ userId: string; shopId: string }> {
  const userId = await requireUserId();

  const { data: profileData } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', userId)
    .maybeSingle();

  let shopId = profileData?.shop_id ?? '';

  if (!shopId) {
    const { data: shopData, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .eq('owner_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (!shopError && shopData?.id) {
      shopId = String(shopData.id);
      await supabase
        .from('profiles')
        .upsert({ id: userId, shop_id: shopId }, { onConflict: 'id' })
        .select('shop_id');
    }
  }

  return { userId, shopId };
}

/**
 * Standardized query scope helper: Applies shop_id or user_id filter based on context
 */
export function applyShopOrUserFilter<T>(
  query: T,
  context: { userId: string; shopId: string }
): T {
  if (context.shopId) {
    return (query as any).eq('shop_id', context.shopId);
  }
  return (query as any).eq('user_id', context.userId);
}

/**
 * Returns current timestamp in ISO format
 */
export function getNowIso(): string {
  return new Date().toISOString();
}

/**
 * Standardized repository error handler
 */
export function handleRepositoryError(error: unknown, defaultMsg: string): never {
  if (error instanceof Error) {
    throw error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    throw new Error(String((error as Record<string, unknown>).message));
  }
  throw new Error(defaultMsg);
}

export function getMissingColumn(message: string): string | null {
  if (!message.includes('schema cache') && !message.includes('does not exist')) {
    return null;
  }
  const match1 = message.match(/Could not find the ['"]?([a-zA-Z0-9_]+)['"]? column/i);
  if (match1) return match1[1];

  const match2 = message.match(/Could not find the column ['"]?([a-zA-Z0-9_]+)['"]?/i);
  if (match2) return match2[1];

  const match3 = message.match(/column ['"]?([a-zA-Z0-9_]+)['"]?(?: of relation ['"][^'"]+['"])? does not exist/i);
  if (match3) return match3[1];

  return null;
}

export async function safeInsert(payload: Record<string, unknown>, retryCount = 0): Promise<Record<string, unknown>> {
  if (retryCount > 10) {
    throw new Error('Too many schema discrepancy retries');
  }
  const { data, error } = await supabase
    .from('repairs')
    .insert(payload as any)
    .select('id')
    .single();

  if (error) {
    const columnName = getMissingColumn(error.message);
    if (columnName && columnName in payload) {
      // Log warning so silent data loss is visible in logs
      console.warn(`[safeInsert] Dropping missing column "${columnName}" from insert payload`);
      const nextPayload = { ...payload };
      delete nextPayload[columnName];
      return safeInsert(nextPayload, retryCount + 1);
    }
    throw error;
  }
  return data as Record<string, unknown>;
}

export async function safeUpdate(
  table: string,
  id: number,
  payload: Record<string, unknown>,
  ctx: { userId: string; shopId: string },
  retryCount = 0
): Promise<void> {
  if (retryCount > 10) {
    throw new Error('Too many schema discrepancy retries');
  }
  let query = supabase.from(table).update(payload as any).eq('id', id);
  query = applyShopOrUserFilter(query, ctx);
  const { error } = await query;
  if (error) {
    const columnName = getMissingColumn(error.message);
    if (columnName && columnName in payload) {
      console.warn(`[safeUpdate] Dropping missing column "${columnName}" from update payload`);
      const nextPayload = { ...payload };
      delete nextPayload[columnName];
      return safeUpdate(table, id, nextPayload, ctx, retryCount + 1);
    }
    throw error;
  }
}
