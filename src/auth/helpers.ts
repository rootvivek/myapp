import { TIMEOUTS } from './constants';

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = TIMEOUTS.DEFAULT_MS,
  errorMsg = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), timeoutMs)),
  ]);
}

export function logError(context: string, error: unknown): void {
  console.warn(`[AuthContext:${context}]`, error);
}

export function handleAuthError(error: unknown, fallbackMsg: string): Error {
  logError('handleAuthError', error);
  if (error instanceof Error) {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(fallbackMsg);
}
