import type { PartyFormState, TransactionFormState } from '../types';
import { isValidKhataDate } from './ledger';

export interface PartyFormErrors {
  name?: string;
  phone?: string;
  partyType?: string;
}

export interface TransactionFormErrors {
  amount?: string;
  transactionType?: string;
  transactionDate?: string;
}

/** Validate party form fields. */
export function validatePartyForm(data: PartyFormState): PartyFormErrors {
  const errors: PartyFormErrors = {};
  if (!data.name || data.name.trim().length < 2) {
    errors.name = 'Party name must be at least 2 characters.';
  }
  if (!data.phone || data.phone.replace(/\D/g, '').length < 7) {
    errors.phone = 'Enter a valid phone number (min 7 digits).';
  }
  if (!data.partyType) {
    errors.partyType = 'Select a party type.';
  }
  return errors;
}

/** Validate transaction form fields. */
export function validateTransactionForm(data: TransactionFormState): TransactionFormErrors {
  const errors: TransactionFormErrors = {};
  if (!data.transactionType) {
    errors.transactionType = 'Select a transaction type.';
  }
  if (!isValidKhataDate(data.transactionDate)) {
    errors.transactionDate = 'Enter a valid date in YYYY-MM-DD format.';
  }
  if (!Number.isFinite(Number(data.amount)) || Number(data.amount) <= 0) errors.amount = 'Enter an amount greater than zero.';
  return errors;
}
