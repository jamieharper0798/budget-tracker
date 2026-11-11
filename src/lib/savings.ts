import type { Deposit, SavingsPot } from '../types';
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

/** Whole calendar months from `today` to the month `targetIso` ('YYYY-MM-DD') falls in — day-of-month on
 * either side is ignored, this is month-granularity (matches "months left"/"at this rate" target-date math). */
export function monthsUntil(targetIso: string, today: Date = todayUTC()): number {
  const target = parseISODate(targetIso);
  return (target.getUTCFullYear() - today.getUTCFullYear()) * 12 + (target.getUTCMonth() - today.getUTCMonth());
}

export interface PotProgress {
  /** Months until the target date, or null if the pot has no target date set. At least 1. */
  monthsLeft: number | null;
  /** Months to finish at the pot's current monthly contribution, or null if it's already there / contributing nothing. */
  monthsNeeded: number | null;
  /** Null when there's no target date to compare against (can't say on-track vs behind). */
  onTrack: boolean | null;
  /** What the monthly contribution would need to be to land exactly on the target date. */
  neededPerMonth: number | null;
}

/** On-track/behind-target and the monthly amount needed to hit a pot's target date, per the spec:
 * "At this rate" = ceil(left / monthly) months; "on track" when that's <= months left; "needed per month"
 * = ceil(left / months left). */
export function potProgress(pot: SavingsPot, saved: number, today: Date = todayUTC()): PotProgress {
  const left = Math.max(0, pot.target - saved);
  const monthsNeeded = left <= 0 ? 0 : pot.monthlyContribution > 0 ? Math.ceil(left / pot.monthlyContribution) : null;

  if (!pot.targetDate) {
    return { monthsLeft: null, monthsNeeded, onTrack: null, neededPerMonth: null };
  }
  const monthsLeft = Math.max(1, monthsUntil(pot.targetDate, today));
  const onTrack = monthsNeeded === null ? false : monthsNeeded <= monthsLeft;
  const neededPerMonth = Math.ceil(left / monthsLeft);
  return { monthsLeft, monthsNeeded, onTrack, neededPerMonth };
}
