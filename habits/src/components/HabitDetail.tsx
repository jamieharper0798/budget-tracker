import { useState } from 'react';
import type { Habit, Log } from '../types';
import { colorOf, gradient } from '../lib/colors';
import { fromKey, toKey, WEEKDAY_LETTER } from '../lib/dates';
import { SKIPPED, bestStreak, completionRate, countOn, currentStreak, describeSchedule, isDone, isScheduled, totalCompletions } from '../lib/habits';
import { ChevronIcon } from './Icons';

interface Props {
  habit: Habit;
  log: Log;
  today: string;
  day: string;
  isFirst: boolean;
  isLast: boolean;
  onToggleDay: (day: string) => void;
  onSkip: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onMove: (dir: -1 | 1) => void;
}

export function HabitDetail({ habit, log, today, day, isFirst, isLast, onToggleDay, onSkip, onEdit, onArchive, onDelete, onMove }: Props) {
  const [month, setMonth] = useState(() => today.slice(0, 7));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const color = colorOf(habit.color);
  const skipped = countOn(log, day, habit.id) === SKIPPED;

  const stats = [
    { label: 'Current', value: currentStreak(habit, log, today), suffix: habit.schedule.kind === 'weekly' ? 'wk' : 'd', icon: '🔥' },
    { label: 'Best', value: bestStreak(habit, log, today), suffix: habit.schedule.kind === 'weekly' ? 'wk' : 'd', icon: '🏆' },
    { label: 'Total', value: totalCompletions(habit, log), suffix: '', icon: '✅' },
    { label: '30-day', value: Math.round(completionRate(habit, log, today) * 100), suffix: '%', icon: '📈' },
  ];

  const first = fromKey(`${month}-01`);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => `${month}-${String(i + 1).padStart(2, '0')}`)];
  const shiftMonth = (n: number) => {
    const d = new Date(first.getFullYear(), first.getMonth() + n, 1);
    setMonth(toKey(d).slice(0, 7));
  };

  const action = 'flex-1 rounded-2xl bg-white/8 py-3 text-sm font-semibold transition hover:bg-white/12';

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] text-3xl" style={{ background: gradient(habit.color), boxShadow: `0 10px 30px -8px ${color.glow}` }}>
          {habit.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="font-display truncate text-2xl font-bold">{habit.name}</h2>
          <p className="text-sm text-white/50">
            {describeSchedule(habit)}
            {habit.target > 1 && ` · ${habit.target} ${habit.unit || 'times'}/day`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white/5 p-2.5 text-center">
            <p className="text-sm">{s.icon}</p>
            <p className="font-display text-xl font-bold">
              {s.value}
              <span className="text-xs text-white/40">{s.suffix}</span>
            </p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-white/4 p-4">
        <div className="mb-3 flex items-center justify-between">
          <button onClick={() => shiftMonth(-1)} className="rounded-full p-1.5 text-white/50 hover:bg-white/10" aria-label="Previous month">
            <ChevronIcon className="h-4 w-4 rotate-180" />
          </button>
          <p className="text-sm font-bold">{first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</p>
          <button onClick={() => shiftMonth(1)} disabled={month >= today.slice(0, 7)} className="rounded-full p-1.5 text-white/50 hover:bg-white/10 disabled:opacity-20" aria-label="Next month">
            <ChevronIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <span key={d} className="text-[10px] font-bold text-white/30">{WEEKDAY_LETTER[d]}</span>
          ))}
          {cells.map((d, i) => {
            if (!d) return <span key={`x${i}`} />;
            const done = isDone(habit, log, d);
            const sk = countOn(log, d, habit.id) === SKIPPED;
            const future = d > today;
            const sched = isScheduled(habit, d) || d < habit.createdOn;
            return (
              <button
                key={d}
                disabled={future}
                onClick={() => onToggleDay(d)}
                className={`aspect-square rounded-xl text-xs font-semibold transition active:scale-90 disabled:opacity-20 ${
                  done ? 'text-white' : sk ? 'bg-white/5 text-white/40 line-through' : sched ? 'bg-white/6 text-white/60' : 'text-white/25'
                } ${d === today ? 'ring-1 ring-white/50' : ''}`}
                style={done ? { background: gradient(habit.color) } : undefined}
                aria-label={`${d}${done ? ', done' : ''}`}
              >
                {Number(d.slice(8))}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-center text-[11px] text-white/35">Tap a day to mark it done or undo it.</p>
      </div>

      <div className="flex gap-2">
        <button onClick={onSkip} className={action}>{skipped ? 'Unskip' : 'Skip'} {day === today ? 'today' : 'day'}</button>
        <button onClick={onEdit} className={action}>Edit</button>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onMove(-1)} disabled={isFirst} className={`${action} disabled:opacity-30`}>Move up</button>
        <button onClick={() => onMove(1)} disabled={isLast} className={`${action} disabled:opacity-30`}>Move down</button>
      </div>
      <div className="flex gap-2">
        <button onClick={onArchive} className={action}>{habit.archived ? 'Restore' : 'Archive'}</button>
        {confirmDelete ? (
          <button onClick={onDelete} className="flex-1 rounded-2xl bg-rose-500 py-3 text-sm font-bold">Tap to confirm</button>
        ) : (
          <button onClick={() => setConfirmDelete(true)} className="flex-1 rounded-2xl bg-rose-500/15 py-3 text-sm font-semibold text-rose-300">Delete</button>
        )}
      </div>
      <p className="-mt-2 text-center text-[11px] text-white/30">Archiving keeps your history; deleting removes it. Started {fromKey(habit.createdOn).toLocaleDateString()}.</p>
    </div>
  );
}
