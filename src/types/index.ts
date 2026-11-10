export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface Account {
  id: string;
  name: string;
  color: string;
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
}

export interface Settings {
  currency: string;
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
}
