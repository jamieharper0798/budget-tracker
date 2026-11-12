import { useMemo, useState } from 'react';
import type { EnrichedBill } from '../../lib/derive';
import type { Account, BillPayment, Category } from '../../types';
import { FREQUENCY_LABELS, dueDayInMonth, parseISODate, todayUTC } from '../../lib/frequency';
import { formatDueDay, formatMoney } from '../../lib/format';

interface Props {
  enriched: EnrichedBill[];
  categories: Category[];
  accounts: Account[];
  payments: BillPayment[];
  currency: string;
  onTogglePaid: (billId: string, period: string) => void;
  onOpenAddBill: () => void;
  onOpenEditBill: (bill: EnrichedBill) => void;
  onDeleteBill: (id: string) => void;
}

type Status = 'All' | 'Unpaid' | 'Paid' | 'Overdue';

function SortArrow({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 transition-transform ${active ? 'opacity-100' : 'opacity-30'} ${active && dir === 'desc' ? 'rotate-180' : ''}`}
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

export function BillsPage({ enriched, categories, accounts, payments, currency, onTogglePaid, onOpenAddBill, onOpenEditBill, onDeleteBill }: Props) {
  const today = todayUTC();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthName = today.toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' });

  const [status, setStatus] = useState<Status>('All');
  const [cat, setCat] = useState<string>('all');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(enriched[0]?.id ?? null);
  const [sortKey, setSortKey] = useState<'due' | 'cost' | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const toggleSort = (key: 'due' | 'cost') => {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    }
  };

  const isPaid = (billId: string) => payments.some((p) => p.billId === billId && p.period === period);
  const isOverdue = (bill: EnrichedBill) =>
    !isPaid(bill.id) && bill.frequency !== 'yearly' && dueDayInMonth(bill.anchorDate, year, month) < today.getUTCDate();

  const active = useMemo(() => enriched.filter((b) => b.active), [enriched]);
  const monthlyTotal = active.reduce((s, b) => s + b.monthly, 0);
  const yearlyTotal = active.reduce((s, b) => s + b.yearly, 0);
  const paidBills = active.filter((b) => isPaid(b.id));
  const paidAmt = paidBills.reduce((s, b) => s + b.monthly, 0);
  const overdueCount = active.filter(isOverdue).length;

  const rows = useMemo(
    () =>
      enriched.filter((b) => {
        const paid = isPaid(b.id);
        const okStatus =
          status === 'All' ||
          (status === 'Paid' && paid) ||
          (status === 'Unpaid' && !paid && b.active) ||
          (status === 'Overdue' && isOverdue(b));
        const okCat = cat === 'all' || b.categoryId === cat;
        const okQ = !q || b.name.toLowerCase().includes(q.toLowerCase());
        return okStatus && okCat && okQ;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enriched, status, cat, q, payments, period],
  );

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows;
    const sign = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const diff = sortKey === 'due' ? a.nextDue.getTime() - b.nextDue.getTime() : a.monthly - b.monthly;
      return diff * sign;
    });
  }, [rows, sortKey, sortDir]);

  const selectedBill = enriched.find((b) => b.id === selected) ?? enriched[0] ?? null;

  const byCategory = useMemo(() => {
    const rowsByCategory = categories
      .map((c) => {
        const bills = active.filter((b) => b.categoryId === c.id);
        const value = bills.reduce((s, b) => s + b.monthly, 0);
        return { category: c, count: bills.length, value };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.value - a.value);
    return rowsByCategory;
  }, [categories, active]);

  const byAccount = useMemo(() => {
    const rowsByAccount = accounts
      .map((a) => {
        const bills = active.filter((b) => b.accountId === a.id);
        const value = bills.reduce((s, b) => s + b.monthly, 0);
        return { account: a, count: bills.length, value };
      })
      .filter((r) => r.count > 0)
      .sort((a, b) => b.value - a.value);
    const noAccountBills = active.filter((b) => !b.accountId);
    if (noAccountBills.length > 0) {
      rowsByAccount.push({
        account: { id: '', name: 'No account', color: '#64748b' },
        count: noAccountBills.length,
        value: noAccountBills.reduce((s, b) => s + b.monthly, 0),
      });
    }
    return rowsByAccount;
  }, [accounts, active]);

  const history = useMemo(() => {
    if (!selectedBill) return [];
    return [-5, -4, -3, -2, -1, 0].map((n) => {
      const d = new Date(Date.UTC(year, month + n, 1));
      const label = d.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' });
      const p = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      if (selectedBill.frequency === 'yearly') {
        const dueMonth = parseISODate(selectedBill.anchorDate).getUTCMonth();
        const notDue = d.getUTCMonth() !== dueMonth;
        return { label, state: notDue ? ('not-due' as const) : ('due' as const) };
      }
      const paid = payments.some((x) => x.billId === selectedBill.id && x.period === p);
      return { label, state: paid ? ('paid' as const) : ('unpaid' as const) };
    });
  }, [selectedBill, payments, year, month]);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-muted">
            {monthName} {year} · {enriched.length} recurring bill{enriched.length === 1 ? '' : 's'}
          </span>
          <h1 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-ink">Bills</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex min-h-11 items-center gap-2 rounded-[14px] bg-surface px-3.5 text-muted shadow-[0_1px_2px_rgba(14,17,22,.04)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
            <span className="sr-only">Search bills</span>
            <input
              type="search"
              placeholder="Search bills"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-40 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
            />
          </label>
          <button onClick={onOpenAddBill} className="flex min-h-11 items-center gap-2 rounded-[14px] bg-ink px-4 text-sm font-semibold text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.6} strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add bill
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card-sm flex flex-col gap-2 !bg-ink p-5 text-white">
          <span className="text-[13px] font-medium text-muted-on-ink">Monthly total</span>
          <span className="font-display text-[30px] font-semibold tracking-tight">{formatMoney(monthlyTotal, currency)}</span>
          <span className="text-sm text-muted-on-ink">{formatMoney(yearlyTotal, currency)} a year</span>
        </div>
        <div className="card-sm flex flex-col gap-2 p-5">
          <span className="text-[13px] font-medium text-muted">Paid this month</span>
          <span className="font-display text-[30px] font-semibold tracking-tight text-ink">
            {paidBills.length} of {active.length}
          </span>
          <span className="text-sm text-muted">{formatMoney(paidAmt, currency)} paid</span>
        </div>
        <div className="card-sm flex flex-col gap-2 p-5">
          <span className="text-[13px] font-medium text-muted">Still to pay</span>
          <span className="font-display text-[30px] font-semibold tracking-tight text-ink">{formatMoney(monthlyTotal - paidAmt, currency)}</span>
          <span className="text-sm text-muted">
            {active.length - paidBills.length} bill{active.length - paidBills.length === 1 ? '' : 's'} left in {monthName}
          </span>
        </div>
        <div className="card-sm flex flex-col gap-2 p-5">
          <span className="text-[13px] font-medium text-muted">Overdue</span>
          <span className="font-display text-[30px] font-semibold tracking-tight text-ink">{overdueCount}</span>
          <span className={`text-sm font-semibold ${overdueCount ? 'text-warn-fg' : 'text-ok-fg'}`}>
            {overdueCount ? 'Needs attention' : 'Nothing overdue'}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-5">
        <section className="card flex min-w-0 flex-[2_1_560px] flex-col gap-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">All bills</h2>
            <div className="flex gap-1 rounded-[14px] bg-surface-2 p-1" role="group" aria-label="Status">
              {(['All', 'Unpaid', 'Paid', 'Overdue'] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  aria-pressed={status === s}
                  className={`min-h-9 rounded-[10px] px-3.5 text-sm font-medium ${
                    status === s ? 'bg-ink font-semibold text-white' : 'text-muted-2'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Category">
            <button
              onClick={() => setCat('all')}
              aria-pressed={cat === 'all'}
              className={`flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium ${
                cat === 'all' ? 'border-ink bg-ink text-white' : 'border-chip-border bg-surface text-ink'
              }`}
            >
              All categories
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                aria-pressed={cat === c.id}
                className={`flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[13px] font-medium ${
                  cat === c.id ? 'border-ink bg-ink text-white' : 'border-chip-border bg-surface text-ink'
                }`}
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: c.color }} />
                {c.name}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {sortedRows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted">No bills match these filters.</p>
            ) : (
              <table className="w-full min-w-[640px] border-collapse">
                <thead>
                  <tr>
                    <th className="pb-2.5 text-left text-sm font-medium text-muted">Bill</th>
                    <th className="pb-2.5 text-left text-sm font-medium text-muted">Category</th>
                    <th className="pb-2.5 text-left text-sm font-medium text-muted">How often</th>
                    <th className="pb-2.5 text-left text-sm font-medium text-muted" aria-sort={sortKey === 'due' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button
                        onClick={() => toggleSort('due')}
                        className={`flex items-center gap-1 ${sortKey === 'due' ? 'font-semibold text-ink' : ''}`}
                      >
                        Due
                        <SortArrow active={sortKey === 'due'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="pb-2.5 text-right text-sm font-medium text-muted" aria-sort={sortKey === 'cost' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}>
                      <button
                        onClick={() => toggleSort('cost')}
                        className={`flex w-full items-center justify-end gap-1 ${sortKey === 'cost' ? 'font-semibold text-ink' : ''}`}
                      >
                        Per month
                        <SortArrow active={sortKey === 'cost'} dir={sortDir} />
                      </button>
                    </th>
                    <th className="pb-2.5 text-right text-sm font-medium text-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((b) => {
                    const category = categories.find((c) => c.id === b.categoryId);
                    const paid = isPaid(b.id);
                    const late = isOverdue(b);
                    const freq =
                      b.frequency === 'yearly'
                        ? `Annual · ${formatMoney(b.amount, currency)}`
                        : b.paymentsPerYear
                          ? `Monthly (${b.paymentsPerYear} of 12)`
                          : FREQUENCY_LABELS[b.frequency];
                    return (
                      <tr key={b.id} className={selected === b.id ? 'bg-surface-3' : undefined}>
                        <td className="border-t border-line py-2.5 pr-2">
                          <button
                            onClick={() => setSelected(b.id)}
                            aria-pressed={selected === b.id}
                            className="flex min-h-11 items-center gap-3 text-left font-semibold text-ink"
                          >
                            <span
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] text-sm font-bold"
                              style={{ background: `${category?.color ?? '#64748b'}22`, color: category?.color ?? '#64748b' }}
                            >
                              {category?.icon ?? b.name[0]?.toUpperCase()}
                            </span>
                            <span className={!b.active ? 'text-muted' : undefined}>
                              {b.name}
                              {!b.active ? ' (paused)' : ''}
                            </span>
                          </button>
                        </td>
                        <td className="border-t border-line py-2.5 pr-2 text-muted-2">{category?.name ?? '—'}</td>
                        <td className="border-t border-line py-2.5 pr-2 text-muted-2">{freq}</td>
                        <td className="border-t border-line py-2.5 pr-2 text-muted-2">{formatDueDay(b.nextDue)}</td>
                        <td className="border-t border-line py-2.5 pr-2 text-right font-semibold text-ink">{formatMoney(b.monthly, currency)}</td>
                        <td className="border-t border-line py-2.5 text-right">
                          {b.active ? (
                            <button
                              onClick={() => onTogglePaid(b.id, period)}
                              aria-pressed={paid}
                              aria-label={`${paid ? 'Paid' : 'Mark as paid'}: ${b.name}`}
                              className={`min-h-9 min-w-[104px] rounded-[10px] px-3 text-[13px] font-semibold ${
                                paid ? 'bg-ok-bg text-ok-fg' : late ? 'bg-warn-bg text-warn-fg' : 'border border-border bg-surface text-ink'
                              }`}
                            >
                              {paid ? '✓ Paid' : late ? 'Overdue' : 'Mark paid'}
                            </button>
                          ) : (
                            <span className="text-sm text-muted">Paused</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
          {selectedBill && (
            <section className="card flex flex-col gap-4 p-6">
              <div className="flex items-center gap-3.5">
                <span
                  className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl text-xl font-bold"
                  style={{
                    background: `${categories.find((c) => c.id === selectedBill.categoryId)?.color ?? '#64748b'}22`,
                    color: categories.find((c) => c.id === selectedBill.categoryId)?.color ?? '#64748b',
                  }}
                >
                  {categories.find((c) => c.id === selectedBill.categoryId)?.icon ?? selectedBill.name[0]?.toUpperCase()}
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink">{selectedBill.name}</h2>
                  <span className="text-sm text-muted">{categories.find((c) => c.id === selectedBill.categoryId)?.name ?? 'Uncategorized'}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="font-display text-[32px] font-semibold tracking-tight text-ink">{formatMoney(selectedBill.amount, currency)}</span>
                <span className="text-sm text-muted">{selectedBill.frequency === 'yearly' ? 'a year' : 'a period'}</span>
              </div>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                <div>
                  <dt className="text-[13px] text-muted">How often</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {selectedBill.frequency === 'yearly' ? 'Annual' : selectedBill.paymentsPerYear ? `Monthly (${selectedBill.paymentsPerYear} of 12)` : FREQUENCY_LABELS[selectedBill.frequency]}
                  </dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Due</dt>
                  <dd className="mt-1 font-semibold text-ink">{formatDueDay(selectedBill.nextDue)} of the month</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Per month</dt>
                  <dd className="mt-1 font-semibold text-ink">{formatMoney(selectedBill.monthly, currency)}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Per year</dt>
                  <dd className="mt-1 font-semibold text-ink">{formatMoney(selectedBill.yearly, currency)}</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">Reminder</dt>
                  <dd className="mt-1 font-semibold text-ink">{selectedBill.reminderDaysBefore ?? 2} days before</dd>
                </div>
                <div>
                  <dt className="text-[13px] text-muted">This month</dt>
                  <dd className="mt-1 font-semibold text-ink">
                    {isPaid(selectedBill.id)
                      ? 'Paid'
                      : isOverdue(selectedBill)
                        ? 'Overdue'
                        : selectedBill.frequency === 'yearly'
                          ? 'Set aside'
                          : `Due in ${dueDayInMonth(selectedBill.anchorDate, year, month) - today.getUTCDate()} days`}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-col gap-2.5">
                <span className="text-[13px] text-muted">Last 6 months</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {history.map((h, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5">
                      <span
                        role="img"
                        aria-label={`${h.label}: ${h.state === 'not-due' ? 'nothing due' : h.state === 'paid' ? 'paid' : h.state === 'due' ? 'due this month' : 'not paid yet'}`}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-bold ${
                          h.state === 'not-due'
                            ? 'bg-surface-2 text-muted'
                            : h.state === 'paid' || h.state === 'due'
                              ? 'bg-accent text-ink'
                              : 'border-2 border-dashed border-border text-muted'
                        }`}
                      >
                        {h.state === 'not-due' ? '–' : h.state === 'paid' || h.state === 'due' ? '✓' : ''}
                      </span>
                      <span className="text-xs text-muted">{h.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[14px] bg-surface-2 p-3.5 text-sm text-muted-2">{selectedBill.notes || 'No notes.'}</div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => onTogglePaid(selectedBill.id, period)}
                  className={`min-h-11 rounded-[14px] px-4 text-sm font-semibold ${
                    isPaid(selectedBill.id) ? 'bg-ok-bg text-ok-fg' : 'bg-accent text-ink'
                  }`}
                >
                  {isPaid(selectedBill.id) ? '✓ Paid this month' : 'Mark as paid'}
                </button>
                <button
                  onClick={() => onOpenEditBill(selectedBill)}
                  className="min-h-11 rounded-[14px] border border-border bg-surface px-4 text-sm font-semibold text-ink"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Delete ${selectedBill.name}? This can't be undone.`)) onDeleteBill(selectedBill.id);
                  }}
                  className="ml-auto min-h-11 rounded-[14px] px-3 text-sm font-semibold text-alert"
                >
                  Delete
                </button>
              </div>
            </section>
          )}

          <section className="card flex flex-col gap-3.5 p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">By category</h2>
            {byCategory.length === 0 ? (
              <p className="text-sm text-muted">No categorized bills yet.</p>
            ) : (
              byCategory.map(({ category, count, value }) => (
                <div key={category.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {category.name} <span className="text-muted">· {count} bill{count === 1 ? '' : 's'}</span>
                    </span>
                    <span className="text-sm font-semibold text-ink">{formatMoney(value, currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(3, Math.round((value / Math.max(monthlyTotal, 0.0001)) * 100))}%`, background: category.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </section>

          <section className="card flex flex-col gap-3.5 p-6">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">By account</h2>
            {byAccount.length === 0 ? (
              <p className="text-sm text-muted">No bills linked to an account yet.</p>
            ) : (
              byAccount.map(({ account, count, value }) => (
                <div key={account.id || 'none'} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-ink">
                      {account.name} <span className="text-muted">· {count} bill{count === 1 ? '' : 's'}</span>
                    </span>
                    <span className="text-sm font-semibold text-ink">{formatMoney(value, currency)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-track">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max(3, Math.round((value / Math.max(monthlyTotal, 0.0001)) * 100))}%`, background: account.color }}
                    />
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
