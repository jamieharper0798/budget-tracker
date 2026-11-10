import { useCallback, useEffect, useRef, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import type { Account, Bill, BudgetState, Category, Deposit, Frequency, Income, SavingsPot, Settings } from '../types';
import { db } from '../lib/firebase';
import { DEFAULT_CATEGORIES } from '../lib/categories';

const DEFAULT_INCOME: Income = { amount: 0, frequency: 'monthly', customIntervalDays: null };

const INITIAL_STATE: BudgetState = {
  bills: [],
  accounts: [],
  categories: DEFAULT_CATEGORIES,
  settings: { currency: '$' },
  income: DEFAULT_INCOME,
  pots: [],
  deposits: [],
  payments: [],
};

/** Data from the pre-login, localStorage-only version of this app, adopted on first sync. */
const LEGACY_LOCAL_STORAGE_KEY = 'budget-tracker:v1';

function readLegacyLocalState(): BudgetState | null {
  try {
    const stored = window.localStorage.getItem(LEGACY_LOCAL_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as BudgetState) : null;
  } catch {
    return null;
  }
}

function normalize(data: Partial<BudgetState> | undefined): BudgetState {
  return {
    bills: data?.bills ?? [],
    accounts: data?.accounts ?? [],
    categories: data?.categories ?? DEFAULT_CATEGORIES,
    settings: data?.settings ?? { currency: '$' },
    income: data?.income ?? DEFAULT_INCOME,
    pots: data?.pots ?? [],
    deposits: data?.deposits ?? [],
    payments: data?.payments ?? [],
  };
}

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

export function useBudget(uid: string) {
  const [state, setState] = useState<BudgetState>(INITIAL_STATE);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!db) return;
    setReady(false);
    const ref = doc(db, 'users', uid);
    const unsubscribe = onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          setState(normalize(snap.data() as Partial<BudgetState>));
        } else {
          const seed = normalize(readLegacyLocalState() ?? undefined);
          setDoc(ref, seed).catch(() => {});
          setState(seed);
        }
        setReady(true);
      },
      () => setReady(true),
    );
    return unsubscribe;
  }, [uid]);

  const commit = useCallback(
    (updater: (prev: BudgetState) => BudgetState) => {
      const next = updater(stateRef.current);
      stateRef.current = next;
      setState(next);
      if (db) setDoc(doc(db, 'users', uid), next).catch(() => {});
    },
    [uid],
  );

  const addBill = useCallback(
    (input: NewBillInput) => {
      const bill: Bill = { id: crypto.randomUUID(), ...input, active: true, createdAt: Date.now() };
      commit((prev) => ({ ...prev, bills: [bill, ...prev.bills] }));
      return bill.id;
    },
    [commit],
  );

  const updateBill = useCallback(
    (id: string, input: NewBillInput) => {
      commit((prev) => ({
        ...prev,
        bills: prev.bills.map((b) => (b.id === id ? { ...b, ...input } : b)),
      }));
    },
    [commit],
  );

  const deleteBill = useCallback(
    (id: string) => {
      commit((prev) => ({ ...prev, bills: prev.bills.filter((b) => b.id !== id) }));
    },
    [commit],
  );

  const toggleBillActive = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        bills: prev.bills.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
      }));
    },
    [commit],
  );

  const addAccount = useCallback(
    (name: string, color: string) => {
      const account: Account = { id: crypto.randomUUID(), name: name.trim(), color };
      commit((prev) => ({ ...prev, accounts: [...prev.accounts, account] }));
      return account.id;
    },
    [commit],
  );

  const updateAccount = useCallback(
    (id: string, name: string, color: string) => {
      commit((prev) => ({
        ...prev,
        accounts: prev.accounts.map((a) => (a.id === id ? { ...a, name: name.trim(), color } : a)),
      }));
    },
    [commit],
  );

  const deleteAccount = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        accounts: prev.accounts.filter((a) => a.id !== id),
        bills: prev.bills.map((b) => (b.accountId === id ? { ...b, accountId: null } : b)),
      }));
    },
    [commit],
  );

  const addCategory = useCallback(
    (name: string, icon: string, color: string) => {
      const category: Category = { id: crypto.randomUUID(), name: name.trim(), icon, color };
      commit((prev) => ({ ...prev, categories: [...prev.categories, category] }));
      return category.id;
    },
    [commit],
  );

  const deleteCategory = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        categories: prev.categories.filter((c) => c.id !== id),
        bills: prev.bills.map((b) => (b.categoryId === id ? { ...b, categoryId: null } : b)),
      }));
    },
    [commit],
  );

  const updateSettings = useCallback(
    (settings: Partial<Settings>) => {
      commit((prev) => ({ ...prev, settings: { ...prev.settings, ...settings } }));
    },
    [commit],
  );

  const updateIncome = useCallback(
    (income: Partial<Income>) => {
      commit((prev) => ({ ...prev, income: { ...prev.income, ...income } }));
    },
    [commit],
  );

  const togglePaid = useCallback(
    (billId: string, period: string) => {
      commit((prev) => {
        const isPaid = prev.payments.some((p) => p.billId === billId && p.period === period);
        return {
          ...prev,
          payments: isPaid
            ? prev.payments.filter((p) => !(p.billId === billId && p.period === period))
            : [...prev.payments, { billId, period }],
        };
      });
    },
    [commit],
  );

  const addPot = useCallback(
    (input: Omit<SavingsPot, 'id' | 'createdAt'>) => {
      const pot: SavingsPot = { id: crypto.randomUUID(), ...input, createdAt: Date.now() };
      commit((prev) => ({ ...prev, pots: [...prev.pots, pot] }));
      return pot.id;
    },
    [commit],
  );

  const updatePot = useCallback(
    (id: string, input: Omit<SavingsPot, 'id' | 'createdAt'>) => {
      commit((prev) => ({
        ...prev,
        pots: prev.pots.map((p) => (p.id === id ? { ...p, ...input } : p)),
      }));
    },
    [commit],
  );

  const deletePot = useCallback(
    (id: string) => {
      commit((prev) => ({
        ...prev,
        pots: prev.pots.filter((p) => p.id !== id),
        deposits: prev.deposits.filter((d) => d.potId !== id),
      }));
    },
    [commit],
  );

  const addDeposit = useCallback(
    (potId: string, amount: number, date: string, note: string) => {
      const deposit: Deposit = { id: crypto.randomUUID(), potId, amount, date, note, createdAt: Date.now() };
      commit((prev) => ({ ...prev, deposits: [deposit, ...prev.deposits] }));
      return deposit.id;
    },
    [commit],
  );

  const deleteDeposit = useCallback(
    (id: string) => {
      commit((prev) => ({ ...prev, deposits: prev.deposits.filter((d) => d.id !== id) }));
    },
    [commit],
  );

  return {
    ready,
    bills: state.bills,
    accounts: state.accounts,
    categories: state.categories,
    settings: state.settings,
    income: state.income,
    pots: state.pots,
    deposits: state.deposits,
    payments: state.payments,
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
    togglePaid,
    addPot,
    updatePot,
    deletePot,
    addDeposit,
    deleteDeposit,
  };
}
