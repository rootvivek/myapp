export function formatCurrency(n: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDateDisplay(isoDate: string): string {
  if (!isoDate) return '';
  const d = new Date(isoDate + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function parseMoney(value: string | number): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value || typeof value !== 'string') return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const cleaned = parseFloat(trimmed.replace(/[^0-9.]/g, ''));
  return Number.isFinite(cleaned) ? cleaned : 0;
}

export function todayISODate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
