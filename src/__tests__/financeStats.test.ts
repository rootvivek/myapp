import { calculateDue, calculatePaidAmount, computeFinanceData } from '../utils/financeStats';
import type { Repair } from '../types/repair';

function makeRepair(overrides: Partial<Repair> = {}): Repair {
  return {
    id: 1,
    orderCode: 'ord00001',
    customerName: 'Test Customer',
    phone: '9876543210',
    deviceModel: 'Test Phone',
    imei: '',
    lockType: '',
    lockValue: '',
    problem: '',
    warranty: '',
    dateReceived: '2026-06-15',
    status: 'delivered',
    repairCost: 0,
    expense: 0,
    advanceAmount: 0,
    isPaid: false,
    imagePhoneFront: '',
    imagePhoneBack: '',
    imageThumbnail: '',
    imageId1: '',
    imageId2: '',
    accSimTray: false,
    accBackCover: false,
    paymentType: 'cash',
    sellerId: null,
    createdBy: 'user-1',
    createdByName: 'Owner',
    createdByRole: 'owner',
    createdAt: '2026-06-15T10:00:00.000Z',
    updatedAt: '2026-06-15T10:00:00.000Z',
    ...overrides,
  };
}

/** Fixed "now" so period filtering is deterministic: Monday, 15 Jun 2026. */
const NOW = new Date(2026, 5, 15, 12, 0, 0);

function run(
  repairs: Repair[],
  period: 'today' | 'week' | 'month' | 'all' | 'custom' = 'all',
  customStartDate: Date = new Date(2026, 5, 1),
  customEndDate: Date = new Date(2026, 5, 15)
) {
  return computeFinanceData(repairs, period, customStartDate, customEndDate, NOW);
}

describe('financeStats', () => {
  describe('helpers', () => {
    it('calculateDue clamps negatives to zero', () => {
      expect(calculateDue(1000, 400)).toBe(600);
      expect(calculateDue(400, 1000)).toBe(0);
      expect(calculateDue(500, 500)).toBe(0);
    });

    it('calculatePaidAmount uses full cost when paid, otherwise the advance', () => {
      expect(calculatePaidAmount(true, 1000, 200)).toBe(1000);
      expect(calculatePaidAmount(false, 1000, 200)).toBe(200);
    });
  });

  describe('unpaid / paid job lists', () => {
    it('splits jobs into separate unpaid and paid lists', () => {
      const repairs = [
        makeRepair({ id: 1, repairCost: 1000, advanceAmount: 200, isPaid: false }),
        makeRepair({ id: 2, repairCost: 500, advanceAmount: 500, isPaid: true, paymentType: 'online' }),
        // Advance covers the full cost but not marked paid → neither list (legacy rule).
        makeRepair({ id: 3, repairCost: 300, advanceAmount: 300, isPaid: false }),
      ];

      const { duesList, paidList } = run(repairs);

      expect(duesList.map((r) => r.id)).toEqual([1]);
      expect(paidList.map((r) => r.id)).toEqual([2]);
    });

    it('keeps both lists all-time even when the P&L period filter is active', () => {
      const repairs = [
        makeRepair({ id: 1, dateReceived: '2026-01-05', repairCost: 1000, expense: 999, isPaid: true }),
        makeRepair({
          id: 2,
          dateReceived: '2026-06-15',
          repairCost: 600,
          expense: 100,
          advanceAmount: 100,
          isPaid: false,
        }),
      ];

      const { stats, duesList, paidList } = run(repairs, 'today');

      // Stats only include today's job (the older job's expense is excluded)…
      expect(stats.totalValue).toBe(600);
      expect(stats.totalExpense).toBe(100);
      // …while the Unpaid / Paid tabs still show every job.
      expect(duesList.map((r) => r.id)).toEqual([2]);
      expect(paidList.map((r) => r.id)).toEqual([1]);
    });
  });

  describe('separate profit and loss', () => {
    it('reports profit when earnings exceed expense', () => {
      const { stats } = run([
        makeRepair({ repairCost: 2000, expense: 500, isPaid: true, paymentType: 'cash' }),
      ]);

      expect(stats.netProfit).toBe(1500);
      expect(stats.profit).toBe(1500);
      expect(stats.loss).toBe(0);
    });

    it('reports loss when expense exceeds earnings', () => {
      const { stats } = run([
        makeRepair({ repairCost: 400, expense: 900, isPaid: true, paymentType: 'cash' }),
      ]);

      expect(stats.netProfit).toBe(-500);
      expect(stats.profit).toBe(0);
      expect(stats.loss).toBe(500);
    });
  });

  describe('period filtering of stats', () => {
    it('only counts jobs inside a custom date range', () => {
      const repairs = [
        makeRepair({ id: 1, dateReceived: '2026-01-05', repairCost: 1000, expense: 100, isPaid: true }),
        makeRepair({ id: 2, dateReceived: '2026-06-10', repairCost: 700, expense: 200, isPaid: true }),
      ];

      const { stats } = run(repairs, 'custom', new Date(2026, 5, 1), new Date(2026, 5, 15));

      expect(stats.totalValue).toBe(700);
      expect(stats.totalExpense).toBe(200);
      expect(stats.netProfit).toBe(500);
    });

    it('splits received money by cash and online', () => {
      const repairs = [
        makeRepair({ id: 1, repairCost: 1000, isPaid: true, paymentType: 'cash' }),
        makeRepair({
          id: 2,
          repairCost: 700,
          advanceAmount: 300,
          isPaid: false,
          paymentType: 'online',
        }),
      ];

      const { stats } = run(repairs);

      expect(stats.totalPaid).toBe(1300);
      expect(stats.cashPaid).toBe(1000);
      expect(stats.onlinePaid).toBe(300);
      expect(stats.totalDues).toBe(400);
    });
  });
});
