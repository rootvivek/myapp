/**
 * No-op logger — all logging is disabled in the app build.
 * Methods accept any arguments so call sites can pass context
 * (`logger.warn('[x] failed:', err)`) without type errors.
 */
export const logger = {
  log: (..._args: unknown[]): void => {},
  warn: (..._args: unknown[]): void => {},
  error: (..._args: unknown[]): void => {},
  info: (..._args: unknown[]): void => {},
};
