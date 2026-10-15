export function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return toKey(new Date());
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

export function weekday(key: string): number {
  return fromKey(key).getDay();
}

/** Monday of the week containing `key`. */
export function weekStart(key: string): string {
  const wd = weekday(key);
  return addDays(key, -((wd + 6) % 7));
}

export const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_LETTER = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function prettyDate(key: string): string {
  return fromKey(key).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}
