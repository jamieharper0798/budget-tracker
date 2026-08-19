import { useCallback } from 'react';
import type { Account, Bill, BudgetState, Category, Frequency, Income, Settings } from '../types';
import { useLocalStorage } from './useLocalStorage';
import { DEFAULT_CATEGORIES } from '../lib/categories';

const DEFAULT_INCOME: Income = { amount: 0, frequency: 'monthly', customIntervalDays: null };

const INITIAL_STATE: BudgetState = {
  bills: [],
  accounts: [],
  categories: DEFAULT_CATEGORIES,
  settings: { currency: '$' },
  income: DEFAULT_INCOME,
};

export interface NewBillInput {
  name: string;
  amount: number;
  accountId: string | null;
  categoryId: string | null;
  frequency: Frequency;
  customIntervalDays: number | null;
  anchorDate: string;
  notes: string;
}

export function useBudget() {
  const [state, setState] = useLocalStorage<BudgetState>('budget-tracker:v1', INITIAL_STATE);

  const addBill = useCallback(
    (input: NewBillInput) => {
      const bill: Bill = {
        id: crypto.randomUUID(),
        ...input,
        active: true,
        createdAt: Date.now(),
      };
      setState((prev) => ({ ...prev, bills: [bill, ...prev.bills] }));
      return bill.id;
    },
    [setState],
  );

  const updateBill = useCallback(
    (id: string, input: NewBillInput) => {
      setState((prev) => ({
        ...prev,
        bills: prev.bills.map((b) => (b.id === id ? { ...b, ...input } : b)),
      }));
    },
    [setState],
  );

  const deleteBill = useCallback(
    (id: string) => {
      setState((prev) => ({ ...prev, bills: prev.bills.filter((b) => b.id !== id) }));
    },
    [setState],
  );

  const toggleBillActive = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        bills: prev.bills.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
      }));
    },
    [setState],
  );

  const addAccount = useCallback(
    (name: string, color: string) => {
      const account: Account = { id: crypto.randomUUID(), name: name.trim(), color };
      setState((prev) => ({ ...prev, accounts: [...prev.accounts, account] }));
      return account.id;
    },
    [setState],
  );

  const updateAccount = useCallback(
    (id: string, name: string, color: string) => {
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? { ...a, name: name.trim(), color } : a)),
      }));
    },
    [setState],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
        bills: prev.bills.map((b) => (b.accountId === id ? { ...b, accountId: null } : b)),
      }));
    },
    [setState],
  );

  const addCategory = useCallback(
    (name: string, icon: string, color: string) => {
      const category: Category = { id: crypto.randomUUID(), name: name.trim(), icon, color };
      setState((prev) => ({ ...prev, categories: [...prev.categories, category] }));
      return category.id;
    },
    [setState],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      setState((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        bills: prev.bills.map((b) => (b.categoryId === id ? { ...b, categoryId: null } : b)),
      }));
    },
    [setState],
  );

  const updateSettings = useCallback(
    (settings: Partial<Settings>) => {
      setState((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    },
    [setState],
  );

  const updateIncome = useCallback(
    (income: Partial<Income>) => {
      setState((prev) => ({ ...prev, income: { ...(prev.income ?? DEFAULT_INCOME), ...income } }));
    },
    [setState],
  );

  return {
    bills: state.bills,
    accounts: state.accounts,
    categories: state.categories,
    settings: state.settings,
    income: state.income ?? DEFAULT_INCOME,
    addBill,
    updateBill,
    deleteBill,
    toggleBillActive,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    deleteCategory,
    updateSettings,
    updateIncome,
  };
}
