import { logger } from '../utils/logger';
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
  logger.warn(`[AuthContext:${context}]`, error);
}

export function handleAuthError(error: unknown, fallbackMsg: string): Error {
  logError('handleAuthError', error);
  if (error instanceof Error) {
    const authError = error as Error & { code?: string };
    if (
      authError.code === 'phone_provider_disabled' ||
      error.message.toLowerCase().includes('phone sign-in is disabled') ||
      error.message.toLowerCase().includes('phone provider is disabled')
    ) {
      return new Error(
        'Phone OTP is handled by MSG91. Supabase SMS is not required; enable Authentication > Providers > Email and disable email confirmation for the hidden account session.'
      );
    }
    if (
      error.message.toLowerCase().includes('email login is disabled') ||
      error.message.toLowerCase().includes('email provider is disabled')
    ) {
      return new Error(
        'Enable Authentication > Providers > Email in Supabase. The app still shows only phone login; email is used internally for the session.'
      );
    }
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(String((error as { message: unknown }).message));
  }
  return new Error(fallbackMsg);
}
