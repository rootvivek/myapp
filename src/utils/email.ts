/** Trim, lowercase, strip zero-width / BOM, normalize fullwidth @ (common paste issue). */
export function normalizeEmail(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\uFF20/g, '@');
}

/** Enough structure for Supabase Auth (local@domain.tld). */
export function isValidEmail(email: string): boolean {
  if (email.length < 5 || email.length > 254) return false;
  if (/\s/.test(email)) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
