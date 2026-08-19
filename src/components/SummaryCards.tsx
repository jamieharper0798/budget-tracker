import { formatMoney } from '../lib/format';
import type { EnrichedBill } from '../lib/derive';

interface Props {
  bills: EnrichedBill[];
  currency: string;
}

export function SummaryCards({ bills, currency }: Props) {
  const active = bills.filter((b) => b.active);
  const monthlyTotal = active.reduce((sum, b) => sum + b.monthly, 0);
  const yearlyTotal = active.reduce((sum, b) => sum + b.yearly, 0);
  const dueSoon = active.filter((b) => b.daysUntilDue >= 0 && b.daysUntilDue <= 7);
  const dueSoonTotal = dueSoon.reduce((sum, b) => sum + b.amount, 0);
  const overdue = active.filter((b) => b.daysUntilDue < 0);

  const cards = [
    { label: 'Monthly total', value: formatMoney(monthlyTotal, currency), accent: 'text-emerald-400' },
    { label: 'Yearly total', value: formatMoney(yearlyTotal, currency), accent: 'text-sky-400' },
    {
      label: 'Due in 7 days',
      value: `${formatMoney(dueSoonTotal, currency)}`,
      sub: `${dueSoon.length} payment${dueSoon.length === 1 ? '' : 's'}`,
      accent: 'text-amber-400',
    },
    {
      label: 'Active bills',
      value: String(active.length),
      sub: overdue.length > 0 ? `${overdue.length} overdue` : undefined,
      accent: overdue.length > 0 ? 'text-rose-400' : 'text-white',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="glass rounded-2xl p-4">
          <p className="text-xs font-medium text-white/40">{c.label}</p>
          <p className={`font-display mt-1 text-xl font-bold ${c.accent}`}>{c.value}</p>
          {c.sub && <p className="mt-0.5 text-[11px] text-white/35">{c.sub}</p>}
        </div>
      ))}
    </div>
  );
}
