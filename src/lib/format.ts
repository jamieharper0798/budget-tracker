export function formatMoney(amount: number, currency: string): string {
  const value = Math.abs(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${currency}${value}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDueLabel(daysUntil: number): string {
  if (daysUntil < 0) return `${-daysUntil} day${-daysUntil === 1 ? '' : 's'} overdue`;
  if (daysUntil === 0) return 'Due today';
  if (daysUntil === 1) return 'Due tomorrow';
  return `In ${daysUntil} days`;
}
