/**
 * Khata Book data-access service.
 *
 * All queries are scoped to the authenticated user's shop via
 * requireUserContext() and RLS policies. No raw user-supplied ids are
 * trusted without server-side authorization.
 */
import { supabase } from '../../../lib/supabase';
import { getNowIso, requireUserContext } from '../../../db/helpers';
import { validateAmount } from '../utils/ledger';
import type {
  KhataParty,
  KhataTransaction,
  PartyType,
  TransactionType,
} from '../types';

async function getContext() {
  return requireUserContext();
}

function isValidTransactionDate(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

/** ── Parties ─────────────────────────────────────────── */

/**
 * Fetch party summaries and authoritative balances without downloading ledger
 * history. The aggregate is computed by Postgres from the full ledger.
 */
export async function listPartySummaries(filter?: { archived?: boolean }): Promise<KhataParty[]> {
  const { data, error } = await supabase.rpc('khata_list_party_summaries', {
    p_archived: filter?.archived ?? false,
  });
  if (error) throw error;
  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    phone: String(row.phone ?? ''),
    partyType: row.party_type as PartyType,
    notes: String(row.notes ?? ''),
    isArchived: Boolean(row.is_archived),
    balancePaise: Number(row.balance_paise ?? 0),
    transactionCount: Number(row.transaction_count ?? 0),
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  }));
}

export async function getPartyById(partyId: string): Promise<KhataParty | null> {
  const ctx = await getContext();
  const { data, error } = await supabase
    .from('khata_parties')
    .select(
      `
      id,
      name,
      phone,
      party_type,
      notes,
      is_archived,
      created_at,
      updated_at
    `
    )
    .eq('id', partyId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: String(data.id),
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    partyType: data.party_type as PartyType,
    notes: String(data.notes ?? ''),
    isArchived: Boolean(data.is_archived),
    balancePaise: 0,
    transactionCount: 0,
    createdAt: String(data.created_at ?? ''),
    updatedAt: String(data.updated_at ?? ''),
  } as KhataParty;
}

export async function createParty(input: {
  name: string;
  phone: string;
  partyType: PartyType;
  notes: string;
}): Promise<KhataParty> {
  const name = input.name.trim();
  const phone = input.phone.trim();
  if (name.length < 2) throw new Error('Party name must be at least 2 characters.');
  if (phone.replace(/\D/g, '').length < 7) throw new Error('Enter a valid phone number (at least 7 digits).');
  if (!['seller', 'dealer', 'supplier', 'customer', 'other'].includes(input.partyType)) {
    throw new Error('Select a valid party category.');
  }
  if (name.length > 120 || phone.length > 32 || input.notes.trim().length > 2000) {
    throw new Error('Party details exceed the allowed length.');
  }

  const ctx = await getContext();
  const now = getNowIso();

  const { data, error } = await supabase
    .from('khata_parties')
    .insert({
      user_id: ctx.userId,
      shop_id: ctx.shopId || null,
      name,
      phone,
      party_type: input.partyType,
      notes: input.notes.trim(),
      is_archived: false,
      created_at: now,
      updated_at: now,
    })
    .select(
      `
      id,
      name,
      phone,
      party_type,
      notes,
      is_archived,
      created_at,
      updated_at
    `)
    .single();

  if (error) throw error;

  return {
    id: String(data.id),
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    partyType: data.party_type as PartyType,
    notes: String(data.notes ?? ''),
    isArchived: Boolean(data.is_archived),
    balancePaise: 0,
    transactionCount: 0,
    createdAt: String(data.created_at ?? ''),
    updatedAt: String(data.updated_at ?? ''),
  } as KhataParty;
}

export async function updateParty(
  partyId: string,
  input: {
    name?: string;
    phone?: string;
    partyType?: PartyType;
    notes?: string;
    isArchived?: boolean;
  }
): Promise<KhataParty | null> {
  if (input.name !== undefined && input.name.trim().length < 2) {
    throw new Error('Party name must be at least 2 characters.');
  }
  if (input.phone !== undefined && input.phone.replace(/\D/g, '').length < 7) {
    throw new Error('Enter a valid phone number (at least 7 digits).');
  }
  if (input.partyType !== undefined && !['seller', 'dealer', 'supplier', 'customer', 'other'].includes(input.partyType)) {
    throw new Error('Select a valid party category.');
  }
  const ctx = await getContext();
  const now = getNowIso();

  const payload: Record<string, unknown> = { updated_at: now };
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.phone !== undefined) payload.phone = input.phone.trim();
  if (input.partyType !== undefined) payload.party_type = input.partyType;
  if (input.notes !== undefined) payload.notes = input.notes.trim();
  if (input.isArchived !== undefined) payload.is_archived = input.isArchived;

  const { data, error } = await supabase
    .from('khata_parties')
    .update(payload)
    .eq('id', partyId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`)
    .eq('is_archived', false)
    .select('id, name, phone, party_type, notes, is_archived, created_at, updated_at')
    .maybeSingle();

  if (error) {
    if (error.message?.includes('Key (id)') || error.message?.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    name: String(data.name ?? ''),
    phone: String(data.phone ?? ''),
    partyType: data.party_type as PartyType,
    notes: String(data.notes ?? ''),
    isArchived: Boolean(data.is_archived),
    balancePaise: 0,
    transactionCount: 0,
    createdAt: String(data.created_at ?? ''),
    updatedAt: String(data.updated_at ?? ''),
  } as KhataParty;
}

/** ── Transactions ────────────────────────────────────── */

export async function listTransactions(
  partyId: string,
  { limit = 50, offset = 0 }: { limit?: number; offset?: number } = {}
): Promise<KhataTransaction[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100 || !Number.isInteger(offset) || offset < 0) {
    throw new Error('Invalid transaction page.');
  }
  const ctx = await getContext();
  const { data, error } = await supabase
    .from('khata_transactions')
    .select(
      `
      id,
      party_id,
      transaction_type,
      amount_paise,
      transaction_date,
      note,
      created_at
    `)
    .eq('party_id', partyId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`)
    .order('transaction_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    partyId: String(row.party_id),
    partyName: '',
    transactionType: row.transaction_type as TransactionType,
    amountPaise: Number(row.amount_paise ?? 0),
    transactionDate: String(row.transaction_date ?? ''),
    note: String(row.note ?? ''),
    createdAt: String(row.created_at ?? ''),
  })) as KhataTransaction[];
}

