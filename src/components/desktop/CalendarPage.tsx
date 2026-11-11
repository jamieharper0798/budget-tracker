import { useMemo, useState } from 'react';
import type { EnrichedBill } from '../../lib/derive';
import type { BillPayment, Category, PlannedTransfer, SavingsPot, Settings } from '../../types';
import { eventsOnDay } from '../../lib/calendar';
import { formatMoney } from '../../lib/format';
import { toISODate, todayUTC } from '../../lib/frequency';

interface Props {
  enriched: EnrichedBill[];
  categories: Category[];
  payments: BillPayment[];
  pots: SavingsPot[];
  plannedTransfers: PlannedTransfer[];
  settings: Settings;
  currency: string;
  monthlyIncome: number;
  onTogglePaid: (billId: string, period: string) => void;
  onOpenAddBill: (prefillDate?: string) => void;
  onUpdatePayDay: (payDay: number) => void;
}

function ordinal(day: number): string {
  if (day % 10 === 1 && day !== 11) return `${day}st`;
  if (day % 10 === 2 && day !== 12) return `${day}nd`;
  if (day % 10 === 3 && day !== 13) return `${day}rd`;
  return `${day}th`;
}

export function CalendarPage({
  enriched,
  categories,
  payments,
  pots,
  plannedTransfers,
  settings,
  currency,
  monthlyIncome,
  onTogglePaid,
  onOpenAddBill,
  onUpdatePayDay,
}: Props) {
  const today = todayUTC();
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());
  const [selected, setSelected] = useState(today.getUTCDate());

  const potName = (potId: string) => pots.find((p) => p.id === potId)?.name ?? 'Pot';
  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  const sameMonthAsToday = year === today.getUTCFullYear() && month === today.getUTCMonth();

  const goToday = () => {
    setYear(today.getUTCFullYear());
    setMonth(today.getUTCMonth());
    setSelected(today.getUTCDate());
  };
  const step = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
    setSelected(1);
  };

  const monthLabel = new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, month, 1)).getUTCDay() + 6) % 7; // Monday-start
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;

  const dayEvents = (day: number) =>
    eventsOnDay(day, year, month, enriched, payments, period, today, plannedTransfers, potName, settings.payDay, monthlyIncome);

  const cells = useMemo(() => {
    const result: { day: number; inMonth: boolean }[] = [];
    for (let i = 0; i < cellCount; i += 1) {
      const date = new Date(Date.UTC(year, month, i - firstWeekday + 1));
      result.push({ day: date.getUTCDate(), inMonth: date.getUTCMonth() === month });
    }
    return result;
  }, [cellCount, year, month, firstWeekday]);

  const selectedEvents = dayEvents(selected);
  const selectedDate = new Date(Date.UTC(year, month, selected));
  const diffDays = Math.round((selectedDate.getTime() - today.getTime()) / 86_400_000);
  const relLabel = diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : diffDays === -1 ? 'Yesterday' : diffDays > 0 ? `In ${diffDays} days` : `${-diffDays} days ago`;

  const billTotal = enriched.filter((b) => b.active).reduce((s, b) => s + b.monthly, 0);
  const paidTotal = enriched.filter((b) => b.active && payments.some((p) => p.billId === b.id && p.period === period)).reduce((s, b) => s + b.monthly, 0);
  const transfersTotal = plannedTransfers.reduce((s, t) => s + t.amount, 0);

  const weeks = useMemo(() => {
    const rows: { label: string; amt: number; current: boolean }[] = [];
    for (let w = 0; w < cellCount / 7; w += 1) {
      const weekStart = new Date(Date.UTC(year, month, w * 7 - firstWeekday + 1));
      let amt = 0;
      let isCurrent = false;
      for (let d = 0; d < 7; d += 1) {
        const date = new Date(Date.UTC(year, month, w * 7 - firstWeekday + 1 + d));
        if (date.getUTCMonth() !== month) continue;
        amt += dayEvents(date.getUTCDate())
          .filter((e) => e.type === 'bill')
          .reduce((s, e) => s + (e as { amount: number }).amount, 0);
        if (sameMonthAsToday && date.getUTCDate() === today.getUTCDate()) isCurrent = true;
      }
      const weekEnd = new Date(Date.UTC(year, month, w * 7 - firstWeekday + 7));
      const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', timeZone: 'UTC' });
      rows.push({ label: `${fmt(weekStart)} – ${fmt(weekEnd)}${isCurrent ? ' · this week' : ''}`, amt, current: isCurrent });
    }
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellCount, year, month, firstWeekday, enriched, payments, plannedTransfers, settings.payDay]);
  const maxWeek = Math.max(...weeks.map((w) => w.amt), 1);

  const [payDayInput, setPayDayInput] = useState(settings.payDay ? String(settings.payDay) : '');

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">Bills, savings and payday in one view</span>
          <h1 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-ink">Calendar</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToday} className="min-h-11 rounded-[14px] border border-border bg-surface px-4 text-sm font-semibold text-ink">
            Today
          </button>
          <div className="flex items-center gap-1 rounded-[14px] bg-surface p-1 shadow-[0_1px_2px_rgba(14,17,22,.04)]">
            <button onClick={() => step(-1)} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-surface-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <span className="min-w-[132px] text-center text-sm font-semibold text-ink">{monthLabel}</span>
            <button onClick={() => step(1)} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-surface-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <section className="card flex min-w-0 flex-[3_1_680px] flex-col gap-3.5 p-5" aria-label={monthLabel}>
          <div className="flex flex-wrap gap-4 px-1 text-[13px] text-muted-2">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-white shadow-[inset_0_0_0_1.5px_var(--color-ink)]" />
              Bill due
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-track" />
              Bill paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-violet-bg" />
              Saving
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm bg-accent" />
              Payday
            </span>
          </div>

          <div className="overflow-x-auto">
            <div className="flex min-w-[720px] flex-col gap-1.5">
              <div className="grid grid-cols-7 gap-1.5">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                  <span key={d} className="px-2 text-[13px] font-semibold text-muted">
                    {d}
                  </span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {cells.map(({ day, inMonth }, i) => {
                  if (!inMonth) {
                    return (
                      <div key={i} className="min-h-[118px] rounded-2xl" aria-hidden="true">
                        <span className="px-2 text-[13px] font-semibold text-faint">{day}</span>
                      </div>
                    );
                  }
                  const events = dayEvents(day);
                  const billDayTotal = events.filter((e) => e.type === 'bill').reduce((s, e) => s + (e as { amount: number }).amount, 0);
                  const isToday = sameMonthAsToday && day === today.getUTCDate();
                  return (
                    <button
                      key={i}
                      onClick={() => setSelected(day)}
                      aria-pressed={selected === day}
                      aria-label={`${day} ${monthLabel}, ${events.length ? `${events.length} items` : 'nothing due'}`}
                      className={`flex min-h-[118px] flex-col gap-1 rounded-2xl border p-2 text-left ${
                        selected === day ? 'border-2 border-ink bg-surface-3' : 'border-track bg-cell'
                      }`}
                    >
                      <span className="flex w-full items-center justify-between">
                        <span className={`flex h-[26px] min-w-[26px] items-center justify-center rounded-full px-1 text-[13px] font-semibold ${isToday ? 'bg-ink text-white' : 'text-ink'}`}>
                          {day}
                        </span>
                        <span className="text-[11px] font-semibold text-muted">{billDayTotal ? formatMoney(billDayTotal, currency, 0) : ''}</span>
                      </span>
                      {events.slice(0, 3).map((e, idx) => {
                        const prefix = e.type === 'save' ? '→ ' : e.type === 'pay' ? '+ ' : '';
                        const name = e.type === 'bill' ? e.name : e.type === 'save' ? e.name : 'Payday';
                        const cls =
                          e.type === 'bill'
                            ? e.state === 'paid'
                              ? 'bg-track text-muted line-through'
                              : e.state === 'overdue'
                                ? 'bg-warn-bg text-warn-fg'
                                : e.state === 'set-aside'
                                  ? 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]'
                                  : 'bg-surface text-ink shadow-[inset_0_0_0_1.5px_var(--color-ink)]'
                            : e.type === 'save'
                              ? 'bg-violet-bg text-violet-fg'
                              : 'bg-accent text-ink';
                        return (
                          <span key={idx} className={`block w-full truncate rounded-md px-1.5 py-0.5 text-[12px] font-semibold ${cls}`}>
                            {prefix}
                            {name} {formatMoney(e.amount, currency, 0)}
                          </span>
                        );
                      })}
                      {events.length > 3 && <span className="px-0.5 text-[11px] font-semibold text-muted">+{events.length - 3} more</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
          <section className="card flex flex-col gap-3.5 p-6">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-muted">{relLabel}</span>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
              </h2>
            </div>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-muted">Nothing due on this day.</p>
            ) : (
              selectedEvents.map((e, i) => {
                const name = e.type === 'bill' ? e.name : e.type === 'save' ? e.name : 'Payday';
                const kind =
                  e.type === 'bill' ? `${categories.find((c) => c.id === e.bill.categoryId)?.name ?? 'Bill'}` : e.type === 'save' ? 'Saving transfer' : 'Income';
                const badgeBg = e.type === 'bill' ? `${categories.find((c) => c.id === e.bill.categoryId)?.color ?? '#64748b'}22` : e.type === 'save' ? 'var(--color-violet-bg)' : 'var(--color-accent)';
                const badgeFg = e.type === 'bill' ? (categories.find((c) => c.id === e.bill.categoryId)?.color ?? '#64748b') : e.type === 'save' ? 'var(--color-violet-fg)' : 'var(--color-ink)';
                return (
                  <div key={i} className="flex items-center gap-3 border-t border-line pt-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold" style={{ background: badgeBg, color: badgeFg }}>
                      {name[0]?.toUpperCase()}
                    </span>
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="truncate font-semibold text-ink">{name}</span>
                      <span className="text-[13px] text-muted">
                        {kind} · {formatMoney(e.amount, currency)}
                      </span>
                    </div>
                    {e.type === 'bill' && e.state !== 'set-aside' && (
                      <button
                        onClick={() => onTogglePaid(e.bill.id, period)}
                        aria-pressed={e.state === 'paid'}
                        aria-label={`${e.state === 'paid' ? 'Paid' : 'Mark as paid'}: ${e.name}`}
                        className={`min-h-9 shrink-0 rounded-[10px] px-3 text-[13px] font-semibold ${
                          e.state === 'paid' ? 'bg-ok-bg text-ok-fg' : e.state === 'overdue' ? 'bg-warn-bg text-warn-fg' : 'border border-border bg-surface text-ink'
                        }`}
                      >
                        {e.state === 'paid' ? '✓ Paid' : e.state === 'overdue' ? 'Overdue' : 'Mark paid'}
                      </button>
                    )}
                  </div>
                );
              })
            )}
            <button
              onClick={() => onOpenAddBill(toISODate(new Date(Date.UTC(year, month, selected))))}
              className="mt-1 min-h-11 rounded-[14px] border-[1.5px] border-dashed border-border text-sm font-medium text-muted-2"
            >
              + Add bill on this day
            </button>
          </section>

          <section className="card flex flex-col gap-3.5 !bg-ink p-6 text-white">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-xl font-semibold tracking-tight">{new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' })} at a glance</h2>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-line pt-2.5 text-sm">
              <span className="text-muted-on-ink">Payday</span>
              {settings.payDay ? (
                <span className="font-semibold">
                  {ordinal(settings.payDay)} · {formatMoney(monthlyIncome, currency)}
                </span>
              ) : (
                <span className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={payDayInput}
                    onChange={(e) => setPayDayInput(e.target.value)}
                    placeholder="Day"
                    className="w-14 rounded-lg border border-ink-line bg-ink px-2 py-1 text-center text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => {
                      const d = Math.round(Number(payDayInput));
                      if (d >= 1 && d <= 31) onUpdatePayDay(d);
                    }}
                    className="rounded-lg bg-accent px-2 py-1 text-xs font-semibold text-ink"
                  >
                    Set
                  </button>
                </span>
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-line pt-2.5 text-sm">
              <span className="text-muted-on-ink">Bills due</span>
              <span className="font-semibold">{formatMoney(billTotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-line pt-2.5 text-sm">
              <span className="text-muted-on-ink">Paid so far</span>
              <span className="font-semibold">{formatMoney(paidTotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-line pt-2.5 text-sm">
              <span className="text-muted-on-ink">Still to pay</span>
              <span className="font-semibold">{formatMoney(billTotal - paidTotal, currency)}</span>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-ink-line pt-2.5 text-sm">
              <span className="text-muted-on-ink">Savings transfers</span>
              <span className="font-semibold">{formatMoney(transfersTotal, currency)}</span>
            </div>
          </section>

          <section className="card flex flex-col gap-3.5 p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Bills by week</h2>
            {weeks.map((w, i) => (
              <div key={i} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm ${w.current ? 'font-semibold text-ink' : 'text-muted-2'}`}>{w.label}</span>
                  <span className="text-sm font-semibold text-ink">{formatMoney(w.amt, currency)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-track">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${w.amt ? Math.max(3, Math.round((w.amt / maxWeek) * 100)) : 0}%`, background: w.current ? 'var(--color-ink)' : 'var(--color-violet)' }}
                  />
                </div>
              </div>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
