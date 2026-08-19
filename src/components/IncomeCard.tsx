import type { Frequency, Income } from '../types';
import { FREQUENCY_LABELS, monthlyCost } from '../lib/frequency';
import { formatMoney } from '../lib/format';

interface Props {
  income: Income;
  onChange: (patch: Partial<Income>) => void;
  monthlyBillsTotal: number;
  currency: string;
}

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'];

export function IncomeCard({ income, onChange, monthlyBillsTotal, currency }: Props) {
  const monthlyIncome = monthlyCost(income.amount, income.frequency, income.customIntervalDays);
  const leftover = monthlyIncome - monthlyBillsTotal;
  const hasIncome = income.amount > 0;

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50 focus:bg-white/8';

  return (
    <div className="glass rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-white/50">Income</label>
            <input
              className={inputClass}
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={income.amount || ''}
              onChange={(e) => onChange({ amount: Number(e.target.value) || 0 })}
            />
          </div>
          <div className="sm:w-40">
            <label className="mb-1.5 block text-xs font-medium text-white/50 sm:sr-only">Frequency</label>
            <select
              className={inputClass}
              value={income.frequency}
              onChange={(e) => onChange({ frequency: e.target.value as Frequency })}
            >
              {FREQUENCIES.map((f) => (
                <option key={f} value={f}>
                  {FREQUENCY_LABELS[f]}
                </option>
              ))}
            </select>
          </div>
          {income.frequency === 'custom' && (
            <div className="flex items-center gap-2 sm:w-32">
              <input
                className={inputClass}
                type="number"
                min="1"
                placeholder="Days"
                value={income.customIntervalDays ?? ''}
                onChange={(e) => onChange({ customIntervalDays: Number(e.target.value) || null })}
              />
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="text-xs font-medium text-white/40">Left after bills</p>
          <p className={`font-display text-2xl font-bold ${!hasIncome ? 'text-white/30' : leftover >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {leftover < 0 ? '−' : ''}
            {formatMoney(leftover, currency)}
            <span className="text-sm text-white/35">/mo</span>
          </p>
          {hasIncome && (
            <p className="mt-0.5 text-[11px] text-white/35">
              {formatMoney(monthlyIncome, currency)} income − {formatMoney(monthlyBillsTotal, currency)} bills
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
