import {
  calcBalance,
  calcPartyBalance,
  isValidKhataDate,
  parseAmountStr,
} from '../features/khata/utils/ledger';
import type { KhataTransaction } from '../features/khata/types';

function transaction(
  transactionType: KhataTransaction['transactionType'],
  amountPaise: number,
  note = '',
): KhataTransaction {
  return {
    id: `${transactionType}-${amountPaise}-${note}`,
    partyId: 'party-1',
    partyName: 'Party',
    transactionType,
    amountPaise,
    transactionDate: '2026-10-10',
    note,
    createdAt: '2026-10-10T00:00:00.000Z',
  };
}

describe('Khata ledger', () => {
  it('applies purchases, sales, and payments with the documented signs', () => {
    expect(calcBalance([
      transaction('purchase', 10_000),
      transaction('payment_given', 2_500),
      transaction('sale', 1_000),
      transaction('payment_received', 500),
    ])).toBe(7_000);
  });

  it('records opening balances and adjustments in either direction', () => {
    expect(calcBalance([
      transaction('opening_balance', 5_000, 'increase:opening'),
      transaction('adjustment', 1_000, 'decrease:correction'),
    ])).toBe(4_000);
  });

  it('reports received and given totals from their corresponding ledger actions', () => {
    expect(calcPartyBalance([
      transaction('purchase', 10_000),
      transaction('payment_given', 2_500),
      transaction('sale', 1_000),
      transaction('payment_received', 500),
    ])).toEqual({
      netPayablePaise: 7_000,
      totalGivenPaise: 10_500,
      totalReceivedPaise: 3_500,
      transactionCount: 4,
    });
  });

  it('parses exact decimal rupees to paise without floating point rounding', () => {
    expect(Math.round(parseAmountStr('₹1,234.56', 'test') * 100)).toBe(123_456);
    expect(() => parseAmountStr('1.234', 'test')).toThrow();
  });

  it('rejects impossible calendar dates', () => {
    expect(isValidKhataDate('2026-02-28')).toBe(true);
    expect(isValidKhataDate('2026-02-30')).toBe(false);
    expect(isValidKhataDate('2026-2-03')).toBe(false);
  });
});