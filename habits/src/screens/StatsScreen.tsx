import { useState } from 'react';
import type { Habit, Log } from '../types';
import type { Stats } from '../lib/game';
import { dayStatus } from '../lib/game';
import { addDays, fromKey, weekStart } from '../lib/dates';
import { bestStreak, completionRate, currentStreak } from '../lib/habits';
import { gradient } from '../lib/colors';

interface Props {
  habits: Habit[];
  log: Log;
  stats: Stats;
  today: string;
  onOpen: (h: Habit) => void;
}

const WEEKS = 18;
// Sequential, single hue (fuchsia) from faint to full.
const HEAT = ['rgba(255,255,255,0.06)', 'rgba(217,70,239,0.28)', 'rgba(217,70,239,0.5)', 'rgba(217,70,239,0.75)', '#e879f9'];

function heatLevel(done: number, due: number): number {
  if (due === 0 || done === 0) return 0;
  const r = done / due;
  return r >= 1 ? 4 : r >= 0.66 ? 3 : r >= 0.33 ? 2 : 1;
}

export function StatsScreen({ habits, log, stats, today, onOpen }: Props) {
  const [hover, setHover] = useState<string | null>(null);
  const start = addDays(weekStart(today), -7 * (WEEKS - 1));
  const columns = Array.from({ length: WEEKS }, (_, w) => Array.from({ length: 7 }, (_, d) => addDays(start, w * 7 + d)));

  const last7 = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6)).map((d) => {
    const s = dayStatus(habits, log, d);
    return { d, pct: s.due ? s.done / s.due : 0, ...s };
  });

  const active = habits.filter((h) => !h.archived);
  const archived = habits.filter((h) => h.archived);
  const hoverStatus = hover ? dayStatus(habits, log, hover) : null;

  const tiles = [
    { label: 'Total XP', value: stats.xp.toLocaleString(), icon: '⚡' },
    { label: 'Check-ins', value: stats.totalCheckins.toLocaleString(), icon: '✅' },
    { label: 'Perfect days', value: stats.perfectDays, icon: '⭐' },
    { label: 'Best streak', value: `${stats.bestHabitStreak}d`, icon: '🏆' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-[28px] font-extrabold tracking-tight">Your progress</h1>

      <div className="grid grid-cols-2 gap-2.5">
        {tiles.map((t, i) => (
          <div key={t.label} className="glass animate-rise rounded-3xl p-4" style={{ animationDelay: `${i * 50}ms` }}>
            <p className="text-lg">{t.icon}</p>
            <p className="font-display mt-1 text-3xl font-extrabold">{t.value}</p>
            <p className="text-xs font-semibold text-white/45">{t.label}</p>
          </div>
        ))}
      </div>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">Last 7 days</h2>
          <span className="text-xs text-white/45">completion %</span>
        </div>
        <div className="flex h-32 items-end gap-2" role="img" aria-label="Completion rate for each of the last 7 days">
          {last7.map((x) => (
            <div key={x.d} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${fromKey(x.d).toDateString()}: ${x.done}/${x.due}`}>
              <span className="text-[10px] font-semibold text-white/0 transition group-hover:text-white/70">{Math.round(x.pct * 100)}%</span>
              <div className="relative w-full max-w-7 flex-1">
                <div
                  className={`absolute inset-x-0 bottom-0 rounded-t-[4px] transition-[height] duration-700 ${x.perfect ? 'bg-gradient-to-t from-fuchsia-600 to-orange-400' : 'bg-fuchsia-500/70'}`}
                  style={{ height: `${Math.max(x.pct > 0 ? 6 : 2, x.pct * 100)}%` }}
                />
              </div>
              <span className={`text-[11px] font-semibold ${x.d === today ? 'text-white' : 'text-white/40'}`}>
                {fromKey(x.d).toLocaleDateString(undefined, { weekday: 'narrow' })}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="glass rounded-3xl p-4">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-bold">Consistency</h2>
          <span className="h-4 text-xs text-white/55">
            {hover && hoverStatus ? `${fromKey(hover).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · ${hoverStatus.done}/${hoverStatus.due}` : `${WEEKS} weeks`}
          </span>
        </div>
        <div className="flex justify-between gap-[3px]" onMouseLeave={() => setHover(null)}>
          {columns.map((col, w) => (
            <div key={w} className="flex flex-1 flex-col gap-[3px]">
              {col.map((d) => {
                const s = dayStatus(habits, log, d);
                return (
                  <button
                    key={d}
                    disabled={d > today}
                    onMouseEnter={() => setHover(d)}
                    onFocus={() => setHover(d)}
                    onClick={() => setHover(d)}
                    className={`aspect-square w-full rounded-[3px] disabled:opacity-0 ${d === today ? 'ring-1 ring-white/70' : ''}`}
                    style={{ background: HEAT[heatLevel(s.done, s.due)] }}
                    aria-label={`${d}: ${s.done} of ${s.due} done`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-white/40">
          Less {HEAT.map((c) => <span key={c} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: c }} />)} More
        </div>
      </section>

      {active.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="px-1 font-bold">Habits</h2>
          {active.map((h) => <HabitRow key={h.id} habit={h} log={log} today={today} onOpen={onOpen} />)}
        </section>
      )}
      {archived.length > 0 && (
        <section className="flex flex-col gap-2 opacity-70">
          <h2 className="px-1 text-sm font-bold text-white/50">Archived</h2>
          {archived.map((h) => <HabitRow key={h.id} habit={h} log={log} today={today} onOpen={onOpen} />)}
        </section>
      )}
    </div>
  );
}

function HabitRow({ habit, log, today, onOpen }: { habit: Habit; log: Log; today: string; onOpen: (h: Habit) => void }) {
  const rate = completionRate(habit, log, today);
  return (
    <button onClick={() => onOpen(habit)} className="glass flex items-center gap-3 rounded-2xl p-3 text-left transition active:scale-[0.98]">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: gradient(habit.color) }}>
        {habit.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold">{habit.name}</span>
        <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-white/8">
          <span className="block h-full rounded-full" style={{ width: `${rate * 100}%`, background: gradient(habit.color, 90) }} />
        </span>
      </span>
      <span className="w-20 shrink-0 text-right text-xs text-white/50">
        <span className="block font-bold text-white">{Math.round(rate * 100)}%</span>
        🔥 {currentStreak(habit, log, today)} · best {bestStreak(habit, log, today)}
      </span>
    </button>
  );
}
