/**
 * Centralized ledger calculations for Khata Book.
 *
 * Balance convention (derived from the authoritative transaction ledger,
 * never stored as a mutable field):
 *
 *   Positive net payable  => shop owes the party  => "You'll Give"
 *   Negative net payable  => party owes the shop  => "You'll Get"
 *   Zero net payable      => settled
 *
 * Transaction accounting rules (each transaction's effect on net payable):
 *   - purchase     => +amount (increases payable)
 *   - sale         => -amount (decreases payable / increases receivable)
 *   - payment_given=> -amount (reduces payable)
 *   - payment_received => +amount (increases receivable / reduces payable)
 *   - opening_balance => sign is determined by entry direction
 *   - adjustment   => explicit +amount (increase) or -amount (decrease)
 *
 * Amounts are integer paise (1 INR = 100 paise) to avoid floating point
 * drift. All inputs must be non-negative, finite, and safe.
 */
import type { AdjustmentDirection, TransactionType } from '../types';
import type { KhataTransaction } from '../types';

export type { AdjustmentDirection, TransactionType };

/** Amount is integer paise. Zero/negative throws. */
export function validateAmount(amountPaise: number, source: string): void {
  if (!Number.isFinite(amountPaise)) {
    throw new Error(`Invalid amount for ${source}: must be a number`);
  }
  if (!Number.isInteger(amountPaise)) {
    throw new Error(`Invalid amount for ${source}: must be an integer (got ${amountPaise})`);
  }
  if (amountPaise <= 0) {
    throw new Error(`Invalid amount for ${source}: must be positive (got ${amountPaise})`);
  }
  if (amountPaise > 9007199254740991) {
    throw new Error(`Invalid amount for ${source}: exceeds safe integer limit`);
  }
}

/** Parse a string/amount into paise. Rejects non-finite results. */
export function parseToPaise(value: number | string, source: string): number {
  let numeric: number;
  if (typeof value === 'number') {
    numeric = value;
  } else {
    const cleaned = String(value).trim().replace(/[^0-9.\-]/g, '');
    if (!cleaned) return 0;
    numeric = parseFloat(cleaned);
    if (!Number.isFinite(numeric)) {
      throw new Error(`Invalid amount for ${source}: "${value}"`);
    }
  }

  if (numeric < 0) {
    throw new Error(`Invalid amount for ${source}: negative value`);
  }
  if (numeric > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid amount for ${source}: exceeds safe integer`);
  }

  const text = String(value).trim();
  const paiseLike = /^[0-9]{3,}$/.test(text) && !text.includes('.') && !text.includes(',');
  const rupeeLike = text.includes('.') || text.includes(',');

  if (paiseLike) {
    return Math.trunc(numeric);
  }

  if (rupeeLike) {
    const cleaned = text.replace(/,/g, '');
    const parts = cleaned.split('.');
    const whole = parts[0] ?? '0';
    const frac = (parts[1] ?? '').slice(0, 2);
    const wholeNum = parseInt(whole, 10);
    const fracNum = frac.length === 2 ? parseInt(frac, 10) : frac.length === 1 ? parseInt(frac + '0', 10) : 0;
    const paise = wholeNum * 100 + fracNum;
    if (!Number.isFinite(paise) || paise < 0) {
      throw new Error(`Invalid amount for ${source}: "${value}"`);
    }
    return paise;
  }

  return Math.trunc(numeric);
}

export function parseAmountStr(input: string, source: string): number {
  const cleaned = input.trim().replace(/[₹,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Invalid amount for ${source}: "${input}"`);
  }
  const numeric = Number(cleaned);
  if (!Number.isFinite(numeric) || numeric * 100 > Number.MAX_SAFE_INTEGER) {
    throw new Error(`Invalid amount for ${source}: "${input}"`);
  }
  return numeric;
}

/**
 * Compute the transaction-type delta in paise.
 * - purchase    => +amount
 * - sale        => -amount
 * - payment_given    => -amount
 * - payment_received => +amount
 * - opening_balance  => sign is passed explicitly via `direction`
 * - adjustment       => +amount (increase) or -amount (decrease)
 */
export function getTransactionDelta(
  type: TransactionType,
  amountPaise: number,
  direction?: 'increase' | 'decrease'
): number {
  switch (type) {
    case 'purchase':
      return amountPaise;
    case 'sale':
      return -amountPaise;
    case 'payment_given':
      return -amountPaise;
    case 'payment_received':
      return amountPaise;
    case 'opening_balance':
      return direction === 'decrease' ? -amountPaise : amountPaise;
    case 'adjustment': {
      return direction === 'decrease' ? -amountPaise : amountPaise;
    }
    default:
      return 0;
  }
}

