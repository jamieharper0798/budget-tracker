export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Account {
  id: string;
  name: string;
  color: string;
  /** Set when this account is a sub-account (e.g. a pot within a bank account) nested under a top-level one. */
  parentAccountId?: string | null;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  builtIn?: boolean;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  accountId: string | null;
  categoryId: string | null;
  frequency: Frequency;
  /** Only used when frequency === 'custom'; number of days between payments. */
  customIntervalDays: number | null;
  /** ISO date 'YYYY-MM-DD' — the first (or a known) payment date, used as the billing cycle anchor. */
  anchorDate: string;
  notes: string;
  active: boolean;
  createdAt: number;
  /** Monthly bills only — how many of the 12 months it's actually charged (e.g. 10 for council tax). Defaults to 12. */
  paymentsPerYear?: number;
  /** Days before the due date to remind the user. Defaults to 2. */
  reminderDaysBefore?: number;
  /** Months (1-12) in a year this bill isn't charged, e.g. [2, 3] for council tax's Feb/Mar holiday. */
  noPaymentMonths?: number[];
}

export interface Settings {
  currency: string;
  /** Day of the month income arrives, for the Calendar's payday event. */
  payDay?: number;
}

export interface Income {
  amount: number;
  frequency: Frequency;
  /** Only used when frequency === 'custom'; number of days between paychecks. */
  customIntervalDays: number | null;
}

export interface SavingsPot {
  id: string;
  name: string;
  target: number;
  /** ISO date 'YYYY-MM-DD', or null if no target date is set. */
  targetDate: string | null;
  monthlyContribution: number;
  color: string;
  createdAt: number;
}

export interface Deposit {
  id: string;
  potId: string;
  amount: number;
  /** ISO date 'YYYY-MM-DD'. */
  date: string;
  note: string;
  createdAt: number;
}

export interface BillPayment {
  billId: string;
  /** 'YYYY-MM' — presence of a (billId, period) pair means that bill is marked paid for that month. */
  period: string;
  /** ISO date 'YYYY-MM-DD' this bill was marked paid on. */
  paidOn?: string;
}

/** A recurring monthly transfer into a pot on a given day of the month, shown on the Calendar. Distinct from an
 * actual logged Deposit — this is just the plan, not a record that money moved. One per pot. */
export interface PlannedTransfer {
  potId: string;
  day: number;
  amount: number;
}

export interface BudgetState {
  bills: Bill[];
  accounts: Account[];
  categories: Category[];
  settings: Settings;
  income: Income;
  pots: SavingsPot[];
  deposits: Deposit[];
  payments: BillPayment[];
  plannedTransfers: PlannedTransfer[];
}
