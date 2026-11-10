import { formatMoney } from '../lib/format';

interface Props {
  history: { label: string; total: number }[];
  currency: string;
}

function smooth(pts: [number, number][]): string {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i += 1) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const mx = (x0 + x1) / 2;
    d += ` C${mx} ${y0} ${mx} ${y1} ${x1} ${y1}`;
  }
  return d;
}

export function GrowthChart({ history, currency }: Props) {
  if (history.every((h) => h.total === 0)) {
    return <p className="py-6 text-center text-sm text-muted">Log a saving to see your growth chart.</p>;
  }

  const vals = history.map((h) => h.total);
  const lo = Math.min(...vals) * 0.85;
  const hi = Math.max(...vals) * 1.05 || 1;
  const denom = hi - lo || 1;
  const pts: [number, number][] = history.map((h, i) => [
    i * (600 / (history.length - 1)),
    Math.round(150 - ((h.total - lo) / denom) * 140),
  ]);
  const line = smooth(pts);
  const area = `${line} L600 160 L0 160 Z`;

  return (
    <div className="flex flex-col gap-1">
      <svg
        viewBox="0 0 600 160"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Total savings from ${formatMoney(vals[0], currency, 0)} to ${formatMoney(vals[vals.length - 1], currency, 0)}`}
        style={{ width: '100%', height: 120, display: 'block' }}
      >
        <path d={area} fill="var(--color-violet)" fillOpacity={0.14} />
        <path d={line} fill="none" stroke="var(--color-violet)" strokeWidth={2.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="flex justify-between text-xs text-muted">
        {history.map((h, i) => (
          <span key={i} className={i === history.length - 1 ? 'font-semibold text-ink' : undefined}>
            {h.label}
          </span>
        ))}
      </div>
    </div>
  );
}
