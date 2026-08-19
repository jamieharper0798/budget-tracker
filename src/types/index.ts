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

export interface BudgetState {
  bills: Bill[];
  accounts: Account[];
  categories: Category[];
  settings: Settings;
  income: Income;
}
