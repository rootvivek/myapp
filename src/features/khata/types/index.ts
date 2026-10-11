/**
 * Khata Book types — party and transaction domain models.
 *
 * Money is stored as integer paise (1 INR = 100 paise) to avoid floating
 * point arithmetic issues, and formatted as rupees only in UI consumers.
 */

export type PartyType = 'seller' | 'dealer' | 'supplier' | 'customer' | 'other';

export type TransactionType =
  | 'purchase'      // Increases amount payable to party
  | 'sale'          // Increases amount receivable from party
  | 'payment_given' // Reduces amount payable
  | 'payment_received' // Reduces amount receivable
  | 'opening_balance' // Establishes initial payable/receivable
  | 'adjustment';   // Explicitly increases or decreases payable

export const PARTY_TYPE_LABELS: Record<PartyType, string> = {
  seller: 'Seller',
  dealer: 'Dealer',
  supplier: 'Supplier',
  customer: 'Customer',
  other: 'Other',
};

export const TRANSACTION_TYPE_LABELS: Record<TransactionType, string> = {
  purchase: 'Purchase',
  sale: 'Sale',
  payment_given: 'Payment Given',
  payment_received: 'Payment Received',
  opening_balance: 'Opening Balance',
  adjustment: 'Adjustment',
};

export const TRANSACTION_TYPE_COLORS: Record<TransactionType, string> = {
  purchase: '#F97316',
  sale: '#10B981',
  payment_given: '#F97316',
  payment_received: '#10B981',
  opening_balance: '#6B7280',
  adjustment: '#8B5CF6',
};

export const TRANSACTION_TYPE_ORDER: TransactionType[] = [
  'opening_balance',
  'purchase',
  'sale',
  'payment_given',
  'payment_received',
  'adjustment',
];

/** Increase (add) vs decrease (subtract) for adjustments. */
export type AdjustmentDirection = 'increase' | 'decrease';

export interface KhataParty {
  id: string;
  name: string;
  phone: string;
  partyType: PartyType;
  notes: string;
  isArchived: boolean;
  /** Cached ledger balance derived from transactions (paise). Do not persist. */
  balancePaise: number;
  /** Number of transactions held for this party. */
  transactionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface KhataTransaction {
  id: string;
  partyId: string;
  partyName: string;
  transactionType: TransactionType;
  amountPaise: number;
  /** Transaction date (YYYY-MM-DD). */
  transactionDate: string;
  note: string;
  createdAt: string;
  /** The `id` of the transaction being corrected/reversed, when this is a reversal. */
  correctionRefId?: string;
}

export interface PartyBalance {
  partyId: string;
  partyName: string;
  /** Net payable in paise. Positive = shop owes party (You'll Give). */
  netPayablePaise: number;
  /** Total given (sum of payment_given + opening_balance + adjustment(-)). */
  totalGivenPaise: number;
  /** Total received (sum of payment_received + opening_balance + adjustment(+)). */
  totalReceivedPaise: number;
  /** Number of transactions. */
  transactionCount: number;
}

export interface KhataFilters {
  searchQuery: string;
  category: PartyType | 'all';
  balance: 'all' | 'payable' | 'receivable' | 'settled';
  archived: boolean;
}

export interface PartyFormState {
  name: string;
  phone: string;
  partyType: PartyType;
  notes: string;
}

export interface TransactionFormState {
  transactionType: TransactionType;
  amount: string;
  transactionDate: string;
  note: string;
  correctionRefId: string;
}
