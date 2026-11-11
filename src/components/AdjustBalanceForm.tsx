import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatMoney } from '../lib/format';
import { toISODate, todayUTC } from '../lib/frequency';

interface Props {
  potName: string;
  currentSaved: number;
  currency: string;
  onSave: (newTotal: number, date: string, note: string) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20 focus:bg-surface';

export function AdjustBalanceForm({ potName, currentSaved, currency, onSave, onCancel }: Props) {
  const [newTotal, setNewTotal] = useState(String(currentSaved));
  const [date, setDate] = useState(toISODate(todayUTC()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const parsed = Number(newTotal);
  const delta = Number.isFinite(parsed) ? parsed - currentSaved : 0;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!Number.isFinite(parsed) || parsed < 0) return setError('Enter a valid balance (0 or more).');
    if (!date) return setError('Pick a date.');
    onSave(parsed, date, note.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        Set {potName}'s actual current balance — for money already saved before using the app, interest, or a
        withdrawal. The difference from what's logged now is recorded as an adjustment entry.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Current balance</label>
        <input
          className={inputClass}
          type="number"
          step="0.01"
          min="0"
          value={newTotal}
          onChange={(e) => setNewTotal(e.target.value)}
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Date</label>
        <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Note (optional)</label>
        <input
          className={inputClass}
          placeholder="e.g. Opening balance, interest, withdrawal"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      {Number.isFinite(parsed) && delta !== 0 && (
        <p className={`text-xs font-medium ${delta > 0 ? 'text-[var(--color-ok-fg)]' : 'text-alert'}`}>
          This will log {delta > 0 ? '+' : '−'}
          {formatMoney(Math.abs(delta), currency)} as an adjustment.
        </p>
      )}

      {error && <p className="text-xs text-alert">{error}</p>}

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-ink">
          Save balance
        </button>
      </div>
    </form>
  );
}