/**
 * Calculate the net payable (in paise) for a list of transactions.
 *
 * netPayable > 0   => shop owes (You'll Give)
 * netPayable < 0   => party owes (You'll Get)
 * netPayable === 0 => settled
 */
export function calcBalance(transactions: KhataTransaction[]): number {
  let netPayable = 0;
  for (const t of transactions) {
    if (t.amountPaise <= 0) continue;
    const direction = t.transactionType === 'opening_balance' || t.transactionType === 'adjustment'
      ? t.note.trim().toLowerCase().startsWith('decrease:') ? 'decrease' : 'increase'
      : undefined;
    const delta = getTransactionDelta(t.transactionType, t.amountPaise, direction);
    netPayable += delta;
  }
  return netPayable;
}

export function calcPartyBalance(
  transactions: KhataTransaction[]
):
  | { netPayablePaise: number; totalGivenPaise: number; totalReceivedPaise: number; transactionCount: number }
  | null {
  if (!transactions || transactions.length === 0) return null;
  let netPayable = 0;
  let totalGiven = 0;
  let totalReceived = 0;
  for (const t of transactions) {
    const amount = t.amountPaise > 0 ? t.amountPaise : 0;
    if (t.transactionType === 'purchase' || t.transactionType === 'payment_received') totalGiven += amount;
    if (t.transactionType === 'payment_given') {
      totalReceived += amount;
    }
    if (t.transactionType === 'sale') {
      totalReceived += amount;
    }
    if (t.transactionType === 'adjustment') {
      if (t.note && t.note.toLowerCase().startsWith('increase:')) totalGiven += amount;
      else totalReceived += amount;
    }
    const direction = t.transactionType === 'opening_balance' || t.transactionType === 'adjustment'
      ? t.note.trim().toLowerCase().startsWith('decrease:') ? 'decrease' : 'increase'
      : undefined;
    netPayable += getTransactionDelta(t.transactionType, amount, direction);
  }
  return { netPayablePaise: netPayable, totalGivenPaise: totalGiven, totalReceivedPaise: totalReceived, transactionCount: transactions.length };
}

/** Format integer paise as Indian Rupees (e.g. 15000 -> "₹150.00"). */
export function formatPaise(amountPaise: number): string {
  if (!Number.isFinite(amountPaise)) return '₹0.00';
  const negative = amountPaise < 0;
  const abs = Math.abs(amountPaise);
  const paise = abs % 100;
  const rupees = (abs - paise) / 100;
  const paiseStr = paise.toString().padStart(2, '0');
  const result = `${rupees}.${paiseStr}`;
  return (negative ? '-' : '') + '₹' + result;
}

/** Format integer paise as Indian Rupees without the rupee symbol (e.g. "Rs 150.00"). */
export function formatPaiseAsRs(amountPaise: number): string {
  const negative = amountPaise < 0;
  const abs = Math.abs(amountPaise);
  const paise = abs % 100;
  const rupees = (abs - paise) / 100;
  const paiseStr = paise.toString().padStart(2, '0');
  const result = `${rupees}.${paiseStr}`;
  return (negative ? '-' : '') + 'Rs ' + result;
}

/** Derive the label for a balance. */
export function getBalanceLabel(netPayablePaise: number): 'settled' | 'payable' | 'receivable' {
  if (netPayablePaise === 0) return 'settled';
  if (netPayablePaise > 0) return 'payable';
  return 'receivable';
}

/** A date string is valid only if it is a real calendar date (not merely parseable). */
export function isValidKhataDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** Get the party type label. */
export function getPartyTypeLabel(partyType: string | undefined): string {
  const map: Record<string, string> = {
    seller: 'Seller',
    dealer: 'Dealer',
    supplier: 'Supplier',
    customer: 'Customer',
    other: 'Other',
  };
  return (partyType ? map[partyType] : undefined) ?? 'Other';
}

/** Get the transaction type label. */
export function getTransactionTypeLabel(type: TransactionType): string {
  const map: Record<string, string> = {
    purchase: 'Purchase',
    sale: 'Sale',
    payment_given: 'Payment Given',
    payment_received: 'Payment Received',
    opening_balance: 'Opening Balance',
    adjustment: 'Adjustment',
  };
  return map[type] ?? type;
}
