import type { EnrichedBill } from './derive';
import type { BillPayment, PlannedTransfer } from '../types';
import { dueDayInMonth } from './frequency';

export type CalendarEvent =
  | { type: 'bill'; bill: EnrichedBill; name: string; amount: number; state: 'due' | 'paid' | 'overdue' | 'set-aside' }
  | { type: 'save'; potId: string; name: string; amount: number }
  | { type: 'pay'; amount: number };

/** Everything that happens on a given day of (year, month): bills due (or an annual bill's monthly
 * "set aside" reminder on its billing day, every month — matching the reference design), planned savings
 * transfers, and payday. One event per bill per month, on its `dueDayInMonth` — the same representative
 * due day the rest of the app already uses, so a weekly/biweekly bill shows once, not once per occurrence. */
export function eventsOnDay(
  day: number,
  year: number,
  month: number,
  bills: EnrichedBill[],
  payments: BillPayment[],
  period: string,
  today: Date,
  plannedTransfers: PlannedTransfer[],
  potName: (potId: string) => string,
  payDay: number | undefined,
  monthlyIncome: number,
): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const eventDate = new Date(Date.UTC(year, month, day));

  if (payDay === day) events.push({ type: 'pay', amount: monthlyIncome });

  for (const bill of bills) {
    if (!bill.active) continue;
    if (dueDayInMonth(bill.anchorDate, year, month) !== day) continue;

    if (bill.frequency === 'yearly') {
      events.push({ type: 'bill', bill, name: `${bill.name} (set aside)`, amount: bill.monthly, state: 'set-aside' });
      continue;
    }

    const paid = payments.some((p) => p.billId === bill.id && p.period === period);
    const overdue = !paid && eventDate < today;
    events.push({ type: 'bill', bill, name: bill.name, amount: bill.amount, state: paid ? 'paid' : overdue ? 'overdue' : 'due' });
  }

  for (const t of plannedTransfers) {
    if (t.day === day) events.push({ type: 'save', potId: t.potId, name: potName(t.potId), amount: t.amount });
  }

  return events;
}
