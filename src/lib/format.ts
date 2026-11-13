export function formatMoney(amount: number, currency: string, dp = 2): string {
  const value = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  });
  return `${currency}${value}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

export function formatMonthYear(iso: string): string {
  const [y, m] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function ordinal(day: number): string {
  if (day % 10 === 1 && day !== 11) return `${day}st`;
  if (day % 10 === 2 && day !== 12) return `${day}nd`;
  if (day % 10 === 3 && day !== 13) return `${day}rd`;
  return `${day}th`;
}

export function formatDueDay(date: Date): string {
  return ordinal(date.getUTCDate());
}

export function ringBackground(color: string, percent: number): string {
  const pct = Math.max(0, Math.min(100, percent));
  return `conic-gradient(${color} 0 ${pct}%, var(--color-track) ${pct}% 100%)`;
}

export function formatDueLabel(daysUntil: number): string {
  if (daysUntil < 0) return `${-daysUntil} day${-daysUntil === 1 ? '' : 's'} overdue`;
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `In ${daysUntil} days`;
}
