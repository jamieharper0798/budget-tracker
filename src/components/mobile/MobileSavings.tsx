import { GrowthChart } from '../GrowthChart';
import { formatDate, formatMonthYear, formatMoney } from '../../lib/format';
import { parseISODate } from '../../lib/frequency';
import type { Deposit, SavingsPot } from '../../types';

interface Props {
  potsWithSaved: { pot: SavingsPot; saved: number }[];
  growth: { label: string; total: number }[];
  growthDelta: number;
  totalSavedAll: number;
  recentDeposits: Deposit[];
  currency: string;
  potName: (potId: string) => string;
  onNewPot: () => void;
  onLogSaving: (potId: string | null) => void;
  onEditPot: (pot: SavingsPot) => void;
  onAdjust: (pot: SavingsPot) => void;
}

export function MobileSavings({
  potsWithSaved, growth, growthDelta, totalSavedAll, recentDeposits, currency,
  potName, onNewPot, onLogSaving, onEditPot, onAdjust,
}: Props) {
  return (
    <main className="flex flex-col gap-4 px-4 pt-1" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted">
            {potsWithSaved.length} pot{potsWithSaved.length === 1 ? '' : 's'}
          </span>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink">Savings</h1>
        </div>
        <button onClick={onNewPot} aria-label="New pot" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      <section className="flex flex-col gap-3.5 rounded-[28px] bg-ink p-[22px] text-white">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-sm font-medium text-muted-on-ink">Total saved</h2>
            <span className="font-display text-[44px] font-semibold leading-none tracking-tight">{formatMoney(totalSavedAll, currency, 0)}</span>
          </div>
          {growth.length > 0 && (
            <span className="shrink-0 rounded-full bg-accent px-2.5 py-1.5 text-xs font-semibold text-ink">
              {growthDelta >= 0 ? '+' : '−'}
              {formatMoney(Math.abs(growthDelta), currency, 0)} since {growth[0]?.label}
            </span>
          )}
        </div>
        <GrowthChart history={growth} currency={currency} />
        <button onClick={() => onLogSaving(null)} className="flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] bg-accent font-semibold text-ink">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Log a saving
        </button>
      </section>

      <div className="flex flex-col gap-4">
        {potsWithSaved.length === 0 ? (
          <p className="card py-8 text-center text-sm text-muted">No savings pots yet. Tap + to create one.</p>
        ) : (
          potsWithSaved.map(({ pot, saved }) => {
            const pct = pot.target > 0 ? Math.round((saved / pot.target) * 100) : 0;
            return (
              <section key={pot.id} className="card flex flex-col gap-3.5">
                <div className="flex items-center gap-3">
                  <button onClick={() => onEditPot(pot)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-sm font-bold text-ink" style={{ background: `${pot.color}22` }}>
                    {pot.name[0]?.toUpperCase() ?? '?'}
                  </button>
                  <button onClick={() => onEditPot(pot)} className="min-w-0 flex-1 text-left">
                    <h2 className="truncate text-[16px] font-semibold text-ink">{pot.name}</h2>
                    <span className="truncate text-[13px] text-muted">
                      {formatMoney(pot.monthlyContribution, currency, 0)} a month
                      {pot.targetDate ? ` · goal by ${formatMonthYear(pot.targetDate)}` : ''}
                    </span>
                  </button>
                  <span className="shrink-0 font-bold text-muted-2">{pct}%</span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="font-display text-[28px] font-semibold tracking-tight text-ink">{formatMoney(saved, currency, 0)}</span>
                  <span className="text-muted">of {formatMoney(pot.target, currency, 0)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-track">
                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: pot.color }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-muted">{formatMoney(Math.max(0, pot.target - saved), currency, 0)} to go</span>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => onAdjust(pot)} className="min-h-10 rounded-xl px-3 text-sm font-semibold text-muted">
                      Adjust
                    </button>
                    <button onClick={() => onLogSaving(pot.id)} aria-label={`Add to ${pot.name}`} className="min-h-10 rounded-xl bg-surface-2 px-3.5 text-sm font-semibold text-ink">
                      + Add
                    </button>
                  </div>
                </div>
              </section>
            );
          })
        )}
      </div>

      <section className="card flex flex-col gap-1 px-4 pb-2 pt-4.5">
        <h2 className="mb-1.5 text-[19px] font-semibold text-ink">Recent deposits</h2>
        {recentDeposits.length === 0 ? (
          <p className="py-3 text-sm text-muted">No deposits logged yet.</p>
        ) : (
          recentDeposits.map((d) => (
            <div key={d.id} className="flex items-center justify-between gap-2 border-t border-line py-2.5 text-sm first:border-t-0">
              <span className="min-w-0 flex-1 truncate">
                <span className="font-semibold text-ink">{potName(d.potId)}</span>
                <span className="block text-[13px] text-muted">{formatDate(parseISODate(d.date))}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1.5 text-sm font-semibold ${d.amount >= 0 ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-alert'}`}>
                {d.amount >= 0 ? '+' : '−'}
                {formatMoney(d.amount, currency, 0)}
              </span>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
