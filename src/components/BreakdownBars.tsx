import { formatMoney } from '../lib/format';

export interface BreakdownRow {
  id: string;
  label: string;
  icon?: string;
  color: string;
  monthly: number;
}

interface Props {
  title: string;
  rows: BreakdownRow[];
  currency: string;
}

export function BreakdownBars({ title, rows, currency }: Props) {
  const sorted = [...rows].filter((r) => r.monthly > 0).sort((a, b) => b.monthly - a.monthly);
  const max = sorted[0]?.monthly ?? 0;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">{title}</p>
      {sorted.length === 0 ? (
        <p className="py-4 text-center text-sm text-white/35">No data yet</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {sorted.map((row) => (
            <div key={row.id} className="flex items-center gap-2.5">
              {row.icon && <span className="w-5 shrink-0 text-center text-sm">{row.icon}</span>}
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                  <span className="truncate text-white/70">{row.label}</span>
                  <span className="shrink-0 font-medium text-white/90">
                    {formatMoney(row.monthly, currency)}
                    <span className="text-white/35">/mo</span>
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${max > 0 ? (row.monthly / max) * 100 : 0}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
