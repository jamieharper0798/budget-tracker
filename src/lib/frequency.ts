import type { Frequency } from '../types';

const DAY_MS = 86_400_000;

export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY_MS);
}

function addMonthsClamped(date: Date, months: number): Date {
  const targetMonthIndex = date.getUTCMonth() + months;
  const day = date.getUTCDate();
  const first = new Date(Date.UTC(date.getUTCFullYear(), targetMonthIndex, 1));
  const daysInTargetMonth = new Date(
    Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0),
  ).getUTCDate();
  first.setUTCDate(Math.min(day, daysInTargetMonth));
  return first;
}

/** Interval in whole days for day-based frequencies, or null for month-based ones. */
function dayInterval(frequency: Frequency, customIntervalDays: number | null): number | null {
  switch (frequency) {
    case 'weekly':
      return 7;
    case 'biweekly':
      return 14;
    case 'custom':
      return customIntervalDays && customIntervalDays > 0 ? Math.round(customIntervalDays) : 30;
    default:
      return null;
  }
}

/** Interval in whole months for calendar-based frequencies. */
function monthInterval(frequency: Frequency): number | null {
  switch (frequency) {
    case 'monthly':
      return 1;
    case 'quarterly':
      return 3;
    case 'yearly':
      return 12;
    default:
      return null;
  }
}

/** Returns the next occurrence on/after `today` for a recurring bill anchored at `anchorDate`. */
export function nextDueDate(
  anchorIso: string,
  frequency: Frequency,
  customIntervalDays: number | null,
  today: Date = todayUTC(),
): Date {
  const anchor = parseISODate(anchorIso);
  if (anchor > today) return anchor;

  const days = dayInterval(frequency, customIntervalDays);
  if (days !== null) {
    const diff = daysBetween(anchor, today);
    const periods = Math.ceil(diff / days);
    return addDays(anchor, periods * days);
  }

  const months = monthInterval(frequency) ?? 1;
  let next = anchor;
  let guard = 0;
  while (next < today && guard < 5000) {
    next = addMonthsClamped(next, months);
    guard += 1;
  }
  return next;
}

export function daysUntil(dueDate: Date, today: Date = todayUTC()): number {
  return daysBetween(today, dueDate);
}

/** Average number of times per year this frequency occurs. */
export function occurrencesPerYear(frequency: Frequency, customIntervalDays: number | null): number {
  const days = dayInterval(frequency, customIntervalDays);
  if (days !== null) return 365.25 / days;
  const months = monthInterval(frequency) ?? 1;
  return 12 / months;
}

export function monthlyCost(
  amount: number,
  frequency: Frequency,
  customIntervalDays: number | null,
): number {
  return (amount * occurrencesPerYear(frequency, customIntervalDays)) / 12;
}

export function yearlyCost(
  amount: number,
  frequency: Frequency,
  customIntervalDays: number | null,
): number {
  return amount * occurrencesPerYear(frequency, customIntervalDays);
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  yearly: 'Yearly',
  custom: 'Custom',
};