/** Load all transaction pages for the supplied parties with bounded batch queries. */
export async function listTransactionsForParties(partyIds: string[]): Promise<KhataTransaction[]> {
  if (partyIds.length === 0) return [];
  const ctx = await getContext();
  const pageSize = 1000;
  const transactions: KhataTransaction[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('khata_transactions')
    .select('id, party_id, correction_ref_id, transaction_type, amount_paise, transaction_date, note, created_at')
      .in('party_id', partyIds)
      .or(ctx.shopId
        ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
        : `user_id.eq.${ctx.userId}`)
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    const page = (data ?? []).map((row: Record<string, unknown>) => ({
      id: String(row.id),
      partyId: String(row.party_id),
      partyName: '',
      transactionType: row.transaction_type as TransactionType,
      amountPaise: Number(row.amount_paise ?? 0),
      transactionDate: String(row.transaction_date ?? ''),
      note: String(row.note ?? ''),
      createdAt: String(row.created_at ?? ''),
    }));
    transactions.push(...page);
    if (page.length < pageSize) return transactions;
    offset += pageSize;
  }
}

export async function getTransactionById(txId: string): Promise<KhataTransaction | null> {
  const ctx = await getContext();
  const { data, error } = await supabase
    .from('khata_transactions')
    .select(
      `
      id,
      party_id,
      transaction_type,
      amount_paise,
      transaction_date,
      note,
      created_at
    `)
    .eq('id', txId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`)
    .maybeSingle();

  if (error) {
    if (error.message?.includes('Key (id)') || error.message?.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    partyId: String(data.party_id),
    partyName: '',
    transactionType: data.transaction_type as TransactionType,
    amountPaise: Number(data.amount_paise ?? 0),
    transactionDate: String(data.transaction_date ?? ''),
    note: String(data.note ?? ''),
    createdAt: String(data.created_at ?? ''),
  } as KhataTransaction;
}

export async function createTransaction(input: {
  partyId: string;
  transactionType: TransactionType;
  amountPaise: number;
  transactionDate: string;
  note: string;
}): Promise<KhataTransaction> {
  validateAmount(input.amountPaise, 'transaction');
  if (!isValidTransactionDate(input.transactionDate)) {
    throw new Error('Transaction date must be a valid date in YYYY-MM-DD format.');
  }
  if (!['purchase', 'sale', 'payment_given', 'payment_received', 'opening_balance', 'adjustment'].includes(input.transactionType)) {
    throw new Error('Select a valid transaction type.');
  }
  if (input.note.trim().length > 2000) {
    throw new Error('Transaction details exceed the allowed length.');
  }
  const ctx = await getContext();
  const now = getNowIso();

  const { data, error } = await supabase
    .from('khata_transactions')
    .insert({
      party_id: input.partyId,
      user_id: ctx.userId,
      shop_id: ctx.shopId || null,
      transaction_type: input.transactionType,
      amount_paise: input.amountPaise,
      transaction_date: input.transactionDate,
      note: input.note.trim(),
      created_at: now,
      updated_at: now,
    })
    .select(
      `
      id,
      party_id,
      transaction_type,
      amount_paise,
      transaction_date,
      note,
      created_at
    `)
    .single();

  if (error) throw error;

  return {
    id: String(data.id),
    partyId: String(data.party_id),
    partyName: '',
    transactionType: data.transaction_type as TransactionType,
    amountPaise: Number(data.amount_paise ?? 0),
    transactionDate: String(data.transaction_date ?? ''),
    note: String(data.note ?? ''),
    createdAt: String(data.created_at ?? ''),
  } as KhataTransaction;
}

export async function updateTransaction(
  txId: string,
  input: {
    partyId?: string;
    transactionType?: TransactionType;
    amountPaise?: number;
    transactionDate?: string;
    note?: string;
    correctionRefId?: string;
  }
): Promise<KhataTransaction | null> {
  if (input.amountPaise !== undefined) validateAmount(input.amountPaise, 'transaction');
  if (input.transactionDate !== undefined && !isValidTransactionDate(input.transactionDate)) {
    throw new Error('Transaction date must be a valid date in YYYY-MM-DD format.');
  }
  if (input.transactionType !== undefined && !['purchase', 'sale', 'payment_given', 'payment_received', 'opening_balance', 'adjustment'].includes(input.transactionType)) {
    throw new Error('Select a valid transaction type.');
  }
  const ctx = await getContext();
  const now = getNowIso();

  const payload: Record<string, unknown> = { updated_at: now };
  if (input.partyId !== undefined) payload.party_id = input.partyId;
  if (input.transactionType !== undefined) payload.transaction_type = input.transactionType;
  if (input.amountPaise !== undefined) payload.amount_paise = input.amountPaise;
  if (input.transactionDate !== undefined) payload.transaction_date = input.transactionDate;
  if (input.note !== undefined) payload.note = input.note.trim();
  if (input.correctionRefId !== undefined) payload.correction_ref_id = input.correctionRefId;

  const { data, error } = await supabase
    .from('khata_transactions')
    .update(payload)
    .eq('id', txId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`)
    .select('id, party_id, transaction_type, amount_paise, transaction_date, note, created_at')
    .maybeSingle();

  if (error) {
    if (error.message?.includes('Key (id)') || error.message?.includes('does not exist')) {
      return null;
    }
    throw error;
  }

  if (!data) return null;

  return {
    id: String(data.id),
    partyId: String(data.party_id),
    partyName: '',
    transactionType: data.transaction_type as TransactionType,
    amountPaise: Number(data.amount_paise ?? 0),
    transactionDate: String(data.transaction_date ?? ''),
    note: String(data.note ?? ''),
    createdAt: String(data.created_at ?? ''),
  } as KhataTransaction;
}

