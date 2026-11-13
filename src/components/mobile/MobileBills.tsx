import { useMemo, useState } from 'react';
import type { EnrichedBill } from '../../lib/derive';
import type { Account, Category } from '../../types';
import { formatMoney, ordinal } from '../../lib/format';
import { Ring } from '../Ring';

interface Props {
  bills: EnrichedBill[];
  categories: Category[];
  accounts: Account[];
  currency: string;
  monthlyIncome: number;
  payDay?: number;
  onEditBill: (bill: EnrichedBill) => void;
}

type View = 'month' | 'year';

const NO_ACCOUNT: Account = { id: '', name: 'No account set', color: '#64748b' };

function monthName(m: number): string {
  return new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' });
}

function pctLabel(n: number): string {
  if (!Number.isFinite(n)) return '0%';
  return (n < 10 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.round(n))) + '%';
}

export function MobileBills({ bills, categories, accounts, currency, monthlyIncome, payDay, onEditBill }: Props) {
  const [view, setView] = useState<View>('month');
  const isYear = view === 'year';
  const valueOf = (b: EnrichedBill) => (isYear ? b.yearly : b.monthly);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const total = useMemo(() => bills.reduce((s, b) => s + valueOf(b), 0), [bills, isYear]);
  const totalMonthly = useMemo(() => bills.reduce((s, b) => s + b.monthly, 0), [bills]);
  const totalYearly = useMemo(() => bills.reduce((s, b) => s + b.yearly, 0), [bills]);
  const income = isYear ? monthlyIncome * 12 : monthlyIncome;
  const incomeShare = income > 0 ? (total / income) * 100 : 0;
  const topLevelAccounts = useMemo(() => accounts.filter((a) => !a.parentAccountId), [accounts]);

  const catRows = useMemo(
    () =>
      categories
        .map((c) => {
          const list = bills.filter((b) => b.categoryId === c.id);
          const v = list.reduce((s, b) => s + valueOf(b), 0);
          return { category: c, list, v, share: total > 0 ? (v / total) * 100 : 0 };
        })
        .filter((r) => r.list.length > 0)
        .sort((a, b) => b.v - a.v),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bills, categories, total, isYear],
  );

  const donutBg = useMemo(() => {
    if (total <= 0 || catRows.length === 0) return 'var(--color-track)';
    let acc = 0;
    const stops: string[] = [];
    for (const r of catRows) {
      const start = acc;
      acc += r.share;
      stops.push(`${r.category.color} ${start.toFixed(2)}% ${(acc - 0.7).toFixed(2)}%, #fff ${(acc - 0.7).toFixed(2)}% ${acc.toFixed(2)}%`);
    }
    return `conic-gradient(${stops.join(', ')})`;
  }, [catRows, total]);

  const accRows = useMemo(() => {
    const summarize = (account: Account, list: EnrichedBill[]) => {
      const sorted = list.slice().sort((x, y) => x.nextDue.getTime() - y.nextDue.getTime());
      const v = sorted.reduce((s, b) => s + valueOf(b), 0);
      const regular = sorted.filter((b) => b.frequency !== 'yearly');
      const monthlyOut = regular.reduce((s, b) => s + b.monthly, 0);
      const byDay = new Map<number, number>();
      for (const b of regular) {
        const d = b.nextDue.getUTCDate();
        byDay.set(d, (byDay.get(d) ?? 0) + b.monthly);
      }
      let bigDay: number | null = null;
      let bigDayAmt = 0;
      for (const [d, amt] of byDay) {
        if (amt > bigDayAmt) {
          bigDay = d;
          bigDayAmt = amt;
        }
      }
      return { account, list: sorted, v, share: total > 0 ? (v / total) * 100 : 0, monthlyOut, bigDay, bigDayAmt, firstDue: regular[0] ?? null };
    };

    const rows = topLevelAccounts
      .map((a) => {
        const childIds = accounts.filter((x) => x.parentAccountId === a.id).map((x) => x.id);
        const list = bills.filter((b) => b.accountId === a.id || (!!b.accountId && childIds.includes(b.accountId)));
        return summarize(a, list);
      })
      .filter((r) => r.list.length > 0)
      .sort((a, b) => b.v - a.v);

    const noAccountList = bills.filter((b) => !b.accountId);
    if (noAccountList.length > 0) rows.push(summarize(NO_ACCOUNT, noAccountList));
    return rows;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, accounts, topLevelAccounts, total, isYear]);

  const rankedBills = useMemo(
    () =>
      bills
        .slice()
        .sort((a, b) => valueOf(b) - valueOf(a))
        .map((b) => ({
          bill: b,
          category: categories.find((c) => c.id === b.categoryId) ?? null,
          account: accounts.find((a) => a.id === b.accountId) ?? null,
          share: total > 0 ? (valueOf(b) / total) * 100 : 0,
        })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bills, categories, accounts, total, isYear],
  );

  const insights = useMemo(() => {
    const list: { icon: string; iconClass: string; title: string; body: string }[] = [];

    const realAccRows = accRows.filter((r) => r.account.id);
    const biggestAcc = realAccRows.slice().sort((a, b) => b.monthlyOut - a.monthlyOut)[0];
    if (payDay && biggestAcc && biggestAcc.firstDue && biggestAcc.monthlyOut > 0) {
      list.push({
        icon: '→',
        iconClass: 'bg-ink text-accent',
        title: `Move ${formatMoney(biggestAcc.monthlyOut, currency, 0)} to ${biggestAcc.account.name} on payday`,
        body: `You're paid on the ${ordinal(payDay)} and ${biggestAcc.firstDue.name.toLowerCase()} leaves ${biggestAcc.account.name} on the ${ordinal(biggestAcc.firstDue.nextDue.getUTCDate())}, so topping up on payday covers the whole month.`,
      });
    }

    if (bills.length >= 3 && totalMonthly > 0) {
      const top3 = bills.slice().sort((a, b) => b.monthly - a.monthly).slice(0, 3);
      const top3Sum = top3.reduce((s, b) => s + b.monthly, 0);
      list.push({
        icon: '3',
        iconClass: 'bg-surface-2 text-ink',
        title: `Three bills make up ${pctLabel((top3Sum / totalMonthly) * 100)} of the total`,
        body: `${top3.map((b) => b.name).join(', ')}. Everything else together is ${formatMoney(totalMonthly - top3Sum, currency, 0)} a month.`,
      });
    }

    const subsCategory = categories.find((c) => c.name.trim().toLowerCase() === 'subscriptions');
    if (subsCategory) {
      const subs = bills.filter((b) => b.categoryId === subsCategory.id);
      if (subs.length > 0) {
        const subsYearly = subs.reduce((s, b) => s + b.yearly, 0);
        const cardAccounts = accounts.filter((a) => /credit|card/i.test(a.name));
        const onCard = subs.filter((b) => b.accountId && cardAccounts.some((a) => a.id === b.accountId));
        const cardNote =
          onCard.length > 0
            ? ` ${onCard.map((b) => b.name).join(' and ')} ${onCard.length === 1 ? 'is' : 'are'} on the credit card — easy to miss.`
            : '';
        list.push({
          icon: '£',
          iconClass: 'bg-warn-bg text-warn-fg',
          title: `Subscriptions cost ${formatMoney(subsYearly, currency, 0)} a year`,
          body: `${monthlyIncome > 0 ? `That's ${pctLabel((subsYearly / 12 / monthlyIncome) * 100)} of your pay.` : ''}${cardNote}`,
        });
      }
    }

    for (const b of bills.filter((x) => x.frequency === 'yearly')) {
      const acc = accounts.find((a) => a.id === b.accountId);
      const accName = acc?.name ?? 'No account set';
      list.push({
        icon: accName[0]?.toUpperCase() ?? '?',
        iconClass: 'bg-violet-bg text-violet-fg',
        title: `${b.name}: ${formatMoney(b.amount, currency, 0)} from ${accName.split(' ')[0]} in ${monthName(b.nextDue.getUTCMonth() + 1)}`,
        body: `Setting aside ${formatMoney(b.amount / 12, currency, 0)} a month in ${accName.split(' ')[0]} means it's covered when it renews on the ${ordinal(b.nextDue.getUTCDate())}.`,
      });
    }

    const paused = bills.filter((b) => b.noPaymentMonths && b.noPaymentMonths.length > 0);
    if (paused.length > 0) {
      const b = paused[0];
      const months = b.noPaymentMonths!;
      const acc = accounts.find((a) => a.id === b.accountId);
      list.push({
        icon: '↓',
        iconClass: 'bg-ok-bg text-ok-fg',
        title: `${monthName(months[0])} is your cheapest month`,
        body: `No ${b.name.toLowerCase()} in ${months.map((m) => monthName(m)).join(' or ')}, so ${formatMoney(b.amount, currency, 0)} less leaves ${(acc?.name ?? 'your account').split(' ')[0]}.`,
      });
    }

    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bills, accRows, categories, accounts, payDay, monthlyIncome, totalMonthly, currency]);

  return (
    <main
      className="flex flex-col gap-4 px-4 pt-1"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-muted">
            {bills.length} bill{bills.length === 1 ? '' : 's'} · {topLevelAccounts.length} account{topLevelAccounts.length === 1 ? '' : 's'}
          </span>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink">Bills</h1>
        </div>
        <div className="flex gap-[3px] rounded-xl bg-chip-border p-[3px]" role="group" aria-label="Show amounts per">
          <button onClick={() => setView('month')} aria-pressed={view === 'month'} className={`min-h-9 rounded-[9px] px-3 text-[13px] ${view === 'month' ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(14,17,22,.12)]' : 'font-medium text-muted-2'}`}>Month</button>
          <button onClick={() => setView('year')} aria-pressed={view === 'year'} className={`min-h-9 rounded-[9px] px-3 text-[13px] ${view === 'year' ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(14,17,22,.12)]' : 'font-medium text-muted-2'}`}>Year</button>
        </div>
      </div>

      <section className="flex flex-col gap-4 rounded-[28px] bg-ink p-[22px] text-white">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <h2 className="text-sm font-medium text-muted-on-ink">Your bills cost per {isYear ? 'year' : 'month'}</h2>
            <div className="font-display text-[42px] font-semibold leading-none tracking-tight">
              {formatMoney(total, currency).split('.')[0]}
              <span className="text-[22px] font-medium text-muted-on-ink">.{formatMoney(total, currency).split('.')[1]}</span>
            </div>
          </div>
          <Ring
            size={88}
            innerSize={68}
            innerClassName="bg-ink"
            background={`conic-gradient(var(--color-accent) 0 ${Math.min(100, Math.max(0, incomeShare))}%, var(--color-ink-line) ${Math.min(100, Math.max(0, incomeShare))}% 100%)`}
            label={`Bills take ${pctLabel(incomeShare)} of your income`}
          >
            <span className="font-display text-xl font-semibold">{pctLabel(incomeShare)}</span>
            <span className="text-[10px] text-muted-on-ink">of income</span>
          </Ring>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1 rounded-[14px] bg-ink-2 px-3 py-2.5">
            <span className="text-xs text-muted-on-ink">Per day</span>
            <span className="text-sm font-semibold">{formatMoney(totalYearly / 365, currency)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-ink-2 px-3 py-2.5">
            <span className="text-xs text-muted-on-ink">{isYear ? 'Per month' : 'Per year'}</span>
            <span className="text-sm font-semibold">{formatMoney(isYear ? totalMonthly : totalYearly, currency, 0)}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-[14px] bg-ink-2 px-3 py-2.5">
            <span className="text-xs text-muted-on-ink">Left of pay</span>
            <span className="text-sm font-semibold">{formatMoney(income - total, currency, 0)}</span>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-[18px]">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold text-ink">Where it goes</h2>
          <span className="text-[13px] text-muted">Share of your bills, and of your take-home pay</span>
        </div>
        {catRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No categorized bills yet.</p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Ring size={128} innerSize={88} background={donutBg} label={catRows.map((r) => `${r.category.name} ${pctLabel(r.share)}`).join(', ')}>
                <span className="font-display text-base font-semibold text-ink">{formatMoney(total, currency, 0)}</span>
                <span className="text-[11px] text-muted">{isYear ? 'a year' : 'a month'}</span>
              </Ring>
              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                {catRows.map((r) => (
                  <div key={r.category.id} className="flex items-baseline gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: r.category.color }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.category.name}</span>
                    <span className="font-display text-[17px] font-semibold text-ink">{pctLabel(r.share)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex flex-col">
              {catRows.map((r) => (
                <div key={r.category.id} className="flex items-center gap-3 border-t border-line py-2.5 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ink">{r.category.name}</span>
                    <span className="block truncate text-[13px] text-muted">{r.list.map((b) => b.name).join(', ')}</span>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="block text-sm font-semibold text-ink">{formatMoney(r.v, currency)}</span>
                    <span className="block text-xs text-muted">{pctLabel(income > 0 ? (r.v / income) * 100 : 0)} of income</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-0.5 px-1">
          <h2 className="font-display text-lg font-semibold text-ink">From each account</h2>
          <span className="text-[13px] text-muted">Which account your bills come out of</span>
        </div>
        {accRows.length === 0 ? (
          <p className="card p-[18px] py-6 text-center text-sm text-muted">No bills linked to an account yet.</p>
        ) : (
          <>
            <div className="flex flex-col gap-2.5 rounded-[20px] bg-surface px-4 py-3.5">
              <div className="flex h-3.5 gap-[3px]" role="img" aria-label={accRows.map((r) => `${r.account.name} ${pctLabel(r.share)}`).join(', ')}>
                {accRows.map((r) => (
                  <span key={r.account.id || 'none'} className="h-full rounded" style={{ flex: `${Math.max(r.v, 0.0001)} 1 0`, background: r.account.color }} />
                ))}
              </div>
              <div className="flex flex-wrap gap-x-3.5 gap-y-1.5">
                {accRows.map((r) => (
                  <span key={r.account.id || 'none'} className="flex items-center gap-1.5 text-[13px] text-muted-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: r.account.color }} />
                    {r.account.name} <strong className="font-semibold text-ink">{pctLabel(r.share)}</strong>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {accRows.map((r) => (
                <article key={r.account.id || 'none'} className="card flex flex-col gap-3.5 p-[18px]">
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-base font-bold" style={{ background: `${r.account.color}22`, color: r.account.color }}>
                      {r.account.name[0]?.toUpperCase() ?? '?'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-[16px] font-semibold text-ink">{r.account.name}</h3>
                      <span className="block truncate text-[13px] text-muted">
                        {r.list.length} bill{r.list.length === 1 ? '' : 's'} · {formatMoney(r.monthlyOut, currency, 0)} leaves monthly
                      </span>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="block font-display text-[18px] font-semibold text-ink">
                        {formatMoney(r.v, currency, 0)}{isYear ? '/yr' : '/mo'}
                      </span>
                      <span className="block text-xs text-muted">{pctLabel(r.share)} of bills</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {r.list.map((b) => (
                      <button key={b.id} onClick={() => onEditBill(b)} className="rounded-full bg-surface-2 px-2.5 py-1 text-[13px] font-medium text-ink">
                        {b.name} · {ordinal(b.nextDue.getUTCDate())}{b.frequency === 'yearly' ? ` ${monthName(b.nextDue.getUTCMonth() + 1).slice(0, 3)}` : ''}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="flex flex-col gap-0.5 rounded-[14px] bg-surface-3 px-3 py-2.5">
                      <span className="text-xs text-muted">Biggest day</span>
                      <span className="text-sm font-semibold text-ink">{r.bigDay != null ? `${ordinal(r.bigDay)} · ${formatMoney(r.bigDayAmt, currency)}` : '—'}</span>
                    </div>
                    <div className="flex flex-col gap-0.5 rounded-[14px] bg-surface-3 px-3 py-2.5">
                      <span className="text-xs text-muted">Have in by</span>
                      <span className="text-sm font-semibold text-ink">{r.firstDue ? `${formatMoney(r.monthlyOut, currency, 0)} by ${ordinal(r.firstDue.nextDue.getUTCDate())}` : '—'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="flex flex-col gap-2.5">
        <h2 className="px-1 font-display text-lg font-semibold text-ink">Insights</h2>
        <div className="flex flex-col gap-2.5">
          {insights.length === 0 ? (
            <p className="card p-[18px] py-6 text-center text-sm text-muted">Add a few more bills to see insights here.</p>
          ) : (
            insights.map((ins, i) => (
              <div key={i} className="flex items-start gap-3 rounded-[20px] bg-surface px-4 py-3.5">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold ${ins.iconClass}`}>{ins.icon}</span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-ink">{ins.title}</span>
                  <p className="text-sm leading-snug text-muted">{ins.body}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="card flex flex-col gap-1 p-[18px]">
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-ink">Every bill, by share</h2>
          <span className="text-[13px] text-muted">{isYear ? 'Per year' : 'Per month'}</span>
        </div>
        {rankedBills.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No bills yet.</p>
        ) : (
          rankedBills.map(({ bill, category, account, share }) => (
            <button key={bill.id} onClick={() => onEditBill(bill)} className="flex flex-col gap-1.5 border-t border-line py-2.5 text-left first:border-t-0">
              <div className="flex items-center gap-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{bill.name}</span>
                  <span className="block truncate text-xs text-muted">{category?.name ?? 'Uncategorized'} · {account?.name ?? 'No account set'}</span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(valueOf(bill), currency)}</span>
                <span className="min-w-[40px] shrink-0 text-right font-display text-sm font-semibold text-muted-2">{pctLabel(share)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-track">
                <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, share)}%`, background: category?.color ?? '#64748b' }} />
              </div>
            </button>
          ))
        )}
      </section>
    </main>
  );
}
