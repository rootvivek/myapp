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
  const { data } = await supabase
    .from('profiles')
    .select('shop_id')
    .eq('id', userId)
    .maybeSingle();
  const shopId = data?.shop_id ?? '';
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
  const match = message.match(/Could not find the '([^']+)' column/);
  return match ? match[1] : null;
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
    if (columnName) {
      const nextPayload = { ...payload };
      delete nextPayload[columnName];
      return safeInsert(nextPayload, retryCount + 1);
    }
    throw error;
  }
  return data as Record<string, unknown>;
}

export async function safeUpdate(id: number, payload: Record<string, unknown>, retryCount = 0): Promise<void> {
  if (retryCount > 10) {
    throw new Error('Too many schema discrepancy retries');
  }
  const { error } = await supabase
    .from('repairs')
    .update(payload as any)
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
