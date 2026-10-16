import type { Habit, Log } from '../types';
import { addDays, fromKey, WEEKDAY_LETTER } from '../lib/dates';
import { dayProgress, dayStatus } from '../lib/game';
import { ProgressRing } from './ProgressRing';

interface Props {
  habits: Habit[];
  log: Log;
  today: string;
  selected: string;
  onSelect: (day: string) => void;
}

export function DayStrip({ habits, log, today, selected, onSelect }: Props) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  return (
    <div className="flex justify-between gap-1">
      {days.map((d) => {
        const s = { ...dayProgress(habits, log, d), perfect: dayStatus(habits, log, d).perfect };
        const isSel = d === selected;
        return (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={`flex flex-1 flex-col items-center gap-1.5 rounded-2xl py-2 transition ${isSel ? 'bg-white/10' : 'hover:bg-white/5'}`}
            aria-pressed={isSel}
            aria-label={fromKey(d).toDateString()}
          >
            <span className={`text-[11px] font-semibold ${isSel ? 'text-white' : 'text-white/40'}`}>{WEEKDAY_LETTER[fromKey(d).getDay()]}</span>
            <ProgressRing value={s.due ? s.done / s.due : 0} size={34} stroke={3.5}>
              <span
                className={`flex h-[24px] w-[24px] items-center justify-center rounded-full text-[12px] font-bold ${
                  s.perfect ? 'bg-gradient-to-br from-pink-500 to-orange-400 text-white' : d === today ? 'text-white' : 'text-white/60'
                }`}
              >
                {s.perfect ? '★' : fromKey(d).getDate()}
              </span>
            </ProgressRing>
          </button>
        );
      })}
    </div>
  );
}
