import type { EnrichedBill } from '../../lib/derive';
import { formatMoney, ordinal } from '../../lib/format';
import type { Account } from '../../types';
import { billValue, dueLabel, pctLabel } from './billsInfo';
import type { AccountRow, AccountSummary, CategoryRow, Insight, RankedBill } from './billsInfo';

function Chevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-muted">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

interface CategoryDetailProps {
  rows: CategoryRow[];
  income: number;
  currency: string;
  isYear: boolean;
  onEditBill: (bill: EnrichedBill) => void;
}

export function CategoryDetail({ rows, income, currency, isYear, onEditBill }: CategoryDetailProps) {
  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((r) => (
        <section key={r.category.id} className="flex flex-col gap-2.5 rounded-[20px] bg-surface p-4">
          <div className="flex items-center gap-2.5">
            <span className="h-3 w-3 shrink-0 rounded" style={{ background: r.category.color }} />
            <h3 className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">{r.category.name}</h3>
            <span className="shrink-0 text-[15px] font-semibold text-ink">{formatMoney(r.v, currency)}</span>
            <span className="min-w-[44px] shrink-0 text-right font-display text-[17px] font-semibold text-ink">{pctLabel(r.share)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-track" role="img" aria-label={`${r.category.name} is ${pctLabel(r.share)} of your bills`}>
            <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, r.share)}%`, background: r.category.color }} />
          </div>
          <span className="text-[13px] text-muted">
            {r.list.length} bill{r.list.length === 1 ? '' : 's'}
            {income > 0 ? ` · ${pctLabel((r.v / income) * 100)} of income` : ''}
          </span>
          <div className="flex flex-col">
            {r.list
              .slice()
              .sort((a, b) => billValue(b, isYear) - billValue(a, isYear))
              .map((b) => (
                <button key={b.id} onClick={() => onEditBill(b)} className="flex min-h-11 items-center gap-2 border-t border-line text-left">
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">{b.name}</span>
                  <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(billValue(b, isYear), currency)}</span>
                </button>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}

interface AccountDetailProps {
  summary: AccountSummary;
  /** Set when `summary` is a top-level account, so its pots can be listed. */
  row: AccountRow | null;
  accounts: Account[];
  currency: string;
  isYear: boolean;
  onOpenAccount: (id: string) => void;
  /** Opens the bills paid straight from this account, leaving out its pots. */
  onOpenOwn: (id: string) => void;
  onEditBill: (bill: EnrichedBill) => void;
}

export function AccountDetail({ summary, row, accounts, currency, isYear, onOpenAccount, onOpenOwn, onEditBill }: AccountDetailProps) {
  const pots = row?.children ?? [];
  const potName = (bill: EnrichedBill) =>
    pots.length > 0 && bill.accountId !== summary.account.id ? (accounts.find((a) => a.id === bill.accountId)?.name ?? null) : null;

  return (
    <div className="flex flex-col gap-2.5">
      <section className="flex items-center gap-3 rounded-[20px] bg-surface p-4">
        <span
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-base font-bold"
          style={{ background: `${summary.account.color}22`, color: summary.account.color }}
        >
          {summary.account.name[0]?.toUpperCase() ?? '?'}
        </span>
        <div className="min-w-0 flex-1">
          <span className="block font-display text-[26px] font-semibold leading-tight tracking-tight text-ink">
            {formatMoney(summary.v, currency)}
            <span className="text-sm font-medium text-muted">{isYear ? ' a year' : ' a month'}</span>
          </span>
          <span className="block truncate text-[13px] text-muted">
            {summary.list.length} bill{summary.list.length === 1 ? '' : 's'} · {pctLabel(summary.share)} of your bills
          </span>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-0.5 rounded-[16px] bg-surface px-3.5 py-3">
          <span className="text-xs text-muted">Biggest day</span>
          <span className="text-sm font-semibold text-ink">
            {summary.bigDay != null ? `${ordinal(summary.bigDay)} · ${formatMoney(summary.bigDayAmt, currency)}` : '—'}
          </span>
        </div>
        <div className="flex flex-col gap-0.5 rounded-[16px] bg-surface px-3.5 py-3">
          <span className="text-xs text-muted">Have in by</span>
          <span className="text-sm font-semibold text-ink">
            {summary.firstDue ? `${formatMoney(summary.monthlyOut, currency, 0)} by ${ordinal(summary.firstDue.nextDue.getUTCDate())}` : '—'}
          </span>
        </div>
      </div>

      {row && pots.length > 0 && (
        <section className="flex flex-col rounded-[20px] bg-surface px-4 py-3">
          <h3 className="pb-1 text-[13px] font-semibold uppercase tracking-[.5px] text-muted">Pots in this account</h3>
          {pots.map((p) => (
            <button
              key={p.account.id}
              onClick={() => onOpenAccount(p.account.id)}
              className="flex min-h-[52px] flex-col justify-center gap-1.5 border-t border-line py-2 text-left first:border-t-0"
            >
              <span className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: p.account.color }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{p.account.name}</span>
                  <span className="block truncate text-xs text-muted">
                    {p.list.length} bill{p.list.length === 1 ? '' : 's'}
                    {p.firstDue ? ` · ${formatMoney(p.monthlyOut, currency, 0)} in by the ${ordinal(p.firstDue.nextDue.getUTCDate())}` : ''}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(p.v, currency)}</span>
                <Chevron />
              </span>
              <span className="block h-1.5 overflow-hidden rounded-full bg-track">
                <span className="block h-full rounded-full" style={{ width: `${Math.max(1.5, summary.v > 0 ? (p.v / summary.v) * 100 : 0)}%`, background: p.account.color }} />
              </span>
            </button>
          ))}
          {row.own && (
            <button onClick={() => onOpenOwn(row.account.id)} className="flex min-h-[52px] items-center gap-2.5 border-t border-line py-2 text-left">
              <span className="h-2.5 w-2.5 shrink-0 rounded bg-track" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-ink">Not in a pot</span>
                <span className="block truncate text-xs text-muted">
                  {row.own.list.length} bill{row.own.list.length === 1 ? '' : 's'}
                  {row.own.firstDue ? ` · ${formatMoney(row.own.monthlyOut, currency, 0)} in by the ${ordinal(row.own.firstDue.nextDue.getUTCDate())}` : ''}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(row.own.v, currency)}</span>
              <Chevron />
            </button>
          )}
        </section>
      )}

      <section className="flex flex-col rounded-[20px] bg-surface px-4 py-3">
        <h3 className="pb-1 text-[13px] font-semibold uppercase tracking-[.5px] text-muted">Bills, in the order they leave</h3>
        {summary.list.map((b) => (
          <button key={b.id} onClick={() => onEditBill(b)} className="flex min-h-[52px] items-center gap-3 border-t border-line py-2 text-left first:border-t-0">
            <span className="flex h-9 min-w-[52px] shrink-0 items-center justify-center rounded-[11px] bg-surface-2 px-2 text-xs font-semibold text-ink">{dueLabel(b)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{b.name}</span>
              {(potName(b) || b.frequency === 'yearly') && (
                <span className="block truncate text-xs text-muted">{[potName(b), b.frequency === 'yearly' ? 'Yearly' : null].filter(Boolean).join(' · ')}</span>
              )}
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(billValue(b, isYear), currency)}</span>
          </button>
        ))}
      </section>
    </div>
  );
}

export function InsightsDetail({ insights }: { insights: Insight[] }) {
  return (
    <div className="flex flex-col gap-2.5">
      {insights.map((ins, i) => (
        <div key={i} className="flex items-start gap-3 rounded-[20px] bg-surface px-4 py-3.5">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] text-sm font-bold ${ins.iconClass}`}>{ins.icon}</span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-ink">{ins.title}</span>
            <p className="text-sm leading-snug text-muted">{ins.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

interface BillShareRowsProps {
  ranked: RankedBill[];
  currency: string;
  isYear: boolean;
  onEditBill: (bill: EnrichedBill) => void;
}

export function BillShareRows({ ranked, currency, isYear, onEditBill }: BillShareRowsProps) {
  return (
    <div className="flex flex-col">
      {ranked.map(({ bill, category, account, share }) => (
        <button key={bill.id} onClick={() => onEditBill(bill)} className="flex flex-col gap-1.5 border-t border-line py-2.5 text-left first:border-t-0">
          <div className="flex items-center gap-2.5">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ink">{bill.name}</span>
              <span className="block truncate text-xs text-muted">
                {category?.name ?? 'Uncategorized'} · {account?.name ?? 'No account set'}
              </span>
            </span>
            <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(billValue(bill, isYear), currency)}</span>
            <span className="min-w-[40px] shrink-0 text-right font-display text-sm font-semibold text-muted-2">{pctLabel(share)}</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-track">
            <div className="h-full rounded-full" style={{ width: `${Math.max(1.5, share)}%`, background: category?.color ?? '#64748b' }} />
          </div>
        </button>
      ))}
    </div>
  );
}
