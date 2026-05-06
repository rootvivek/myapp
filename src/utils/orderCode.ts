/**
 * Stable order id from DB row id: `ord` + numeric suffix, up to 5 digits zero-padded
 * (e.g. ord00001 … ord99999). If id exceeds 99999, suffix is the full id (ord100000).
 */
export function orderCodeFromRepairId(id: number): string {
  const n = Math.floor(Number(id));
  if (!Number.isFinite(n) || n < 1) return 'ord00001';
  if (n <= 99999) return `ord${String(n).padStart(5, '0')}`;
  return `ord${n}`;
}
