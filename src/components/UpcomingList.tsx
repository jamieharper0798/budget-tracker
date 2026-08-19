import type { Account, Category } from '../types';
import type { EnrichedBill } from '../lib/derive';
import { formatDate, formatDueLabel, formatMoney } from '../lib/format';

interface Props {
  bills: EnrichedBill[];
  accounts: Account[];
  categories: Category[];
  currency: string;
}

export function UpcomingList({ bills, accounts, categories, currency }: Props) {
  const upcoming = bills
    .filter((b) => b.active && b.daysUntilDue <= 30)
    .sort((a, b) => a.daysUntilDue - b.daysUntilDue)
    .slice(0, 8);

  if (upcoming.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center text-sm text-white/40">
        Nothing due in the next 30 days.
      </div>
    );
  }

  return (
    <div className="glass divide-y divide-white/5 rounded-2xl">
      {upcoming.map((bill) => {
        const account = accounts.find((a) => a.id === bill.accountId);
        const category = categories.find((c) => c.id === bill.categoryId);
        const overdue = bill.daysUntilDue < 0;
        const dueSoon = bill.daysUntilDue >= 0 && bill.daysUntilDue <= 3;
        return (
          <div key={bill.id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base"
                style={{ backgroundColor: `${category?.color ?? '#64748b'}22` }}
              >
                {category?.icon ?? '🗂️'}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                <p className="truncate text-xs text-white/40">
                  {formatDate(bill.nextDue)}
                  {account && (
                    <>
                      {' · '}
                      <span style={{ color: account.color }}>{account.name}</span>
                    </>
                  )}
                </p>
              </div>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-white">{formatMoney(bill.amount, currency)}</p>
              <p
                className={`text-[11px] font-medium ${
                  overdue ? 'text-rose-400' : dueSoon ? 'text-amber-400' : 'text-white/35'
                }`}
              >
                {formatDueLabel(bill.daysUntilDue)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
