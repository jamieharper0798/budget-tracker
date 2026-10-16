import type { Habit, Log } from '../types';
import { addDays } from './dates';
import { bestStreak, currentStreak, doneThisWeek, isDone, isScheduled, isSkipped, isStrictlyDue } from './habits';

export const XP_PER_CHECKIN = 10;
export const XP_PER_PERFECT_DAY = 20;

/** Total XP needed to reach `level` (level 1 starts at 0). Each level costs 50 more than the last. */
export function xpForLevel(level: number): number {
  return 25 * (level - 1) * (level + 2);
}

export function levelFromXp(xp: number): number {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

const TITLES = ['Rookie', 'Spark', 'Kindled', 'Steady', 'Focused', 'Driven', 'Relentless', 'Unstoppable', 'Elite', 'Legend'];

export function levelTitle(level: number): string {
  return TITLES[Math.min(TITLES.length - 1, Math.floor((level - 1) / 2))];
}

/** 'perfect' = every strictly-due habit was done or skipped (and at least one done). */
export function dayStatus(habits: Habit[], log: Log, day: string): { due: number; done: number; perfect: boolean } {
  let due = 0;
  let done = 0;
  let skipped = 0;
  for (const h of habits) {
    if (!isStrictlyDue(h, day)) continue;
    if (isSkipped(log, day, h.id)) skipped++;
    else {
      due++;
      if (isDone(h, log, day)) done++;
    }
  }
  return { due, done, perfect: due > 0 && done === due && done + skipped > 0 };
}

/**
 * Progress shown for a day in the Today ring and day strip. Unlike `dayStatus` (which decides
 * perfect days and XP), this also counts weekly habits until that week's target is already met,
 * so a "3× a week" habit shows up as something to do — and as done once checked in.
 */
export function dayProgress(habits: Habit[], log: Log, day: string): { due: number; done: number } {
  let due = 0;
  let done = 0;
  for (const h of habits) {
    if (h.archived || !isScheduled(h, day) || isSkipped(log, day, h.id)) continue;
    const doneToday = isDone(h, log, day);
    if (h.schedule.kind === 'weekly' && !doneToday) {
      const metBefore = doneThisWeek(h, log, day) >= h.schedule.timesPerWeek;
      if (metBefore) continue;
    }
    due++;
    if (doneToday) done++;
  }
  return { due, done };
}

export interface Stats {
  xp: number;
  level: number;
  totalCheckins: number;
  perfectDays: number;
  perfectStreak: number;
  bestPerfectStreak: number;
  bestHabitStreak: number;
  currentBestStreak: number;
  habitCount: number;
}

export function computeStats(habits: Habit[], log: Log, today: string): Stats {
  const ids = new Set(habits.map((h) => h.id));
  const byId = new Map(habits.map((h) => [h.id, h]));
  let totalCheckins = 0;
  for (const [day, entries] of Object.entries(log)) {
    if (day > today) continue;
    for (const [id, count] of Object.entries(entries)) {
      const h = byId.get(id);
      if (ids.has(id) && h && count >= h.target) totalCheckins++;
    }
  }

  const start = habits.reduce((min, h) => (h.createdOn < min ? h.createdOn : min), today);
  let perfectDays = 0;
  let run = 0;
  let bestPerfectStreak = 0;
  for (let d = start; d <= today; d = addDays(d, 1)) {
    const s = dayStatus(habits, log, d);
    if (s.perfect) {
      perfectDays++;
      bestPerfectStreak = Math.max(bestPerfectStreak, ++run);
    } else if (s.due > 0 && d !== today) run = 0;
  }

  let perfectStreak = 0;
  let d = dayStatus(habits, log, today).perfect ? today : addDays(today, -1);
  for (let guard = 0; guard < 3660 && d >= start; guard++, d = addDays(d, -1)) {
    const s = dayStatus(habits, log, d);
    if (s.perfect) perfectStreak++;
    else if (s.due > 0) break;
  }

  const active = habits.filter((h) => !h.archived);
  const bestHabitStreak = habits.reduce((m, h) => Math.max(m, bestStreak(h, log, today)), 0);
  const currentBestStreak = active.reduce((m, h) => Math.max(m, currentStreak(h, log, today)), 0);

  const xp = totalCheckins * XP_PER_CHECKIN + perfectDays * XP_PER_PERFECT_DAY;
  return {
    xp,
    level: levelFromXp(xp),
    totalCheckins,
    perfectDays,
    perfectStreak,
    bestPerfectStreak,
    bestHabitStreak,
    currentBestStreak,
    habitCount: habits.length,
  };
}

export interface Badge {
  id: string;
  emoji: string;
  name: string;
  description: string;
  earned: (s: Stats) => boolean;
  progress: (s: Stats) => [number, number];
}

function badge(id: string, emoji: string, name: string, description: string, value: (s: Stats) => number, goal: number): Badge {
  return { id, emoji, name, description, earned: (s) => value(s) >= goal, progress: (s) => [Math.min(goal, value(s)), goal] };
}

export const BADGES: Badge[] = [
  badge('first-step', '👣', 'First Step', 'Complete your first check-in', (s) => s.totalCheckins, 1),
  badge('collector', '🧩', 'Habit Collector', 'Create 3 habits', (s) => s.habitCount, 3),
  badge('streak-3', '🔥', 'Heating Up', 'Hit a 3-day streak', (s) => s.bestHabitStreak, 3),
  badge('streak-7', '⚡', 'One Week Wonder', 'Hit a 7-day streak', (s) => s.bestHabitStreak, 7),
  badge('perfect-1', '✨', 'Flawless', 'Complete a perfect day', (s) => s.perfectDays, 1),
  badge('streak-14', '🚀', 'Liftoff', 'Hit a 14-day streak', (s) => s.bestHabitStreak, 14),
  badge('checkins-50', '🎯', 'Sharpshooter', 'Reach 50 check-ins', (s) => s.totalCheckins, 50),
  badge('perfect-streak-7', '💎', 'Diamond Week', '7 perfect days in a row', (s) => s.bestPerfectStreak, 7),
  badge('level-5', '🌟', 'Rising Star', 'Reach level 5', (s) => s.level, 5),
  badge('streak-30', '🏆', 'Monthly Master', 'Hit a 30-day streak', (s) => s.bestHabitStreak, 30),
  badge('checkins-100', '💯', 'Centurion', 'Reach 100 check-ins', (s) => s.totalCheckins, 100),
  badge('perfect-30', '👑', 'Royalty', '30 perfect days total', (s) => s.perfectDays, 30),
  badge('level-10', '🌌', 'Cosmic', 'Reach level 10', (s) => s.level, 10),
  badge('streak-100', '🐉', 'Legendary', 'Hit a 100-day streak', (s) => s.bestHabitStreak, 100),
  badge('checkins-500', '🗿', 'Unshakeable', 'Reach 500 check-ins', (s) => s.totalCheckins, 500),
];