export async function deleteTransaction(txId: string): Promise<void> {
  const ctx = await getContext();
  const { error } = await supabase
    .from('khata_transactions')
    .delete()
    .eq('id', txId)
    .or(ctx.shopId
      ? `user_id.eq.${ctx.userId},shop_id.eq.${ctx.shopId}`
      : `user_id.eq.${ctx.userId}`);

  if (error) throw error;
}

export interface SharedKhataLedger {
  link_id: string;
  party_id: string;
  party_name: string;
  shop_name: string;
  transactions: Array<{
    id: string;
    transaction_type: TransactionType;
    amount_paise: number;
    balance_delta_paise: number;
    transaction_date: string;
    created_at: string;
    correction_ref_id: string | null;
  }>;
}

export async function createShareInvite(partyId: string): Promise<string> {
  const { data, error } = await supabase.rpc('khata_create_share_invite', { p_party_id: partyId });
  if (error) throw error;
  if (typeof data !== 'string' || data.length !== 64) throw new Error('Could not create a sharing invitation.');
  return data;
}

export async function listPartyShares(partyId: string): Promise<Array<{
  link_id: string;
  link_status: 'pending' | 'active' | 'rejected' | 'revoked' | 'expired';
  consent_status: 'pending' | 'accepted' | 'rejected' | 'revoked';
  created_at: string;
  linked_at: string | null;
}>> {
  const { data, error } = await supabase.rpc('khata_list_party_shares', { p_party_id: partyId });
  if (error) throw error;
  return (data ?? []) as Array<{
    link_id: string;
    link_status: 'pending' | 'active' | 'rejected' | 'revoked' | 'expired';
    consent_status: 'pending' | 'accepted' | 'rejected' | 'revoked';
    created_at: string;
    linked_at: string | null;
  }>;
}

export async function revokeShare(linkId: string): Promise<void> {
  const { error } = await supabase.rpc('khata_revoke_share', { p_link_id: linkId });
  if (error) throw error;
}

export async function redeemShareInvite(token: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('khata_redeem_share_invite', {
    p_token: token.trim().toLowerCase(),
    p_accept: accept,
  });
  if (error) throw error;
}

export async function listSharedLedgers(): Promise<SharedKhataLedger[]> {
  const { data, error } = await supabase.rpc('khata_list_shared_ledgers');
  if (error) throw error;
  return (data ?? []) as SharedKhataLedger[];
}

export interface PhoneMatchRequest {
  link_id: string;
  party_name: string;
  shop_name: string;
  created_at: string;
}

export async function listPhoneMatchRequests(): Promise<PhoneMatchRequest[]> {
  const { data, error } = await supabase.rpc('khata_list_phone_match_requests');
  if (error) throw error;
  return (data ?? []) as PhoneMatchRequest[];
}

export async function respondToPhoneMatch(linkId: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('khata_respond_phone_match', {
    p_link_id: linkId,
    p_accept: accept,
  });
  if (error) throw error;
}
