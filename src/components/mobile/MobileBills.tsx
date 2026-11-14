import { useMemo, useState } from 'react';
import type { EnrichedBill } from '../../lib/derive';
import type { Account, Category } from '../../types';
import { formatMoney, ordinal } from '../../lib/format';
import { Ring } from '../Ring';
import { MobileDetailSheet } from './MobileDetailSheet';
import { AccountDetail, BillShareRows, CategoryDetail, InsightsDetail } from './MobileBillsDetails';
import { billValue, buildAccountRows, monthName, pctLabel } from './billsInfo';
import type { AccountSummary, Insight, RankedBill } from './billsInfo';

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

type Detail = { kind: 'categories' } | { kind: 'account'; id: string } | { kind: 'insights' } | { kind: 'bills' } | null;

const LEGEND_MAX = 4;
const INSIGHTS_PREVIEW = 2;
const BILLS_PREVIEW = 5;

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function DetailsButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-haspopup="dialog"
      className="flex min-h-9 shrink-0 items-center gap-0.5 rounded-full bg-surface-2 pl-3 pr-2 text-[13px] font-semibold text-ink"
    >
      {label}
      <Chevron />
    </button>
  );
}

export function MobileBills({ bills, categories, accounts, currency, monthlyIncome, payDay, onEditBill }: Props) {
  const [view, setView] = useState<View>('month');
  const [detail, setDetail] = useState<Detail>(null);
  const isYear = view === 'year';
  const perLabel = isYear ? 'Per year' : 'Per month';

  const total = useMemo(() => bills.reduce((s, b) => s + billValue(b, isYear), 0), [bills, isYear]);
  const totalMonthly = useMemo(() => bills.reduce((s, b) => s + b.monthly, 0), [bills]);
  const totalYearly = useMemo(() => bills.reduce((s, b) => s + b.yearly, 0), [bills]);
  const income = isYear ? monthlyIncome * 12 : monthlyIncome;
  const incomeShare = income > 0 ? (total / income) * 100 : 0;
  const topLevelCount = accounts.filter((a) => !a.parentAccountId).length;
  const potCount = accounts.length - topLevelCount;

  const catRows = useMemo(
    () =>
      categories
        .map((c) => {
          const list = bills.filter((b) => b.categoryId === c.id);
          const v = list.reduce((s, b) => s + billValue(b, isYear), 0);
          return { category: c, list, v, share: total > 0 ? (v / total) * 100 : 0 };
        })
        .filter((r) => r.list.length > 0)
        .sort((a, b) => b.v - a.v),
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

  const accRows = useMemo(() => buildAccountRows(bills, accounts, isYear, total), [bills, accounts, isYear, total]);

  const rankedBills: RankedBill[] = useMemo(
    () =>
      bills
        .slice()
        .sort((a, b) => billValue(b, isYear) - billValue(a, isYear))
        .map((b) => ({
          bill: b,
          category: categories.find((c) => c.id === b.categoryId) ?? null,
          account: accounts.find((a) => a.id === b.accountId) ?? null,
          share: total > 0 ? (billValue(b, isYear) / total) * 100 : 0,
        })),
    [bills, categories, accounts, total, isYear],
  );

  const insights = useMemo(() => {
    const list: Insight[] = [];

    // Money has to be in the pot a bill is paid from, so compare pots (and pot-less accounts), not rolled-up parents.
    const payFrom: AccountSummary[] = accRows.filter((r) => r.account.id).flatMap((r) => (r.children.length > 0 ? [...r.children, ...(r.own ? [r.own] : [])] : [r]));
    const biggestAcc = payFrom.slice().sort((a, b) => b.monthlyOut - a.monthlyOut)[0];
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
  }, [bills, accRows, categories, accounts, payDay, monthlyIncome, totalMonthly, currency]);

  const editFromDetail = (bill: EnrichedBill) => {
    setDetail(null);
    onEditBill(bill);
  };

  const openAccount = (() => {
    if (detail?.kind !== 'account') return null;
    for (const r of accRows) {
      if (r.account.id === detail.id) return { summary: r as AccountSummary, row: r, parent: null };
      const child = r.children.find((c) => c.account.id === detail.id);
      if (child) return { summary: child, row: null, parent: r };
    }
    return null;
  })();

  return (
    <main
      className="flex flex-col gap-4 px-4 pt-1"
      style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}
    >
      <div className="flex items-end justify-between gap-3 px-1">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-sm font-medium text-muted">
            {bills.length} bill{bills.length === 1 ? '' : 's'} · {topLevelCount} account{topLevelCount === 1 ? '' : 's'}
            {potCount > 0 ? ` · ${potCount} pot${potCount === 1 ? '' : 's'}` : ''}
          </span>
          <h1 className="font-display text-[34px] font-semibold tracking-tight text-ink">Bills</h1>
        </div>
        <div className="flex shrink-0 gap-[3px] rounded-xl bg-chip-border p-[3px]" role="group" aria-label="Show amounts per">
          <button
            onClick={() => setView('month')}
            aria-pressed={view === 'month'}
            className={`min-h-9 rounded-[9px] px-3 text-[13px] ${view === 'month' ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(14,17,22,.12)]' : 'font-medium text-muted-2'}`}
          >
            Month
          </button>
          <button
            onClick={() => setView('year')}
            aria-pressed={view === 'year'}
            className={`min-h-9 rounded-[9px] px-3 text-[13px] ${view === 'year' ? 'bg-surface font-semibold text-ink shadow-[0_1px_3px_rgba(14,17,22,.12)]' : 'font-medium text-muted-2'}`}
          >
            Year
          </button>
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
            <span className="text-sm font-semibold">
              {income - total < 0 ? '−' : ''}
              {formatMoney(income - total, currency, 0)}
            </span>
          </div>
        </div>
      </section>

      <section className="card flex flex-col gap-4 p-[18px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Where it goes</h2>
          {catRows.length > 0 && <DetailsButton label="Breakdown" onClick={() => setDetail({ kind: 'categories' })} />}
        </div>
        {catRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No categorized bills yet.</p>
        ) : (
          <div className="flex items-center gap-4">
            <Ring size={128} innerSize={88} background={donutBg} label={catRows.map((r) => `${r.category.name} ${pctLabel(r.share)}`).join(', ')}>
              <span className="font-display text-base font-semibold text-ink">{formatMoney(total, currency, 0)}</span>
              <span className="text-[11px] text-muted">{isYear ? 'a year' : 'a month'}</span>
            </Ring>
            <div className="flex min-w-0 flex-1 flex-col gap-2.5">
              {catRows.slice(0, LEGEND_MAX).map((r) => (
                <div key={r.category.id} className="flex items-baseline gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: r.category.color }} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{r.category.name}</span>
                  <span className="font-display text-[17px] font-semibold text-ink">{pctLabel(r.share)}</span>
                </div>
              ))}
              {catRows.length > LEGEND_MAX && <span className="text-[13px] text-muted">+ {catRows.length - LEGEND_MAX} more</span>}
            </div>
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-3.5 p-[18px]">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-display text-lg font-semibold text-ink">From each account</h2>
          {accRows.length > 0 && <span className="text-[13px] text-muted">Tap an account or pot for its bills and dates</span>}
        </div>
        {accRows.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">No bills linked to an account yet.</p>
        ) : (
          <>
            <div className="flex h-3.5 gap-[3px]" role="img" aria-label={accRows.map((r) => `${r.account.name} ${pctLabel(r.share)}`).join(', ')}>
              {accRows.map((r) => (
                <span key={r.account.id || 'none'} className="h-full rounded" style={{ flex: `${Math.max(r.v, 0.0001)} 1 0`, background: r.account.color }} />
              ))}
            </div>
            <div className="flex flex-col">
              {accRows.map((r) => (
                <div key={r.account.id || 'none'} className="flex flex-col border-t border-line py-1 first:border-t-0">
                  <button
                    onClick={() => setDetail({ kind: 'account', id: r.account.id })}
                    aria-haspopup="dialog"
                    className="flex min-h-[56px] items-center gap-3 text-left"
                  >
                    <span
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] text-[15px] font-bold"
                      style={{ background: `${r.account.color}22`, color: r.account.color }}
                    >
                      {r.account.name[0]?.toUpperCase() ?? '?'}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-ink">{r.account.name}</span>
                      <span className="block truncate text-[13px] text-muted">
                        {r.list.length} bill{r.list.length === 1 ? '' : 's'} · {pctLabel(r.share)} of bills
                      </span>
                    </span>
                    <span className="shrink-0 font-display text-[17px] font-semibold text-ink">{formatMoney(r.v, currency, 0)}</span>
                    <Chevron />
                  </button>
                  {r.children.length > 0 && (
                    <div className="mb-1 ml-[19px] flex flex-col border-l-2 border-line pl-[19px]">
                      {r.children.map((c) => (
                        <button
                          key={c.account.id}
                          onClick={() => setDetail({ kind: 'account', id: c.account.id })}
                          aria-haspopup="dialog"
                          className="flex min-h-11 items-center gap-2.5 text-left"
                        >
                          <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: c.account.color }} />
                          <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink">{c.account.name}</span>
                          <span className="shrink-0 text-[13px] text-muted">
                            {c.list.length} bill{c.list.length === 1 ? '' : 's'}
                          </span>
                          <span className="min-w-[52px] shrink-0 text-right text-sm font-semibold text-ink">{formatMoney(c.v, currency, 0)}</span>
                          <Chevron />
                        </button>
                      ))}
                      {r.own && (
                        <div className="flex min-h-11 items-center gap-2.5 pr-[26px]">
                          <span className="h-2.5 w-2.5 shrink-0 rounded bg-track" />
                          <span className="min-w-0 flex-1 truncate text-sm text-muted-2">Not in a pot</span>
                          <span className="shrink-0 text-[13px] text-muted">
                            {r.own.list.length} bill{r.own.list.length === 1 ? '' : 's'}
                          </span>
                          <span className="min-w-[52px] shrink-0 text-right text-sm font-semibold text-ink">{formatMoney(r.own.v, currency, 0)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="card flex flex-col gap-2 p-[18px]">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold text-ink">Insights</h2>
          {insights.length > 0 && (
            <DetailsButton label={insights.length > INSIGHTS_PREVIEW ? `All ${insights.length}` : 'Read'} onClick={() => setDetail({ kind: 'insights' })} />
          )}
        </div>
        {insights.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">Add a few more bills to see insights here.</p>
        ) : (
          <div className="flex flex-col">
            {insights.slice(0, INSIGHTS_PREVIEW).map((ins, i) => (
              <button
                key={i}
                onClick={() => setDetail({ kind: 'insights' })}
                aria-haspopup="dialog"
                className="flex min-h-[52px] items-center gap-3 border-t border-line py-2 text-left first:border-t-0"
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold ${ins.iconClass}`}>{ins.icon}</span>
                <span className="line-clamp-2 min-w-0 flex-1 text-sm font-semibold leading-snug text-ink">{ins.title}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card flex flex-col gap-1 p-[18px]">
        <div className="mb-1 flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <h2 className="font-display text-lg font-semibold text-ink">Biggest bills</h2>
            <span className="text-[13px] text-muted">{perLabel}, by share of the total</span>
          </div>
          {rankedBills.length > BILLS_PREVIEW && <DetailsButton label={`All ${rankedBills.length}`} onClick={() => setDetail({ kind: 'bills' })} />}
        </div>
        {rankedBills.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No bills yet.</p>
        ) : (
          <BillShareRows ranked={rankedBills.slice(0, BILLS_PREVIEW)} currency={currency} isYear={isYear} onEditBill={onEditBill} />
        )}
      </section>

      {detail?.kind === 'categories' && (
        <MobileDetailSheet title="Where it goes" subtitle={`${perLabel} · ${formatMoney(total, currency, 0)}`} onClose={() => setDetail(null)}>
          <CategoryDetail rows={catRows} income={income} currency={currency} isYear={isYear} onEditBill={editFromDetail} />
        </MobileDetailSheet>
      )}

      {openAccount && (
        <MobileDetailSheet
          title={openAccount.summary.account.name}
          subtitle={openAccount.parent ? `Pot in ${openAccount.parent.account.name}` : perLabel}
          backLabel={openAccount.parent?.account.name}
          onBack={openAccount.parent ? () => setDetail({ kind: 'account', id: openAccount.parent.account.id }) : undefined}
          onClose={() => setDetail(null)}
          contentKey={openAccount.summary.account.id}
        >
          <AccountDetail
            summary={openAccount.summary}
            row={openAccount.row}
            accounts={accounts}
            currency={currency}
            isYear={isYear}
            onOpenAccount={(id) => setDetail({ kind: 'account', id })}
            onEditBill={editFromDetail}
          />
        </MobileDetailSheet>
      )}

      {detail?.kind === 'insights' && (
        <MobileDetailSheet title="Insights" subtitle="Worked out from your bills" onClose={() => setDetail(null)}>
          <InsightsDetail insights={insights} />
        </MobileDetailSheet>
      )}

      {detail?.kind === 'bills' && (
        <MobileDetailSheet title="Every bill, by share" subtitle={`${perLabel} · ${rankedBills.length} bills`} onClose={() => setDetail(null)}>
          <div className="rounded-[20px] bg-surface px-4 py-1.5">
            <BillShareRows ranked={rankedBills} currency={currency} isYear={isYear} onEditBill={editFromDetail} />
          </div>
        </MobileDetailSheet>
      )}
    </main>
  );
}
