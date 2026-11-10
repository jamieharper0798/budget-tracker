import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SavingsPot } from '../types';
import { toISODate, todayUTC } from '../lib/frequency';

interface Props {
  pots: SavingsPot[];
  initialPotId?: string | null;
  onSave: (potId: string, amount: number, date: string, note: string) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20 focus:bg-surface';

export function LogSavingForm({ pots, initialPotId, onSave, onCancel }: Props) {
  const [potId, setPotId] = useState(initialPotId ?? pots[0]?.id ?? '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(toISODate(todayUTC()));
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  if (pots.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted">Create a savings pot first, then you can log a deposit into it.</p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Close
        </button>
      </div>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!potId) return setError('Choose a pot.');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Enter an amount greater than 0.');
    if (!date) return setError('Pick a date.');
    onSave(potId, parsedAmount, date, note.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Pot</label>
        <select className={inputClass} value={potId} onChange={(e) => setPotId(e.target.value)}>
          {pots.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Amount</label>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            autoFocus
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Date</label>
          <input className={inputClass} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Note (optional)</label>
        <input
          className={inputClass}
          placeholder="e.g. Bonus, tax refund"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

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
          Log saving
        </button>
      </div>
    </form>
  );
}
