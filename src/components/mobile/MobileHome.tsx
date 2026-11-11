import type { EnrichedBill } from '../../lib/derive';
import { formatDueLabel, formatMoney, ringBackground } from '../../lib/format';
import type { SavingsPot } from '../../types';

type Screen = 'home' | 'bills' | 'savings' | 'settings';

interface BillRow {
  bill: EnrichedBill;
  dueDate: Date;
  paid: boolean;
  overdue: boolean;
}

interface Props {
  today: Date;
  year: number;
  month: number;
  prevMonth: () => void;
  nextMonth: () => void;
  email: string | null;
  monthlyIncome: number;
  billsTotal: number;
  savingsTotal: number;
  leftover: number;
  remaining: number;
  paidCount: number;
  activeBillCount: number;
  nextUp: BillRow | null;
  upcoming: BillRow[];
  potsWithSaved: { pot: SavingsPot; saved: number }[];
  currency: string;
  onAddBill: () => void;
  onLogSaving: () => void;
  onTogglePaid: (billId: string) => void;
  onGo: (screen: Screen) => void;
}

function greetingName(email: string | null): string {
  if (!email) return 'there';
  const local = email.split('@')[0] ?? '';
  const first = local.split(/[._-]+/)[0] ?? local;
  return first ? first[0].toUpperCase() + first.slice(1) : 'there';
}

function initials(email: string | null): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || '?';
}

const paidPct = (billsTotal: number, remaining: number) =>
  billsTotal > 0 ? Math.round(((billsTotal - remaining) / billsTotal) * 100) : 0;

