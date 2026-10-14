import type { Repair } from '../types/repair';

/** Time-period filter used by the Finance (Profit & Loss) screen. */
export type FinancePeriod = 'today' | 'week' | 'month' | 'all' | 'custom';

export type FinanceStats = {
  /** Money actually received (full cost when paid, otherwise the advance). */
  totalPaid: number;
  /** Outstanding balance across unpaid jobs (cost - advance). */
  totalDues: number;
  /** Total billed repair value for the selected period. */
  totalValue: number;
  /** Total out-of-pocket expense for the selected period. */
  totalExpense: number;
  netProfit: number;
  /** Positive part of the net margin — shown in the Profit card. */
  profit: number;
  /** Negative part of the net margin — shown in the Loss card. */
  loss: number;
  cashPaid: number;
  onlinePaid: number;
};

export type FinanceData = {
  stats: FinanceStats;
  /** All-time unpaid jobs (cost > advance) — Unpaid tab. */
  duesList: Repair[];
  /** All-time fully paid jobs — Paid tab. */
  paidList: Repair[];
};

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

/**
 * Single pass over the repair list.
 *
 * - `stats` honour the selected period (the Profit & Loss tab has its own filter).
 * - `duesList` / `paidList` are always all-time so the Unpaid and Paid tabs show
 *   every job in full, independent of the Profit & Loss period selection.
 */
export function computeFinanceData(
  repairs: Repair[],
  period: FinancePeriod,
  customStartDate: Date,
  customEndDate: Date,
  now: Date = new Date()
): FinanceData {
  let totalPaid = 0;
  let totalDues = 0;
  let totalValue = 0;
  let totalExpense = 0;
  let cashPaid = 0;
  let onlinePaid = 0;

  const dues: Repair[] = [];
  const paid: Repair[] = [];

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentDay = now.getDay();
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - currentDay);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const isCustomValid = period !== 'custom' || customEndDate >= customStartDate;

  repairs.forEach((r) => {
    const cost = Number(r.repairCost || 0);
    const exp = Number(r.expense || 0);
    const adv = Number(r.advanceAmount || 0);

    // Unpaid / Paid tabs always show the complete (all-time) lists.
    if (!r.isPaid && cost > adv) {
      dues.push(r);
    } else if (r.isPaid) {
      paid.push(r);
    }

    if (!r.dateReceived) return;
    const rDate = new Date(r.dateReceived + (r.dateReceived.includes('T') ? '' : 'T12:00:00'));
    if (Number.isNaN(rDate.getTime())) return;

    const rDateStart = new Date(rDate.getFullYear(), rDate.getMonth(), rDate.getDate());

    let matchesPeriod = true;
    if (period === 'today') {
      matchesPeriod = rDateStart >= startOfToday;
    } else if (period === 'week') {
      matchesPeriod = rDateStart >= startOfWeek;
    } else if (period === 'month') {
      matchesPeriod = rDateStart >= startOfMonth;
    } else if (period === 'custom' && isCustomValid) {
      const start = new Date(customStartDate.getFullYear(), customStartDate.getMonth(), customStartDate.getDate());
      const end = new Date(customEndDate.getFullYear(), customEndDate.getMonth(), customEndDate.getDate());
      matchesPeriod = rDateStart >= start && rDateStart <= end;
    }

    if (!matchesPeriod) return;

    totalValue += cost;
    totalExpense += exp;

    const paidAmt = calculatePaidAmount(r.isPaid, cost, adv);
    if (!r.isPaid) {
      totalDues += calculateDue(cost, adv);
    }
    totalPaid += paidAmt;

    if (r.paymentType === 'online') {
      onlinePaid += paidAmt;
    } else {
      cashPaid += paidAmt;
    }
  });

  const netProfit = calculateNetProfit(totalValue, totalExpense);

  return {
    stats: {
      totalPaid,
      totalDues,
      totalValue,
      totalExpense,
      netProfit,
      profit: Math.max(netProfit, 0),
      loss: Math.max(-netProfit, 0),
      cashPaid,
      onlinePaid,
    },
    duesList: dues,
    paidList: paid,
  };
}
