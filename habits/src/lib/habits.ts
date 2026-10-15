import type { Habit, Log } from '../types';
import { addDays, weekStart, weekday } from './dates';

export const SKIPPED = -1;

export function countOn(log: Log, day: string, habitId: string): number {
  return log[day]?.[habitId] ?? 0;
}

export function isDone(habit: Habit, log: Log, day: string): boolean {
  return countOn(log, day, habit.id) >= habit.target;
}

export function isSkipped(log: Log, day: string, habitId: string): boolean {
  return countOn(log, day, habitId) === SKIPPED;
}

/** Whether the habit is scheduled on that specific day (weekly habits are "any day"). */
export function isScheduled(habit: Habit, day: string): boolean {
  if (day < habit.createdOn) return false;
  switch (habit.schedule.kind) {
    case 'daily':
    case 'weekly':
      return true;
    case 'weekdays':
      return habit.schedule.days.includes(weekday(day));
  }
}

/** Days the habit was done in the Mon–Sun week containing `day`, up to and including `day`. */
export function doneThisWeek(habit: Habit, log: Log, day: string): number {
  let n = 0;
  for (let d = weekStart(day); d <= day; d = addDays(d, 1)) if (isDone(habit, log, d)) n++;
  return n;
}

/** Counts toward "perfect day" — weekly habits are flexible so they're excluded. */
export function isStrictlyDue(habit: Habit, day: string): boolean {
  return !habit.archived && habit.schedule.kind !== 'weekly' && isScheduled(habit, day);
}

/**
 * Current streak. For daily/weekday habits it's consecutive scheduled days
 * done (or skipped — a skip doesn't break the chain but doesn't add to it).
 * Today not being done yet doesn't break the streak. For weekly habits it's
 * consecutive weeks the weekly target was hit.
 */
export function currentStreak(habit: Habit, log: Log, today: string): number {
  if (habit.schedule.kind === 'weekly') return weeklyStreak(habit, log, today);
  let streak = 0;
  let d = today;
  if (!isDone(habit, log, d)) d = addDays(d, -1);
  for (let guard = 0; guard < 3660 && d >= habit.createdOn; guard++, d = addDays(d, -1)) {
    if (!isScheduled(habit, d)) continue;
    if (isDone(habit, log, d)) streak++;
    else if (!isSkipped(log, d, habit.id)) break;
  }
  return streak;
}

function weeklyStreak(habit: Habit, log: Log, today: string): number {
  const target = habit.schedule.kind === 'weekly' ? habit.schedule.timesPerWeek : 1;
  let streak = 0;
  let ws = weekStart(today);
  if (doneThisWeek(habit, log, today) >= target) streak++;
  for (let guard = 0; guard < 520; guard++) {
    ws = addDays(ws, -7);
    if (addDays(ws, 6) < habit.createdOn) break;
    if (doneThisWeek(habit, log, addDays(ws, 6)) >= target) streak++;
    else break;
  }
  return streak;
}

export function bestStreak(habit: Habit, log: Log, today: string): number {
  if (habit.schedule.kind === 'weekly') {
    const target = habit.schedule.timesPerWeek;
    let best = 0;
    let run = 0;
    for (let ws = weekStart(habit.createdOn); ws <= today; ws = addDays(ws, 7)) {
      const end = addDays(ws, 6) > today ? today : addDays(ws, 6);
      if (doneThisWeek(habit, log, end) >= target) best = Math.max(best, ++run);
      else if (end !== today) run = 0;
    }
    return best;
  }
  let best = 0;
  let run = 0;
  for (let d = habit.createdOn; d <= today; d = addDays(d, 1)) {
    if (!isScheduled(habit, d)) continue;
    if (isDone(habit, log, d)) best = Math.max(best, ++run);
    else if (!isSkipped(log, d, habit.id) && d !== today) run = 0;
  }
  return best;
}

/** Share of scheduled days (excluding skips) in the last `days` days that were done. */
export function completionRate(habit: Habit, log: Log, today: string, days = 30): number {
  let due = 0;
  let done = 0;
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i);
    if (!isScheduled(habit, d) || isSkipped(log, d, habit.id)) continue;
    if (habit.schedule.kind === 'weekly') {
      // For weekly habits, measure against the per-day share of the weekly target.
      due += habit.schedule.timesPerWeek / 7;
      if (isDone(habit, log, d)) done++;
      continue;
    }
    if (d === today && !isDone(habit, log, d)) continue;
    due++;
    if (isDone(habit, log, d)) done++;
  }
  return due === 0 ? 0 : Math.min(1, done / due);
}

export function totalCompletions(habit: Habit, log: Log): number {
  let n = 0;
  for (const day of Object.keys(log)) if (isDone(habit, log, day)) n++;
  return n;
}

export function describeSchedule(habit: Habit): string {
  const s = habit.schedule;
  if (s.kind === 'daily') return 'Every day';
  if (s.kind === 'weekly') return `${s.timesPerWeek}× a week`;
  if (s.days.length === 5 && !s.days.includes(0) && !s.days.includes(6)) return 'Weekdays';
  if (s.days.length === 2 && s.days.includes(0) && s.days.includes(6)) return 'Weekends';
  const names = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return [1, 2, 3, 4, 5, 6, 0].filter((d) => s.days.includes(d)).map((d) => names[d]).join(' · ');
}
