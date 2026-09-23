/**
 * Compatibility logger for non-user-facing diagnostics.
 * Logging is intentionally disabled in the app build.
 */

export const logger = {
  log: (..._args: unknown[]) => {},
  warn: (..._args: unknown[]) => {},
  error: (..._args: unknown[]) => {},
  info: (..._args: unknown[]) => {},
};
