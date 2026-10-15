import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import type { Habit } from '../types';
import { colorOf, gradient } from '../lib/colors';
import { SKIPPED, describeSchedule } from '../lib/habits';
import { XP_PER_CHECKIN } from '../lib/game';
import { ProgressRing } from './ProgressRing';
import { DotsIcon, MinusIcon } from './Icons';

interface Props {
  habit: Habit;
  count: number;
  streak: number;
  weekDone: number;
  onTap: (e: MouseEvent<HTMLElement>) => void;
  onDecrement: () => void;
  onOpen: () => void;
}

export function HabitCard({ habit, count, streak, weekDone, onTap, onDecrement, onOpen }: Props) {
  const color = colorOf(habit.color);
  const skipped = count === SKIPPED;
  const value = skipped ? 0 : count;
  const done = value >= habit.target;
  const [celebrating, setCelebrating] = useState(false);
  const wasDone = useRef(done);

  useEffect(() => {
    if (done && !wasDone.current) {
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 1100);
      wasDone.current = done;
      return () => clearTimeout(t);
    }
    wasDone.current = done;
  }, [done]);

  const subtitle = (() => {
    if (skipped) return 'Skipped today — streak protected';
    if (habit.target > 1) return `${value}/${habit.target} ${habit.unit || 'times'}`;
    if (habit.schedule.kind === 'weekly') return `${weekDone}/${habit.schedule.timesPerWeek} this week`;
    return describeSchedule(habit);
  })();

  return (
    <div
      className={`group relative overflow-hidden rounded-[1.75rem] border transition-all duration-300 ${
        done ? 'border-white/20' : 'border-white/8'
      } ${celebrating ? 'animate-pop shine' : ''} ${skipped ? 'opacity-55' : ''}`}
      style={{
        background: done
          ? `linear-gradient(120deg, ${color.from}33, ${color.to}22 60%, rgba(255,255,255,0.03))`
          : 'linear-gradient(145deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))',
        boxShadow: done ? `0 12px 40px -18px ${color.glow}` : undefined,
      }}
    >
      <button
        onClick={onTap}
        className="flex w-full items-center gap-4 p-3.5 pr-24 text-left active:scale-[0.985] transition-transform"
        aria-label={`${habit.name}: ${done ? 'done' : subtitle}. Tap to ${done && habit.target === 1 ? 'undo' : 'check in'}.`}
      >
        <ProgressRing value={value / habit.target} size={58} stroke={5} from={color.from} to={color.to}>
          <span
            className="flex h-[42px] w-[42px] items-center justify-center rounded-full text-[22px] transition-all duration-300"
            style={{ background: done ? gradient(habit.color) : 'rgba(255,255,255,0.06)', boxShadow: done ? `0 0 20px ${color.glow}` : undefined }}
          >
            {done ? (
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="white" strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m5 12 5 5 9-10" className="animate-check" />
              </svg>
            ) : (
              habit.emoji
            )}
          </span>
        </ProgressRing>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[16px] font-semibold leading-tight">{habit.name}</span>
          <span className="mt-1 flex items-center gap-2 text-[13px] text-white/50">
            {streak > 0 && !skipped && (
              <span className="flex items-center gap-0.5 font-semibold text-orange-300">
                <span className={streak >= 3 ? 'animate-flicker' : ''}>🔥</span>
                {streak}
              </span>
            )}
            <span className="truncate">{subtitle}</span>
          </span>
        </span>
      </button>

      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {habit.target > 1 && value > 0 && (
          <button onClick={onDecrement} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label={`Remove one ${habit.unit || 'check-in'}`}>
            <MinusIcon className="h-4 w-4" />
          </button>
        )}
        <button onClick={onOpen} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label={`Details for ${habit.name}`}>
          <DotsIcon className="h-5 w-5" />
        </button>
      </div>

      {celebrating && (
        <span
          className="animate-float-up pointer-events-none absolute left-1/2 top-3 rounded-full px-3 py-1 text-sm font-extrabold text-white shadow-lg"
          style={{ background: gradient(habit.color) }}
        >
          +{XP_PER_CHECKIN} XP
        </span>
      )}
    </div>
  );
}
