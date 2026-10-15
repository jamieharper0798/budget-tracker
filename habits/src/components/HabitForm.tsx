import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Habit, Schedule, TimeOfDay } from '../types';
import type { HabitInput } from '../hooks/useTracker';
import { COLORS, gradient } from '../lib/colors';
import { EMOJIS } from '../lib/templates';
import { WEEKDAY_LETTER } from '../lib/dates';

interface Props {
  initial?: Habit;
  onSave: (input: HabitInput) => void;
  onCancel: () => void;
}

const label = 'mb-2 block text-xs font-bold uppercase tracking-[0.12em] text-white/40';
const chip = (on: boolean) =>
  `rounded-xl px-3 py-2 text-sm font-semibold transition ${on ? 'bg-white text-gray-900' : 'bg-white/6 text-white/70 hover:bg-white/10'}`;

export function HabitForm({ initial, onSave, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '💪');
  const [color, setColor] = useState(initial?.color ?? 'violet');
  const [kind, setKind] = useState<Schedule['kind']>(initial?.schedule.kind ?? 'daily');
  const [days, setDays] = useState<number[]>(initial?.schedule.kind === 'weekdays' ? initial.schedule.days : [1, 2, 3, 4, 5]);
  const [perWeek, setPerWeek] = useState(initial?.schedule.kind === 'weekly' ? initial.schedule.timesPerWeek : 3);
  const [target, setTarget] = useState(initial?.target ?? 1);
  const [unit, setUnit] = useState(initial?.unit ?? '');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(initial?.timeOfDay ?? 'anytime');
  const [error, setError] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Give your habit a name.');
    if (kind === 'weekdays' && days.length === 0) return setError('Pick at least one day.');
    const schedule: Schedule =
      kind === 'daily' ? { kind } : kind === 'weekdays' ? { kind, days: [...days].sort() } : { kind, timesPerWeek: perWeek };
    onSave({ name: name.trim(), emoji, color, schedule, target: Math.max(1, target), unit: unit.trim(), timeOfDay });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl shadow-lg" style={{ background: gradient(color) }}>
          {emoji}
        </span>
        <input
          autoFocus={!initial}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning walk"
          maxLength={40}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-[16px] font-semibold outline-none placeholder:font-normal placeholder:text-white/30 focus:border-fuchsia-400/60"
          aria-label="Habit name"
        />
      </div>

      <div>
        <span className={label}>Icon</span>
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-1">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl transition ${emoji === e ? 'scale-110 bg-white/20 ring-2 ring-white/60' : 'bg-white/6'}`}
              aria-label={`Icon ${e}`}
            >
              {e}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className={label}>Color</span>
        <div className="flex flex-wrap gap-2.5">
          {Object.keys(COLORS).map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => setColor(c)}
              className={`h-9 w-9 rounded-full transition ${color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#140d26]' : ''}`}
              style={{ background: gradient(c) }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      <div>
        <span className={label}>How often</span>
        <div className="flex gap-2">
          <button type="button" className={chip(kind === 'daily')} onClick={() => setKind('daily')}>Every day</button>
          <button type="button" className={chip(kind === 'weekdays')} onClick={() => setKind('weekdays')}>Specific days</button>
          <button type="button" className={chip(kind === 'weekly')} onClick={() => setKind('weekly')}>X per week</button>
        </div>
        {kind === 'weekdays' && (
          <div className="mt-3 flex justify-between gap-1.5">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => (
              <button
                type="button"
                key={d}
                onClick={() => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
                className={`h-10 flex-1 rounded-xl text-sm font-bold transition ${days.includes(d) ? 'text-white' : 'bg-white/6 text-white/50'}`}
                style={days.includes(d) ? { background: gradient(color) } : undefined}
              >
                {WEEKDAY_LETTER[d]}
              </button>
            ))}
          </div>
        )}
        {kind === 'weekly' && (
          <Stepper value={perWeek} min={1} max={7} onChange={setPerWeek} suffix={perWeek === 1 ? 'time a week' : 'times a week'} />
        )}
      </div>

      <div>
        <span className={label}>Daily goal</span>
        <div className="flex items-center gap-3">
          <Stepper value={target} min={1} max={99} onChange={setTarget} />
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            placeholder={target > 1 ? 'unit, e.g. glasses' : 'unit (optional)'}
            maxLength={16}
            className="mt-3 min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-white/30 focus:border-fuchsia-400/60"
            aria-label="Unit"
          />
        </div>
      </div>

      <div>
        <span className={label}>Time of day</span>
        <div className="grid grid-cols-4 gap-2">
          {(['morning', 'afternoon', 'evening', 'anytime'] as const).map((t) => (
            <button type="button" key={t} className={`${chip(timeOfDay === t)} capitalize`} onClick={() => setTimeOfDay(t)}>
              {t === 'afternoon' ? 'Midday' : t}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-rose-400" role="alert">{error}</p>}

      <div className="flex gap-2.5 pt-1">
        <button type="button" onClick={onCancel} className="flex-1 rounded-2xl bg-white/8 py-3.5 font-semibold text-white/70">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-[2] rounded-2xl py-3.5 font-bold">
          {initial ? 'Save changes' : 'Add habit ✨'}
        </button>
      </div>
    </form>
  );
}

function Stepper({ value, min, max, onChange, suffix }: { value: number; min: number; max: number; onChange: (n: number) => void; suffix?: string }) {
  const btn = 'flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-lg font-bold disabled:opacity-30';
  return (
    <div className="mt-3 flex items-center gap-3">
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} aria-label="Decrease">−</button>
      <span className="font-display w-8 text-center text-2xl font-bold">{value}</span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Increase">+</button>
      {suffix && <span className="text-sm text-white/50">{suffix}</span>}
    </div>
  );
}
