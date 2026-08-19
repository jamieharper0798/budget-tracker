import type { Account, Category } from '../types';
import type { EnrichedBill } from '../lib/derive';
import { FREQUENCY_LABELS } from '../lib/frequency';
import { formatDate, formatDueLabel, formatMoney } from '../lib/format';

interface Props {
  bills: EnrichedBill[];
  accounts: Account[];
  categories: Category[];
  currency: string;
  onEdit: (bill: EnrichedBill) => void;
  onDelete: (id: string) => void;
  onToggleActive: (id: string) => void;
}

export function BillList({ bills, accounts, categories, currency, onEdit, onDelete, onToggleActive }: Props) {
  if (bills.length === 0) {
    return (
      <div className="glass rounded-2xl p-10 text-center">
        <p className="text-3xl">🧾</p>
        <p className="mt-2 text-sm font-medium text-white">No bills match this view</p>
        <p className="mt-1 text-xs text-white/40">Add a subscription or bill, or adjust your filters.</p>
      </div>
    );
  }

  const sorted = [...bills].sort((a, b) => a.daysUntilDue - b.daysUntilDue);

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((bill) => {
        const account = accounts.find((a) => a.id === bill.accountId);
        const category = categories.find((c) => c.id === bill.categoryId);
        const overdue = bill.active && bill.daysUntilDue < 0;
        return (
          <div
            key={bill.id}
            className={`glass rounded-2xl p-4 transition ${!bill.active ? 'opacity-45' : ''}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg"
                  style={{ backgroundColor: `${category?.color ?? '#64748b'}22` }}
                >
                  {category?.icon ?? '🗂️'}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{bill.name}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-white/40">
                    <span>{FREQUENCY_LABELS[bill.frequency]}</span>
                    <span>·</span>
                    <span>{formatDate(bill.nextDue)}</span>
                    {account && (
                      <>
                        <span>·</span>
                        <span style={{ color: account.color }}>{account.name}</span>
                      </>
                    )}
                  </p>
                  {bill.notes && <p className="mt-1 truncate text-xs text-white/30">{bill.notes}</p>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-white">{formatMoney(bill.amount, currency)}</p>
                {bill.active && (
                  <p className={`text-[11px] font-medium ${overdue ? 'text-rose-400' : 'text-white/35'}`}>
                    {formatDueLabel(bill.daysUntilDue)}
                  </p>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 border-t border-white/5 pt-3">
              <button
                onClick={() => onEdit(bill)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
              >
                Edit
              </button>
              <button
                onClick={() => onToggleActive(bill.id)}
                className="rounded-lg px-2.5 py-1 text-xs font-medium text-white/50 hover:bg-white/5 hover:text-white"
              >
                {bill.active ? 'Pause' : 'Resume'}
              </button>
              <button
                onClick={() => onDelete(bill.id)}
                className="ml-auto rounded-lg px-2.5 py-1 text-xs font-medium text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
