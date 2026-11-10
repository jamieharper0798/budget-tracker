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

/** [start, end) UTC range for a given year and 0-indexed month. */
export function monthRange(year: number, month: number): [Date, Date] {
  return [new Date(Date.UTC(year, month, 1)), new Date(Date.UTC(year, month + 1, 1))];
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}

/** The day-of-month this bill's anchor date falls on, clamped to the given month's length. */
export function dueDayInMonth(anchorIso: string, year: number, month: number): number {
  const anchor = parseISODate(anchorIso);
  return Math.min(anchor.getUTCDate(), daysInMonth(year, month));
}

/** A representative due date for this bill within (year, month) — the period's own occurrence if the
 * frequency actually lands this month (e.g. weekly), otherwise the anchor's day-of-month for display/sorting. */
export function dueDateInMonth(
  anchorIso: string,
  frequency: Frequency,
  customIntervalDays: number | null,
  year: number,
  month: number,
): Date {
  const [start, end] = monthRange(year, month);
  const occurrences = occurrencesInRange(anchorIso, frequency, customIntervalDays, start, end);
  if (occurrences.length > 0) return occurrences[occurrences.length - 1];
  return new Date(Date.UTC(year, month, dueDayInMonth(anchorIso, year, month)));
}

/** All occurrences of a recurring bill landing within [rangeStart, rangeEnd). */
export function occurrencesInRange(
  anchorIso: string,
  frequency: Frequency,
  customIntervalDays: number | null,
  rangeStart: Date,
  rangeEnd: Date,
): Date[] {
  const anchor = parseISODate(anchorIso);
  if (anchor >= rangeEnd) return [];
  const results: Date[] = [];

  const days = dayInterval(frequency, customIntervalDays);
  if (days !== null) {
    let occ = anchor;
    if (occ < rangeStart) {
      const periods = Math.floor(daysBetween(occ, rangeStart) / days);
      occ = addDays(occ, Math.max(periods, 0) * days);
      while (occ < rangeStart) occ = addDays(occ, days);
    }
    let guard = 0;
    while (occ < rangeEnd && guard < 1000) {
      results.push(occ);
      occ = addDays(occ, days);
      guard += 1;
    }
    return results;
  }

  const months = monthInterval(frequency) ?? 1;
  let occ = anchor;
  let guard = 0;
  while (occ < rangeStart && guard < 2000) {
    occ = addMonthsClamped(occ, months);
    guard += 1;
  }
  guard = 0;
  while (occ < rangeEnd && guard < 1000) {
    if (occ >= rangeStart) results.push(occ);
    occ = addMonthsClamped(occ, months);
    guard += 1;
  }
  return results;
}

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  weekly: 'Weekly',
  biweekly: 'Every 2 weeks',
  monthly: 'Monthly',
  quarterly: 'Every 3 months',
  yearly: 'Yearly',
  custom: 'Custom',
};
