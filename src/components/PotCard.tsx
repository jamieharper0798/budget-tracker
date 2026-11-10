import type { SavingsPot } from '../types';
import { formatMoney, formatMonthYear, ringBackground } from '../lib/format';
import { Ring } from './Ring';

interface Props {
  pot: SavingsPot;
  saved: number;
  currency: string;
  onAdd: () => void;
  onEdit: () => void;
}

export function PotCard({ pot, saved, currency, onAdd, onEdit }: Props) {
  const pct = pot.target > 0 ? Math.round((saved / pot.target) * 100) : 0;

  return (
    <div className="card-sm flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-2">
        <button onClick={onEdit} className="flex min-w-0 flex-col gap-1 text-left">
          <span className="truncate text-[15px] font-semibold text-ink">{pot.name}</span>
          <span className="truncate text-xs text-muted">
            Goal {formatMoney(pot.target, currency, 0)}
            {pot.targetDate ? ` by ${formatMonthYear(pot.targetDate)}` : ''}
          </span>
        </button>
        <Ring size={52} innerSize={40} background={ringBackground(pot.color, pct)} label={`${pot.name} ${pct}% of goal`}>
          <span className="text-xs font-semibold text-ink">{pct}%</span>
        </Ring>
      </div>
      <span className="font-display text-[28px] font-semibold tracking-tight text-ink">
        {formatMoney(saved, currency, 0)}
      </span>
      <div className="flex items-center justify-between gap-2 border-t border-line pt-3">
        <span className="text-xs text-muted">{formatMoney(pot.monthlyContribution, currency, 0)} a month</span>
        <button
          onClick={onAdd}
          className="rounded-[10px] bg-surface-2 px-3 py-2 text-xs font-semibold text-ink hover:bg-track"
          aria-label={`Add to ${pot.name}`}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
