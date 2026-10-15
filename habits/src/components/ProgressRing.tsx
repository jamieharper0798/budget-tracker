import type { ReactNode } from 'react';
import { useId } from 'react';

interface Props {
  value: number; // 0..1
  size: number;
  stroke: number;
  from?: string;
  to?: string;
  track?: string;
  children?: ReactNode;
}

export function ProgressRing({ value, size, stroke, from = '#f472b6', to = '#fb923c', track = 'rgba(255,255,255,0.08)', children }: Props) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(0.2, 0.9, 0.3, 1)', opacity: v === 0 ? 0 : 1 }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
