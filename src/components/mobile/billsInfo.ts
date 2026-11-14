import type { EnrichedBill } from '../../lib/derive';
import { ordinal } from '../../lib/format';
import type { Account, Category } from '../../types';

export const NO_ACCOUNT: Account = { id: '', name: 'No account set', color: '#64748b' };

export interface CategoryRow {
  category: Category;
  list: EnrichedBill[];
  v: number;
  share: number;
}

export interface AccountSummary {
  account: Account;
  /** Regular bills by day of the month, then yearly ones by date. */
  list: EnrichedBill[];
  v: number;
  share: number;
  monthlyOut: number;
  bigDay: number | null;
  bigDayAmt: number;
  firstDue: EnrichedBill | null;
}

export interface AccountRow extends AccountSummary {
  /** Bills paid straight from the parent, only set when it also has pots with bills. */
  own: AccountSummary | null;
  children: AccountSummary[];
}

export interface RankedBill {
  bill: EnrichedBill;
  category: Category | null;
  account: Account | null;
  share: number;
}

export interface Insight {
  icon: string;
  iconClass: string;
  title: string;
  body: string;
}

export function billValue(bill: EnrichedBill, isYear: boolean): number {
  return isYear ? bill.yearly : bill.monthly;
}

export function monthName(m: number): string {
  return new Date(Date.UTC(2000, m - 1, 1)).toLocaleDateString(undefined, { month: 'long', timeZone: 'UTC' });
}

export function pctLabel(n: number): string {
  if (!Number.isFinite(n)) return '0%';
  return (n < 10 ? n.toFixed(1).replace(/\.0$/, '') : String(Math.round(n))) + '%';
}

export function dueLabel(bill: EnrichedBill): string {
  const day = ordinal(bill.nextDue.getUTCDate());
  return bill.frequency === 'yearly' ? `${day} ${monthName(bill.nextDue.getUTCMonth() + 1).slice(0, 3)}` : day;
}

export function summarizeAccount(account: Account, bills: EnrichedBill[], isYear: boolean, total: number): AccountSummary {
  const regular = bills
    .filter((b) => b.frequency !== 'yearly')
    .sort((x, y) => x.nextDue.getUTCDate() - y.nextDue.getUTCDate());
  const yearly = bills.filter((b) => b.frequency === 'yearly').sort((x, y) => x.nextDue.getTime() - y.nextDue.getTime());
  const v = bills.reduce((s, b) => s + billValue(b, isYear), 0);

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

  return {
    account,
    list: [...regular, ...yearly],
    v,
    share: total > 0 ? (v / total) * 100 : 0,
    monthlyOut: regular.reduce((s, b) => s + b.monthly, 0),
    bigDay,
    bigDayAmt,
    firstDue: regular[0] ?? null,
  };
}

/** One row per top-level account with its pots rolled in, biggest first, then a "No account set" row if needed. */
export function buildAccountRows(bills: EnrichedBill[], accounts: Account[], isYear: boolean, total: number): AccountRow[] {
  const rows: AccountRow[] = accounts
    .filter((a) => !a.parentAccountId)
    .map((parent) => {
      const ownList = bills.filter((b) => b.accountId === parent.id);
      const children = accounts
        .filter((a) => a.parentAccountId === parent.id)
        .map((child) =>
          summarizeAccount(
            child,
            bills.filter((b) => b.accountId === child.id),
            isYear,
            total,
          ),
        )
        .filter((c) => c.list.length > 0)
        .sort((a, b) => b.v - a.v);
      const all = [...ownList, ...children.flatMap((c) => c.list)];
      return {
        ...summarizeAccount(parent, all, isYear, total),
        own: children.length > 0 && ownList.length > 0 ? summarizeAccount(parent, ownList, isYear, total) : null,
        children,
      };
    })
    .filter((r) => r.list.length > 0)
    .sort((a, b) => b.v - a.v);

  const noAccount = bills.filter((b) => !b.accountId);
  if (noAccount.length > 0) rows.push({ ...summarizeAccount(NO_ACCOUNT, noAccount, isYear, total), own: null, children: [] });
  return rows;
}
