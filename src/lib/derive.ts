import type { Bill } from '../types';
import { annualCost, daysUntil, monthlyCost, nextDueDate, todayUTC } from './frequency';

export interface EnrichedBill extends Bill {
  nextDue: Date;
  daysUntilDue: number;
  monthly: number;
  yearly: number;
}

export function enrichBills(bills: Bill[]): EnrichedBill[] {
  const today = todayUTC();
  return bills.map((bill) => {
    const nextDue = nextDueDate(bill.anchorDate, bill.frequency, bill.customIntervalDays, today);
    return {
      ...bill,
      nextDue,
      daysUntilDue: daysUntil(nextDue, today),
      monthly: monthlyCost(bill.amount, bill.frequency, bill.customIntervalDays),
      yearly: annualCost(bill.frequency, bill.amount, bill.customIntervalDays, bill.paymentsPerYear),
    };
  });
}
