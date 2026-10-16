import type { MouseEvent } from 'react';
import { useState } from 'react';
import type { Habit, Log, TimeOfDay } from '../types';
import type { HabitInput } from '../hooks/useTracker';
import type { Stats } from '../lib/game';
import { dayProgress, levelTitle, xpForLevel } from '../lib/game';
import { countOn, currentStreak, doneThisWeek, isScheduled } from '../lib/habits';
import { prettyDate } from '../lib/dates';
import { TEMPLATES } from '../lib/templates';
import { gradient } from '../lib/colors';
import { DayStrip } from '../components/DayStrip';
import { HabitCard } from '../components/HabitCard';
import { ProgressRing } from '../components/ProgressRing';
import { PlusIcon } from '../components/Icons';

interface Props {
  name: string;
  habits: Habit[];
  log: Log;
  stats: Stats;
  today: string;
  day: string;
  onSelectDay: (day: string) => void;
  onTap: (habit: Habit, e: MouseEvent<HTMLElement>) => void;
  onDecrement: (habit: Habit) => void;
  onOpen: (habit: Habit) => void;
  onAdd: () => void;
  onAddTemplates: (t: HabitInput[]) => void;
}

const GROUPS: { key: TimeOfDay; label: string; icon: string }[] = [
  { key: 'morning', label: 'Morning', icon: '🌅' },
  { key: 'afternoon', label: 'Afternoon', icon: '☀️' },
  { key: 'evening', label: 'Evening', icon: '🌙' },
  { key: 'anytime', label: 'Anytime', icon: '✨' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function motivation(done: number, due: number): string {
  if (due === 0) return 'Nothing scheduled — enjoy the rest.';
  if (done === 0) return 'Let’s grab the first win. 💪';
  if (done === due) return 'All done for today. You’re on fire!';
  const left = due - done;
  if (done / due >= 0.5) return `Only ${left} to go — finish strong!`;
  return `${left} to go. Keep the momentum!`;
}

export function TodayScreen(p: Props) {
  const visible = p.habits.filter((h) => !h.archived && isScheduled(h, p.day));
  const status = dayProgress(p.habits, p.log, p.day);
  const pct = status.due ? status.done / status.due : 0;
  const levelStart = xpForLevel(p.stats.level);
  const levelEnd = xpForLevel(p.stats.level + 1);
  const levelPct = (p.stats.xp - levelStart) / (levelEnd - levelStart);
  const usedGroups = GROUPS.filter((g) => visible.some((h) => h.timeOfDay === g.key));
  const isToday = p.day === p.today;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/45">{prettyDate(p.today)}</p>
          <h1 className="font-display mt-0.5 text-[28px] font-extrabold leading-tight tracking-tight">
            {greeting()}
            {p.name ? `, ${p.name}` : ''}
          </h1>
        </div>
        {p.stats.perfectStreak > 0 && (
          <div className="glass flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold" title="Perfect-day streak">
            <span className="animate-flicker">🔥</span>
            {p.stats.perfectStreak}
          </div>
        )}
      </header>

      <section className="glass relative overflow-hidden rounded-[2rem] p-5">
        <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="flex items-center gap-5">
          <ProgressRing value={pct} size={104} stroke={11}>
            <div className="text-center">
              <p className="font-display text-[28px] font-extrabold leading-none">{Math.round(pct * 100)}%</p>
              <p className="mt-0.5 text-[11px] font-medium text-white/45">
                {status.done}/{status.due} done
              </p>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold leading-snug">{motivation(status.done, status.due)}</p>
            <div className="mt-3">
              <div className="mb-1.5 flex items-baseline justify-between text-xs">
                <span className="font-bold">
                  Lv {p.stats.level} <span className="font-medium text-white/45">· {levelTitle(p.stats.level)}</span>
                </span>
                <span className="text-white/45">
                  {p.stats.xp - levelStart}/{levelEnd - levelStart} XP
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-pink-500 via-fuchsia-500 to-orange-400 transition-[width] duration-700 ease-out"
                  style={{ width: `${Math.max(3, levelPct * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <DayStrip habits={p.habits} log={p.log} today={p.today} selected={p.day} onSelect={p.onSelectDay} />

      {!isToday && (
        <div className="animate-rise flex items-center justify-between rounded-2xl border border-amber-300/20 bg-amber-300/10 px-4 py-2.5 text-sm">
          <span className="text-amber-100">Logging for {prettyDate(p.day)}</span>
          <button onClick={() => p.onSelectDay(p.today)} className="font-semibold text-amber-300">
            Back to today
          </button>
        </div>
      )}

      {p.habits.filter((h) => !h.archived).length === 0 ? (
        <EmptyState onAdd={p.onAdd} onAddTemplates={p.onAddTemplates} />
      ) : visible.length === 0 ? (
        <p className="py-10 text-center text-white/45">No habits scheduled for this day. 🌴</p>
      ) : (
        usedGroups.map((g) => (
          <section key={g.key} className="flex flex-col gap-2.5">
            {usedGroups.length > 1 && (
              <h2 className="flex items-center gap-2 px-1 text-xs font-bold uppercase tracking-[0.14em] text-white/40">
                <span>{g.icon}</span> {g.label}
              </h2>
            )}
            {visible
              .filter((h) => h.timeOfDay === g.key)
              .map((h, i) => (
                <div key={h.id} className="animate-rise" style={{ animationDelay: `${i * 40}ms` }}>
                  <HabitCard
                    habit={h}
                    count={countOn(p.log, p.day, h.id)}
                    streak={currentStreak(h, p.log, p.day)}
                    weekDone={doneThisWeek(h, p.log, p.day)}
                    onTap={(e) => p.onTap(h, e)}
                    onDecrement={() => p.onDecrement(h)}
                    onOpen={() => p.onOpen(h)}
                  />
                </div>
              ))}
          </section>
        ))
      )}
    </div>
  );
}

function EmptyState({ onAdd, onAddTemplates }: { onAdd: () => void; onAddTemplates: (t: HabitInput[]) => void }) {
  const [picked, setPicked] = useState<string[]>([]);
  const toggle = (n: string) => setPicked((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]));
  return (
    <section className="animate-rise flex flex-col gap-4">
      <div className="text-center">
        <p className="text-4xl">🌱</p>
        <h2 className="font-display mt-2 text-xl font-bold">Plant your first habits</h2>
        <p className="mt-1 text-sm text-white/50">Pick a few starters — you can tweak them anytime.</p>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {TEMPLATES.map((t) => {
          const on = picked.includes(t.name);
          return (
            <button
              key={t.name}
              onClick={() => toggle(t.name)}
              aria-pressed={on}
              className={`relative flex items-center gap-2.5 rounded-2xl border p-3 text-left transition active:scale-95 ${on ? 'border-white/40 bg-white/12' : 'glass'}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ background: gradient(t.color) }}>
                {t.emoji}
              </span>
              <span className="text-sm font-semibold leading-tight">{t.name}</span>
              {on && (
                <span className="animate-bounce-in absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-black text-fuchsia-600">✓</span>
              )}
            </button>
          );
        })}
      </div>
      {picked.length > 0 ? (
        <button
          onClick={() => onAddTemplates(TEMPLATES.filter((t) => picked.includes(t.name)))}
          className="btn-primary animate-rise rounded-2xl py-3.5 font-bold"
        >
          Start with {picked.length} habit{picked.length > 1 ? 's' : ''} 🚀
        </button>
      ) : (
        <button onClick={onAdd} className="flex items-center justify-center gap-2 rounded-2xl bg-white/8 py-3.5 font-semibold">
          <PlusIcon className="h-5 w-5" /> Create a custom habit
        </button>
      )}
    </section>
  );
}
