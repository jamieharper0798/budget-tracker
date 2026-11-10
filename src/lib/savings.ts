import type { Deposit } from '../types';
import { parseISODate, todayUTC } from './frequency';

export function potSaved(potId: string, deposits: Deposit[]): number {
  return deposits.filter((d) => d.potId === potId).reduce((sum, d) => sum + d.amount, 0);
}

export function totalSaved(deposits: Deposit[]): number {
  return deposits.reduce((sum, d) => sum + d.amount, 0);
}

/** Cumulative savings total at the end of each of the last `months` calendar months (oldest first). */
export function savingsHistory(deposits: Deposit[], months = 6): { label: string; total: number }[] {
  const today = todayUTC();
  const starts: Date[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    starts.push(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - i, 1)));
  }

  return starts.map((start) => {
    const cutoff = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    const total = deposits
      .filter((d) => parseISODate(d.date) < cutoff)
      .reduce((sum, d) => sum + d.amount, 0);
    return { label: start.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' }), total };
  });
}
