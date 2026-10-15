export interface HabitColor {
  from: string;
  to: string;
  glow: string;
}

export const COLORS: Record<string, HabitColor> = {
  violet: { from: '#a855f7', to: '#6366f1', glow: 'rgba(168,85,247,0.45)' },
  pink: { from: '#f472b6', to: '#e11d48', glow: 'rgba(244,114,182,0.45)' },
  orange: { from: '#fb923c', to: '#f43f5e', glow: 'rgba(251,146,60,0.45)' },
  amber: { from: '#fbbf24', to: '#f97316', glow: 'rgba(251,191,36,0.45)' },
  lime: { from: '#a3e635', to: '#10b981', glow: 'rgba(163,230,53,0.4)' },
  teal: { from: '#2dd4bf', to: '#0ea5e9', glow: 'rgba(45,212,191,0.45)' },
  sky: { from: '#38bdf8', to: '#6366f1', glow: 'rgba(56,189,248,0.45)' },
  slate: { from: '#94a3b8', to: '#475569', glow: 'rgba(148,163,184,0.35)' },
};

export function colorOf(key: string): HabitColor {
  return COLORS[key] ?? COLORS.violet;
}

export function gradient(key: string, angle = 135): string {
  const c = colorOf(key);
  return `linear-gradient(${angle}deg, ${c.from}, ${c.to})`;
}
