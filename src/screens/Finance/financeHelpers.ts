export function parseMoney(value: string): number {
  if (typeof value !== 'string') return 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const parsed = parseFloat(trimmed);
  return Number.isNaN(parsed) ? 0 : parsed;
}

export function calculateDue(cost: number, advance: number): number {
  const due = cost - advance;
  return due > 0 ? due : 0;
}

export function calculatePaidAmount(isPaid: boolean, cost: number, advance: number): number {
  return isPaid ? cost : advance;
}

export function calculateNetProfit(totalValue: number, totalExpense: number): number {
  return totalValue - totalExpense;
}
