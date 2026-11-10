import { useState } from 'react';
import type { FormEvent } from 'react';
import type { SavingsPot } from '../types';
import { ACCOUNT_COLORS } from '../lib/categories';

interface Props {
  pot: SavingsPot | null;
  onSave: (input: Omit<SavingsPot, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onDelete?: () => void;
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20 focus:bg-surface';

export function NewPotForm({ pot, onSave, onCancel, onDelete }: Props) {
  const [name, setName] = useState(pot?.name ?? '');
  const [target, setTarget] = useState(pot ? String(pot.target) : '');
  const [targetDate, setTargetDate] = useState(pot?.targetDate ?? '');
  const [monthlyContribution, setMonthlyContribution] = useState(pot ? String(pot.monthlyContribution) : '');
  const [color, setColor] = useState(pot?.color ?? ACCOUNT_COLORS[0]);
  const [error, setError] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedTarget = Number(target);
    const parsedMonthly = Number(monthlyContribution) || 0;
    if (!trimmedName) return setError('Give this pot a name.');
    if (!Number.isFinite(parsedTarget) || parsedTarget <= 0) return setError('Enter a goal amount greater than 0.');

    onSave({
      name: trimmedName,
      target: parsedTarget,
      targetDate: targetDate || null,
      monthlyContribution: parsedMonthly,
      color,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Name</label>
        <input
          className={inputClass}
          placeholder="e.g. Emergency fund, Holiday, Wedding"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Goal amount</label>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-muted">Target date (optional)</label>
          <input className={inputClass} type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Monthly contribution</label>
        <input
          className={inputClass}
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          value={monthlyContribution}
          onChange={(e) => setMonthlyContribution(e.target.value)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Color</label>
        <div className="flex gap-1.5">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              className={`h-6 w-6 rounded-full ring-2 ring-offset-1 ring-offset-surface ${color === c ? 'ring-ink' : 'ring-transparent'}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>

      {error && <p className="text-xs text-alert">{error}</p>}

      <div className="mt-1 flex gap-2">
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="rounded-xl border border-line px-3 py-2.5 text-sm font-semibold text-alert hover:bg-warn-bg"
          >
            Delete
          </button>
        )}
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Cancel
        </button>
        <button type="submit" className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-ink">
          {pot ? 'Save changes' : 'Create pot'}
        </button>
      </div>
    </form>
  );
}
