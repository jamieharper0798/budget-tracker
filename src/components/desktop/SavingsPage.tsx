import { useMemo, useState } from 'react';
import type { Deposit, SavingsPot, PlannedTransfer } from '../../types';
import { formatDate, formatMoney, formatMonthYear } from '../../lib/format';
import { parseISODate } from '../../lib/frequency';
import { potProgress } from '../../lib/savings';

interface Props {
  potsWithSaved: { pot: SavingsPot; saved: number }[];
  deposits: Deposit[];
  growth: { label: string; total: number }[];
  currency: string;
  plannedTransfers: PlannedTransfer[];
  onNewPot: () => void;
  onEditPot: (pot: SavingsPot) => void;
  onLogSaving: (potId: string | null) => void;
  onSetPlannedTransfer: (potId: string, day: number, amount: number) => void;
  onRemovePlannedTransfer: (potId: string) => void;
}

function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export function SavingsPage({
  potsWithSaved,
  deposits,
  growth,
  currency,
  plannedTransfers,
  onNewPot,
  onEditPot,
  onLogSaving,
  onSetPlannedTransfer,
  onRemovePlannedTransfer,
}: Props) {
  const [potFilter, setPotFilter] = useState<string>('all');

  const monthlyTotal = potsWithSaved.reduce((s, { pot }) => s + pot.monthlyContribution, 0);
  const totalSaved = potsWithSaved.reduce((s, { saved }) => s + saved, 0);
  const sinceFirst = growth.length > 0 ? totalSaved - growth[0].total : 0;

  const chart = useMemo(() => {
    const PROJ_MONTHS = 12;
    const series = growth.map((g) => g.total);
    for (let i = 1; i <= PROJ_MONTHS; i += 1) series.push(totalSaved + monthlyTotal * i);
    const n = series.length;
    const max = Math.max(...series, 1) * 1.08;
    const min = Math.min(...series, 0);
    const span = max - min || 1;
    const X = (i: number) => (i / (n - 1)) * 1000;
    const Y = (v: number) => 210 - ((v - min) / span) * 200;
    const histPts: [number, number][] = growth.map((g, i) => [X(i), Y(g.total)]);
    const line = histPts.length > 1 ? smooth(histPts) : '';
    const lastI = growth.length - 1;
    const area = line ? `${line} L${X(lastI)} 220 L0 220 Z` : '';
    const proj = `M${X(lastI)} ${Y(totalSaved)} L${X(n - 1)} ${Y(series[n - 1])}`;
    const labels = Array.from({ length: n }, (_, i) => i).filter((i) => i % 3 === 0 || i === n - 1);
    return { line, area, proj, n, lastI, labels, X, series };
  }, [growth, totalSaved, monthlyTotal]);

  const donut = useMemo(() => {
    if (monthlyTotal <= 0) return { background: 'var(--color-track)' };
    let acc = 0;
    const stops: string[] = [];
    for (const { pot } of potsWithSaved) {
      const start = acc;
      acc += (pot.monthlyContribution / monthlyTotal) * 100;
      stops.push(`${pot.color} ${start.toFixed(1)}% ${(acc - 0.8).toFixed(1)}%, #fff ${(acc - 0.8).toFixed(1)}% ${acc.toFixed(1)}%`);
    }
    return { background: `conic-gradient(${stops.join(', ')})` };
  }, [potsWithSaved, monthlyTotal]);

  const progressByPot = useMemo(() => {
    const map = new Map<string, ReturnType<typeof potProgress>>();
    for (const { pot, saved } of potsWithSaved) map.set(pot.id, potProgress(pot, saved));
    return map;
  }, [potsWithSaved]);

  const neededAll = potsWithSaved.reduce((sum, { pot }) => {
    const prog = progressByPot.get(pot.id);
    const need = prog?.neededPerMonth ?? pot.monthlyContribution;
    return sum + Math.max(need, pot.monthlyContribution);
  }, 0);
  const behindAny = neededAll > monthlyTotal;

  const transferByPot = new Map(plannedTransfers.map((t) => [t.potId, t]));

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">
            {potsWithSaved.length} pot{potsWithSaved.length === 1 ? '' : 's'} · {formatMoney(monthlyTotal, currency, 0)} set aside each month
          </span>
          <h1 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-ink">Savings</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onNewPot} className="min-h-11 rounded-[14px] border border-border bg-surface px-4 text-sm font-semibold text-ink">
            New pot
          </button>
          <button onClick={() => onLogSaving(null)} className="min-h-11 rounded-[14px] bg-ink px-4 text-sm font-semibold text-white">
            Log saving
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-stretch gap-5">
        <section className="card flex min-w-0 flex-[2_1_560px] flex-col gap-4 !bg-ink p-7 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h2 className="text-sm font-medium text-muted-on-ink">Total saved</h2>
              <span className="font-display text-[clamp(36px,5vw,52px)] font-semibold leading-none tracking-tight">
                {formatMoney(totalSaved, currency, 0)}
              </span>
              {growth.length > 0 && (
                <span className="w-fit rounded-full bg-accent px-3 py-1.5 text-[13px] font-semibold text-ink">
                  {sinceFirst >= 0 ? '+' : '−'}
                  {formatMoney(Math.abs(sinceFirst), currency, 0)} since {growth[0].label}
                </span>
              )}
            </div>
            <div className="flex gap-4 text-[13px] text-muted-on-ink">
              <span className="flex items-center gap-1.5">
                <span className="h-[3px] w-4 rounded-full bg-accent" />
                Saved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 border-t-2 border-dashed border-muted-on-ink" />
                Projected at {formatMoney(monthlyTotal, currency, 0)}/mo
              </span>
            </div>
          </div>

          {growth.every((g) => g.total === 0) ? (
            <p className="py-10 text-center text-sm text-muted-on-ink">Log a saving to see your growth chart.</p>
          ) : (
            <>
              <svg viewBox="0 0 1000 220" preserveAspectRatio="none" role="img" aria-label={`Savings rose to ${formatMoney(totalSaved, currency, 0)}; projected to reach about ${formatMoney(chart.series[chart.series.length - 1], currency, 0)} in a year at the current rate.`} style={{ width: '100%', height: 200, display: 'block' }}>
                <g stroke="var(--color-ink-line)" strokeWidth={1}>
                  <line x1="0" y1="60" x2="1000" y2="60" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="120" x2="1000" y2="120" vectorEffect="non-scaling-stroke" />
                  <line x1="0" y1="180" x2="1000" y2="180" vectorEffect="non-scaling-stroke" />
                </g>
                {chart.area && <path d={chart.area} fill="var(--color-accent)" fillOpacity={0.16} />}
                {chart.line && <path d={chart.line} fill="none" stroke="var(--color-accent)" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
                <path d={chart.proj} fill="none" stroke="var(--color-muted-on-ink)" strokeWidth={2} strokeDasharray="6 6" vectorEffect="non-scaling-stroke" />
              </svg>
              <div className="relative -mt-2 h-4 text-xs text-muted-on-ink">
                {chart.labels.map((i) => {
                  const d = new Date(Date.UTC(2000, i, 1));
                  const pct = (i / (chart.n - 1)) * 100;
                  const align = i === 0 ? 'translateX(0)' : i === chart.n - 1 ? 'translateX(-100%)' : 'translateX(-50%)';
                  return (
                    <span
                      key={i}
                      className={`absolute whitespace-nowrap ${i === chart.lastI ? 'font-semibold text-white' : ''}`}
                      style={{ left: `${pct}%`, transform: align }}
                    >
                      {d.toLocaleDateString(undefined, { month: 'short' })}
                    </span>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section className="card flex flex-col gap-4 p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Monthly split</h2>
            <div className="flex items-center gap-5">
              <div
                role="img"
                aria-label={`${formatMoney(monthlyTotal, currency, 0)} a month: ${potsWithSaved.map(({ pot }) => `${formatMoney(pot.monthlyContribution, currency, 0)} ${pot.name}`).join(', ')}`}
                className="grid shrink-0 place-items-center rounded-full"
                style={{ width: 110, height: 110, background: donut.background }}
              >
                <div className="flex flex-col items-center justify-center rounded-full bg-surface" style={{ width: 78, height: 78 }}>
                  <span className="font-display text-base font-semibold text-ink">{formatMoney(monthlyTotal, currency, 0)}</span>
                  <span className="text-xs text-muted">a month</span>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-2.5">
                {potsWithSaved.length === 0 ? (
                  <span className="text-sm text-muted">No pots yet.</span>
                ) : (
                  potsWithSaved.map(({ pot }) => (
                    <div key={pot.id} className="flex items-center gap-2 text-sm">
                      <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: pot.color }} />
                      <span className="flex-1 truncate text-ink">{pot.name}</span>
                      <span className="font-semibold text-ink">{formatMoney(pot.monthlyContribution, currency, 0)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>

          {behindAny && (
            <section className="flex flex-col gap-2 rounded-[24px] bg-warn-bg p-5">
              <h2 className="text-[15px] font-semibold text-warn-fg">To hit every target date</h2>
              <p className="text-sm leading-relaxed text-warn-fg">
                You'd need <strong>{formatMoney(neededAll, currency, 0)}</strong> a month across your pots —{' '}
                {formatMoney(neededAll - monthlyTotal, currency, 0)} more than now. Each pot below shows what it needs on its own.
              </p>
            </section>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3.5">
        <h2 className="px-1 font-display text-xl font-semibold tracking-tight text-ink">Pots</h2>
        {potsWithSaved.length === 0 ? (
          <div className="card p-12 text-center text-sm text-muted">No savings pots yet. Create one to start tracking a goal.</div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {potsWithSaved.map(({ pot, saved }) => {
              const prog = progressByPot.get(pot.id)!;
              const pct = pot.target > 0 ? Math.round((saved / pot.target) * 100) : 0;
              const transfer = transferByPot.get(pot.id);
              return (
                <article key={pot.id} className="card flex flex-col gap-4 p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-[17px] font-semibold text-ink">{pot.name}</h3>
                      {prog.onTrack !== null && (
                        <span className={`w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${prog.onTrack ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-warn-fg'}`}>
                          {prog.onTrack ? 'On track' : 'Behind target'}
                        </span>
                      )}
                    </div>
                    <div
                      role="img"
                      aria-label={`${pot.name} ${pct}% of goal`}
                      className="grid shrink-0 place-items-center rounded-full"
                      style={{ width: 70, height: 70, background: `conic-gradient(${pot.color} 0 ${pct}%, var(--color-track) ${pct}% 100%)` }}
                    >
                      <div className="flex items-center justify-center rounded-full bg-surface text-[15px] font-bold text-ink" style={{ width: 54, height: 54 }}>
                        {pct}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-[30px] font-semibold tracking-tight text-ink">{formatMoney(saved, currency, 0)}</span>
                    <span className="text-sm text-muted">of {formatMoney(pot.target, currency, 0)}</span>
                  </div>

                  <dl className="grid grid-cols-2 gap-x-3 gap-y-3 border-t border-line pt-3.5">
                    <div>
                      <dt className="text-[13px] text-muted">Saving</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatMoney(pot.monthlyContribution, currency, 0)} / month</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] text-muted">Still to save</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatMoney(prog.monthsNeeded === 0 ? 0 : pot.target - saved, currency, 0)}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] text-muted">Target date</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{pot.targetDate ? formatMonthYear(pot.targetDate) : 'Not set'}</dd>
                    </div>
                    <div>
                      <dt className="text-[13px] text-muted">At this rate</dt>
                      <dd className={`mt-0.5 font-semibold ${prog.onTrack === false ? 'text-warn-fg' : 'text-ok-fg'}`}>
                        {prog.monthsNeeded === null ? '—' : prog.monthsNeeded === 0 ? 'Reached' : `In ${prog.monthsNeeded} mo`}
                      </dd>
                    </div>
                  </dl>

                  {pot.targetDate && (
                    <p className="rounded-[14px] bg-surface-2 p-3 text-sm text-muted-2">
                      {prog.onTrack
                        ? 'Keep going — you will reach this goal on time.'
                        : prog.neededPerMonth != null
                          ? `Save ${formatMoney(prog.neededPerMonth, currency, 0)} a month (+${formatMoney(Math.max(0, prog.neededPerMonth - pot.monthlyContribution), currency, 0)}) to finish on time, or move the target date.`
                          : null}
                    </p>
                  )}

                  <div className="flex items-center gap-2 border-t border-line pt-3.5 text-sm">
                    <span className="text-muted">Auto-transfer on day</span>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={transfer?.day ?? ''}
                      placeholder="—"
                      onChange={(e) => {
                        const day = Math.round(Number(e.target.value));
                        if (day >= 1 && day <= 31) onSetPlannedTransfer(pot.id, day, pot.monthlyContribution);
                        else if (!e.target.value) onRemovePlannedTransfer(pot.id);
                      }}
                      className="w-14 rounded-lg border border-border bg-surface px-2 py-1 text-center text-sm outline-none"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => onLogSaving(pot.id)}
                      aria-label={`Add money to ${pot.name}`}
                      className="flex-1 rounded-[14px] bg-accent py-2.5 text-sm font-semibold text-ink"
                    >
                      + Add money
                    </button>
                    <button
                      onClick={() => onEditPot(pot)}
                      aria-label={`Edit ${pot.name}`}
                      className="rounded-[14px] border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink"
                    >
                      Edit
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Deposit history</h2>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by pot">
            <button
              onClick={() => setPotFilter('all')}
              aria-pressed={potFilter === 'all'}
              className={`flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                potFilter === 'all' ? 'border-ink bg-ink text-white' : 'border-chip-border bg-surface text-ink'
              }`}
            >
              All pots
            </button>
            {potsWithSaved.map(({ pot }) => (
              <button
                key={pot.id}
                onClick={() => setPotFilter(pot.id)}
                aria-pressed={potFilter === pot.id}
                className={`flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-medium ${
                  potFilter === pot.id ? 'border-ink bg-ink text-white' : 'border-chip-border bg-surface text-ink'
                }`}
              >
                {pot.name}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          {deposits.filter((d) => potFilter === 'all' || d.potId === potFilter).length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">No deposits logged yet.</p>
          ) : (
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr>
                  <th className="pb-2.5 text-left text-sm font-medium text-muted">Date</th>
                  <th className="pb-2.5 text-left text-sm font-medium text-muted">Pot</th>
                  <th className="pb-2.5 text-left text-sm font-medium text-muted">Note</th>
                  <th className="pb-2.5 text-right text-sm font-medium text-muted">Amount</th>
                </tr>
              </thead>
              <tbody>
                {deposits
                  .filter((d) => potFilter === 'all' || d.potId === potFilter)
                  .map((d) => {
                    const pot = potsWithSaved.find((p) => p.pot.id === d.potId)?.pot;
                    return (
                      <tr key={d.id}>
                        <td className="border-t border-line py-2.5 pr-2 text-muted-2">{formatDate(parseISODate(d.date))}</td>
                        <td className="border-t border-line py-2.5 pr-2 font-semibold text-ink">
                          <span className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: pot?.color ?? '#64748b' }} />
                            {pot?.name ?? 'Deleted pot'}
                          </span>
                        </td>
                        <td className="border-t border-line py-2.5 pr-2 text-muted-2">{d.note || '—'}</td>
                        <td className="border-t border-line py-2.5 text-right">
                          <span className={`rounded-full px-2.5 py-1 text-sm font-semibold ${d.amount >= 0 ? 'bg-ok-bg text-ok-fg' : 'bg-warn-bg text-alert'}`}>
                            {d.amount >= 0 ? '+' : '−'}
                            {formatMoney(d.amount, currency, 0)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