export function MobileHome(props: Props) {
  const {
    today, year, month, prevMonth, nextMonth, email,
    monthlyIncome, billsTotal, savingsTotal, leftover, remaining, paidCount, activeBillCount,
    nextUp, upcoming, potsWithSaved, currency, onAddBill, onLogSaving, onTogglePaid, onGo,
  } = props;

  const pct = paidPct(billsTotal, remaining);

  return (
    <main className="flex flex-col gap-4 px-4 pt-1" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted">
            {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
          </span>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink">Hi, {greetingName(email)}</h1>
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet text-sm font-semibold text-white" role="img" aria-label={email ?? 'Account'}>
          {initials(email)}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-2xl bg-surface p-0.5">
        <button onClick={prevMonth} aria-label="Previous month" className="flex h-11 w-11 items-center justify-center rounded-[14px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <span className="text-sm font-semibold text-ink">
          {new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
        </span>
        <button onClick={nextMonth} aria-label="Next month" className="flex h-11 w-11 items-center justify-center rounded-[14px]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </div>

      <section className="flex flex-col gap-[18px] rounded-[28px] bg-ink p-[22px] text-white">
        <div className="flex flex-col gap-1.5">
          <h2 className="text-sm font-medium text-muted-on-ink">Left over after bills &amp; savings</h2>
          <div className="font-display text-[46px] font-semibold leading-none tracking-tight">
            {leftover < 0 ? '−' : ''}
            {formatMoney(leftover, currency)}
          </div>
        </div>
        <div className="flex h-2.5 gap-1" role="img" aria-label={`Of ${formatMoney(monthlyIncome, currency, 0)} income: bills, savings and left over`}>
          <span className="rounded-full bg-peach" style={{ flex: `${Math.max(billsTotal, 0.0001)} 1 0` }} />
          <span className="rounded-full bg-violet-soft" style={{ flex: `${Math.max(savingsTotal, 0.0001)} 1 0` }} />
          <span className="rounded-full bg-accent" style={{ flex: `${Math.max(leftover, 0.0001)} 1 0` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { k: 'Income', v: monthlyIncome, c: null },
            { k: 'Bills', v: billsTotal, c: 'var(--color-peach)' },
            { k: 'Savings', v: savingsTotal, c: 'var(--color-violet-soft)' },
          ].map((t) => (
            <div key={t.k} className="flex flex-col gap-1 rounded-[14px] bg-ink-2 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[12px] text-muted-on-ink">
                {t.c && <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: t.c }} />}
                {t.k}
              </span>
              <span className="text-[15px] font-semibold text-white">{formatMoney(t.v, currency)}</span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onAddBill} className="flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] bg-accent font-semibold text-ink">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add bill
          </button>
          <button onClick={onLogSaving} className="flex min-h-12 items-center justify-center gap-1.5 rounded-[14px] border border-ink-line bg-ink-2 font-semibold text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              <path d="M21 11h-6a2 2 0 0 0 0 4h6z" />
            </svg>
            Log saving
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <button onClick={() => onGo('bills')} className="card-sm flex flex-col gap-2.5 p-4 text-left">
          <div className="h-16 w-16 rounded-full" role="img" aria-label={`${paidCount} of ${activeBillCount} bills paid`} style={{ background: ringBackground('var(--color-ink)', pct) }}>
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-surface text-sm font-bold text-ink">
                {paidCount}/{activeBillCount}
              </div>
            </div>
          </div>
          <span className="text-[13px] font-medium text-muted">Still to pay</span>
          <span className="font-display text-xl font-semibold text-ink">{formatMoney(remaining, currency)}</span>
        </button>
        <button onClick={() => onGo('bills')} className="card-sm flex flex-col gap-2.5 p-4 text-left">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-warn-bg">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warn-fg)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="5" width="18" height="16" rx="3" />
              <path d="M16 3v4M8 3v4M3 10h18" />
            </svg>
          </div>
          <span className="text-[13px] font-medium text-muted">
            {nextUp ? `Next due · ${formatDueLabel(Math.round((nextUp.dueDate.getTime() - today.getTime()) / 86_400_000)).toLowerCase()}` : 'Next due'}
          </span>
          <span className="font-display text-xl font-semibold text-ink">{nextUp ? formatMoney(nextUp.bill.monthly, currency) : '—'}</span>
          <span className="-mt-1.5 truncate text-[13px] text-muted">{nextUp ? nextUp.bill.name : 'All paid'}</span>
        </button>
      </div>

      <section className="card flex flex-col gap-1 px-4 pb-2 pt-4.5">
        <div className="flex items-center justify-between pb-1.5">
          <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Coming up</h2>
          <button onClick={() => onGo('bills')} className="min-h-11 text-sm font-semibold text-ink">
            All bills
          </button>
        </div>
        {upcoming.length === 0 ? (
          <p className="py-3 text-sm text-muted">Every bill is marked paid for this period.</p>
        ) : (
          upcoming.map(({ bill, dueDate, paid }) => (
            <div key={bill.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
              <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[14px] bg-surface-2 leading-tight">
                <b className="text-[15px] text-ink">{String(dueDate.getUTCDate()).padStart(2, '0')}</b>
                <span className="text-[11px] font-medium text-muted">{dueDate.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}</span>
              </div>
              <div className="min-w-0 flex-1">
                <span className={`block truncate text-sm font-semibold ${paid ? 'text-muted line-through' : 'text-ink'}`}>{bill.name}</span>
                <span className="text-[13px] text-muted">
                  {formatDueLabel(Math.round((dueDate.getTime() - today.getTime()) / 86_400_000))} · {formatMoney(bill.monthly, currency)}
                </span>
              </div>
              <button
                onClick={() => onTogglePaid(bill.id)}
                aria-pressed={paid}
                aria-label={`${paid ? 'Paid' : 'Mark as paid'}: ${bill.name}`}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
                  paid ? 'border-0 bg-accent text-ink' : 'border-[#D9DCD6] bg-surface text-[#C2C6CC]'
                }`}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
              </button>
            </div>
          ))
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[19px] font-semibold text-ink">Savings pots</h2>
          <button onClick={() => onGo('savings')} className="min-h-11 text-sm font-semibold text-ink">
            See all
          </button>
        </div>
        {potsWithSaved.length === 0 ? (
          <p className="px-1 text-sm text-muted">No savings pots yet.</p>
        ) : (
          <div className="m-carousel -mx-4 flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
            {potsWithSaved.map(({ pot, saved }) => {
              const pct2 = pot.target > 0 ? Math.round((saved / pot.target) * 100) : 0;
              return (
                <div key={pot.id} className="card-sm flex w-[220px] shrink-0 flex-col gap-3 p-4" style={{ scrollSnapAlign: 'start' }}>
                  <div className="flex items-center justify-between">
                    <span className="truncate text-sm font-semibold text-ink">{pot.name}</span>
                    <span className="text-[13px] font-semibold text-muted">{pct2}%</span>
                  </div>
                  <span className="font-display text-2xl font-semibold tracking-tight text-ink">{formatMoney(saved, currency, 0)}</span>
                  <div className="h-2 overflow-hidden rounded-full bg-track">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct2))}%`, background: pot.color }} />
                  </div>
                  <span className="text-[13px] text-muted">of {formatMoney(pot.target, currency, 0)}</span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
