import { useMemo, useState } from 'react';
import type { EnrichedBill } from '../../lib/derive';
import { formatDueDay, formatMoney } from '../../lib/format';
import { SwipeRow } from './SwipeRow';

interface BillRow {
  bill: EnrichedBill;
  dueDate: Date;
  paid: boolean;
  overdue: boolean;
}

interface Props {
  year: number;
  month: number;
  billRows: BillRow[];
  billsTotal: number;
  paidAmt: number;
  paidCount: number;
  currency: string;
  today: Date;
  onAddBill: () => void;
  onTogglePaid: (billId: string) => void;
  onEditBill: (bill: EnrichedBill) => void;
}

type Filter = 'all' | 'unpaid' | 'paid';

export function MobileBills({ year, month, billRows, billsTotal, paidAmt, paidCount, currency, today, onAddBill, onTogglePaid, onEditBill }: Props) {
  const [filter, setFilter] = useState<Filter>('all');

  const shown = useMemo(
    () => billRows.filter((r) => filter === 'all' || (filter === 'paid') === r.paid),
    [billRows, filter],
  );

  const groups = useMemo(() => {
    const dayMs = 86_400_000;
    const overdue = shown.filter((r) => !r.paid && r.dueDate.getTime() < today.getTime());
    const thisWeek = shown.filter((r) => !r.paid && r.dueDate.getTime() >= today.getTime() && (r.dueDate.getTime() - today.getTime()) / dayMs <= 7);
    const later = shown.filter((r) => !r.paid && (r.dueDate.getTime() - today.getTime()) / dayMs > 7);
    const paid = shown.filter((r) => r.paid);
    return [
      ['Overdue', overdue] as const,
      ['This week', thisWeek] as const,
      ['Later this month', later] as const,
      ['Paid', paid] as const,
    ].filter(([, list]) => list.length > 0);
  }, [shown, today]);

  return (
    <main className="flex flex-col gap-4 px-4 pt-1" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted">
            {new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
          </span>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink">Bills</h1>
        </div>
        <button onClick={onAddBill} aria-label="Add bill" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-accent">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      <section className="card flex flex-col gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-medium text-muted">Still to pay this month</span>
            <span className="font-display text-[30px] font-semibold tracking-tight text-ink">{formatMoney(billsTotal - paidAmt, currency)}</span>
          </div>
          <span className="text-right text-[13px] text-muted">
            {paidCount} of {billRows.length} paid
            <br />
            {formatMoney(billsTotal, currency)} a month
          </span>
        </div>
        <div className="flex h-2 gap-[3px]">
          {billRows.map((r) => (
            <span key={r.bill.id} className={`h-full flex-1 rounded-full ${r.paid ? 'bg-ink' : 'bg-track'}`} />
          ))}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-[3px] rounded-[14px] bg-[#E2E5DF] p-[3px]" role="group" aria-label="Filter bills">
        {(['all', 'unpaid', 'paid'] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={`min-h-10 rounded-[11px] text-sm ${filter === f ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(14,17,22,.12)]' : 'font-medium text-muted-2'}`}
          >
            {f === 'all' ? 'All' : f === 'unpaid' ? 'Unpaid' : 'Paid'}
          </button>
        ))}
      </div>

      <span className="flex items-center gap-2 px-1 text-[13px] text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
        Swipe left on a bill to mark it paid
      </span>

      <div className="flex flex-col gap-4">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No bills here.</p>
        ) : (
          groups.map(([title, list]) => (
            <section key={title} className="flex flex-col gap-2">
              <h2 className="px-1 text-[13px] font-semibold uppercase tracking-[.6px] text-muted">{title}</h2>
              <div className="overflow-hidden rounded-[22px] bg-surface">
                {list.map((r) => (
                  <SwipeRow key={r.bill.id} paid={r.paid} label={r.bill.name} onToggle={() => onTogglePaid(r.bill.id)}>
                    <button onClick={() => onEditBill(r.bill)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[13px] bg-surface-2 text-sm font-bold text-ink">
                        {r.bill.name[0]?.toUpperCase() ?? '?'}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-semibold ${r.paid ? 'text-muted' : 'text-ink'}`}>{r.bill.name}</span>
                        <span className="block truncate text-[13px] text-muted">
                          {r.overdue ? 'Overdue · ' : ''}Due {formatDueDay(r.dueDate)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(r.bill.monthly, currency)}</span>
                    </button>
                  </SwipeRow>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
