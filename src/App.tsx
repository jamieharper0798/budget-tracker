import { useMemo, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useBudget } from './hooks/useBudget';
import type { NewBillInput } from './hooks/useBudget';
import { enrichBills } from './lib/derive';
import type { EnrichedBill } from './lib/derive';
import {
  FREQUENCY_LABELS,
  dueDateInMonth,
  dueDayInMonth,
  monthlyCost,
  parseISODate,
  todayUTC,
} from './lib/frequency';
import type { Frequency, SavingsPot } from './types';
import { formatDate, formatDueDay, formatMoney, ringBackground } from './lib/format';
import { potSaved, savingsHistory, totalSaved } from './lib/savings';
import { AuthScreen } from './components/AuthScreen';
import { Ring } from './components/Ring';
import { PotCard } from './components/PotCard';
import { GrowthChart } from './components/GrowthChart';
import { BillForm } from './components/BillForm';
import { BulkImportForm } from './components/BulkImportForm';
import { NewPotForm } from './components/NewPotForm';
import { LogSavingForm } from './components/LogSavingForm';
import { AdjustBalanceForm } from './components/AdjustBalanceForm';
import { AccountManager } from './components/AccountManager';
import { CategoryManager } from './components/CategoryManager';
import { Modal } from './components/Modal';
import { InstallButton } from './components/InstallButton';
import { UpdateToast } from './components/UpdateToast';

const CURRENCIES = ['$', '£', '€', '¥', '₹', 'A$', 'C$'];
const INCOME_FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'];
const TABS = ['Overview', 'Bills', 'Savings', 'Calendar', 'Settings'] as const;
type Tab = (typeof TABS)[number];

function initialsFromEmail(email: string | null): string {
  if (!email) return '?';
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase() || '?';
}

function LoadingScreen({ label }: { label: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}

function EmptyState({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="flex flex-col items-center gap-1 py-10 text-center">
      <p className="text-3xl">{emoji}</p>
      <p className="text-sm font-medium text-ink">{title}</p>
      <p className="text-xs text-muted">{subtitle}</p>
    </div>
  );
}

function ComingSoon({ tab }: { tab: Tab }) {
  return (
    <div className="card flex flex-col items-center gap-2 p-12 text-center">
      <p className="text-3xl">🚧</p>
      <p className="text-sm font-semibold text-ink">{tab} is coming soon</p>
      <p className="text-xs text-muted">For now, everything is managed from the Overview tab.</p>
    </div>
  );
}

function App() {
  const { user, loading, signUp, logIn, logOut, resetPassword } = useAuth();

  if (loading) return <LoadingScreen label="Loading…" />;
  if (!user) return <AuthScreen onSignUp={signUp} onLogIn={logIn} onResetPassword={resetPassword} />;

  return <Dashboard uid={user.uid} email={user.email} onLogOut={logOut} />;
}

interface DashboardProps {
  uid: string;
  email: string | null;
  onLogOut: () => void;
}

function Dashboard({ uid, email, onLogOut }: DashboardProps) {
  const {
    ready,
    bills,
    accounts,
    categories,
    settings,
    income,
    pots,
    deposits,
    payments,
    addBill,
    updateBill,
    deleteBill,
    toggleBillActive,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateCategory,
    deleteCategory,
    updateSettings,
    updateIncome,
    togglePaid,
    addPot,
    updatePot,
    deletePot,
    addDeposit,
    adjustPotBalance,
    importBills,
  } = useBudget(uid);

  const today = todayUTC();
  const [tab, setTab] = useState<Tab>('Overview');
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());

  const [menuOpen, setMenuOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);

  const [billFormOpen, setBillFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<EnrichedBill | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const [potFormOpen, setPotFormOpen] = useState(false);
  const [editingPot, setEditingPot] = useState<SavingsPot | null>(null);

  const [logSavingOpen, setLogSavingOpen] = useState(false);
  const [logSavingPotId, setLogSavingPotId] = useState<string | null>(null);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [adjustingPot, setAdjustingPot] = useState<SavingsPot | null>(null);

  const enriched = useMemo(() => enrichBills(bills), [bills]);
  const activeBills = useMemo(() => enriched.filter((b) => b.active), [enriched]);
  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isCurrentMonth = year === today.getUTCFullYear() && month === today.getUTCMonth();

  const billsTotal = useMemo(() => activeBills.reduce((sum, b) => sum + b.monthly, 0), [activeBills]);
  const savingsTotal = useMemo(() => pots.reduce((sum, p) => sum + p.monthlyContribution, 0), [pots]);
  const monthlyIncome = monthlyCost(income.amount, income.frequency, income.customIntervalDays);
  const leftover = monthlyIncome - billsTotal - savingsTotal;

  // All bills (active + paused) for display; paused ones are shown dimmed with no paid/overdue state.
  const billRows = useMemo(
    () =>
      enriched.map((bill) => {
        const dueDate = dueDateInMonth(bill.anchorDate, bill.frequency, bill.customIntervalDays, year, month);
        const paid = payments.some((p) => p.billId === bill.id && p.period === period);
        const overdue = isCurrentMonth && !paid && dueDayInMonth(bill.anchorDate, year, month) < today.getUTCDate();
        return { bill, dueDate, paid, overdue };
      }),
    [enriched, payments, period, year, month, isCurrentMonth, today],
  );
  const activeBillRows = useMemo(() => billRows.filter((r) => r.bill.active), [billRows]);

  const paidAmt = activeBillRows.filter((r) => r.paid).reduce((sum, r) => sum + r.bill.monthly, 0);
  const paidCount = activeBillRows.filter((r) => r.paid).length;
  const paidPct = billsTotal > 0 ? Math.round((paidAmt / billsTotal) * 100) : 0;
  const remaining = billsTotal - paidAmt;

  const upcoming = useMemo(
    () =>
      activeBillRows
        .filter((r) => !r.paid)
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
        .slice(0, 4),
    [activeBillRows],
  );
  const nextUp = upcoming[0] ?? null;

  const donut = useMemo(() => {
    if (billsTotal <= 0) return { background: 'var(--color-track)', rows: [] as { id: string; name: string; icon: string; color: string; value: number; pct: number }[] };
    let acc = 0;
    const stops: string[] = [];
    const rows = categories
      .map((cat) => {
        const value = activeBills.filter((b) => b.categoryId === cat.id).reduce((sum, b) => sum + b.monthly, 0);
        if (value <= 0) return null;
        const start = acc;
        acc += (value / billsTotal) * 100;
        stops.push(`${cat.color} ${start.toFixed(1)}% ${(acc - 0.6).toFixed(1)}%, #fff ${(acc - 0.6).toFixed(1)}% ${acc.toFixed(1)}%`);
        return { id: cat.id, name: cat.name, icon: cat.icon, color: cat.color, value, pct: Math.round((value / billsTotal) * 100) };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
    return { background: `conic-gradient(${stops.join(', ')})`, rows };
  }, [categories, activeBills, billsTotal]);

  const potsWithSaved = useMemo(() => pots.map((p) => ({ pot: p, saved: potSaved(p.id, deposits) })), [pots, deposits]);
  const growth = useMemo(() => savingsHistory(deposits, 6), [deposits]);
  const growthDelta = growth.length > 0 ? growth[growth.length - 1].total - growth[0].total : 0;
  const recentDeposits = deposits.slice(0, 5);
  const totalSavedAll = totalSaved(deposits);

  const billCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      if (!b.accountId) continue;
      counts[b.accountId] = (counts[b.accountId] ?? 0) + 1;
    }
    return counts;
  }, [bills]);

  const categoryBillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      if (!b.categoryId) continue;
      counts[b.categoryId] = (counts[b.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [bills]);

  const potName = (potId: string) => pots.find((p) => p.id === potId)?.name ?? 'Pot';

  const openAddBill = () => {
    setEditingBill(null);
    setBillFormOpen(true);
  };
  const openEditBill = (bill: EnrichedBill) => {
    setEditingBill(bill);
    setBillFormOpen(true);
  };
  const handleSaveBill = (input: NewBillInput) => {
    if (editingBill) updateBill(editingBill.id, input);
    else addBill(input);
    setBillFormOpen(false);
    setEditingBill(null);
  };
  const handleDeleteBill = (id: string) => {
    deleteBill(id);
    setBillFormOpen(false);
    setEditingBill(null);
  };

  const handleImportBills = (entries: Parameters<typeof importBills>[0]) => {
    importBills(entries);
    setBulkImportOpen(false);
  };

  const openNewPot = () => {
    setEditingPot(null);
    setPotFormOpen(true);
  };
  const openEditPot = (pot: SavingsPot) => {
    setEditingPot(pot);
    setPotFormOpen(true);
  };
  const handleSavePot = (input: Omit<SavingsPot, 'id' | 'createdAt'>) => {
    if (editingPot) updatePot(editingPot.id, input);
    else addPot(input);
    setPotFormOpen(false);
    setEditingPot(null);
  };
  const handleDeletePot = () => {
    if (editingPot) deletePot(editingPot.id);
    setPotFormOpen(false);
    setEditingPot(null);
  };

  const openLogSaving = (potId: string | null) => {
    setLogSavingPotId(potId);
    setLogSavingOpen(true);
  };
  const handleSaveDeposit = (potId: string, amount: number, date: string, note: string) => {
    addDeposit(potId, amount, date, note);
    setLogSavingOpen(false);
  };

  const openAdjustBalance = (pot: SavingsPot) => {
    setAdjustingPot(pot);
    setAdjustOpen(true);
  };
  const handleAdjustBalance = (newTotal: number, date: string, note: string) => {
    if (adjustingPot) adjustPotBalance(adjustingPot.id, newTotal, date, note);
    setAdjustOpen(false);
    setAdjustingPot(null);
  };

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  if (!ready) return <LoadingScreen label="Syncing…" />;

  const tiles: { k: string; v: number; c: string | null }[] = [
    { k: 'Income', v: monthlyIncome, c: null },
    { k: 'Bills', v: billsTotal, c: '#fff' },
    { k: 'Savings', v: savingsTotal, c: 'var(--color-violet-soft)' },
    { k: 'Left over', v: leftover, c: 'var(--color-accent)' },
  ];

  return (
    <div className="min-h-screen bg-bg">
      <UpdateToast />

      <div className="app-shell mx-auto flex w-full max-w-[1360px] flex-col gap-5 px-4 sm:px-6">
        <header className="card flex flex-wrap items-center justify-between gap-3 !rounded-[22px] py-2.5 pl-4 pr-2.5">
          <div className="flex items-center gap-2.5 font-display text-[19px] font-bold tracking-tight text-ink">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 17l6-6 4 4 8-8" />
                <path d="M14 7h7v7" />
              </svg>
            </div>
            Ledgerly
          </div>

          <nav className="flex flex-wrap gap-1 rounded-2xl bg-surface-2 p-1" aria-label="Main">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`min-h-10 rounded-xl px-4 text-sm font-medium transition ${
                  tab === t ? 'bg-surface text-ink shadow-[0_1px_3px_rgba(14,17,22,.08)]' : 'text-muted-2'
                }`}
              >
                {t}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <InstallButton />
            <button
              className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-surface-2 text-muted"
              title="Bill reminders — coming soon"
              aria-label="Bill reminders"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
              </svg>
            </button>
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-violet text-sm font-semibold text-white"
                aria-label="Account"
                title={email ?? 'Account'}
              >
                {initialsFromEmail(email)}
              </button>
              {menuOpen && (
                <div className="animate-rise card-sm absolute right-0 top-full z-20 mt-2 w-56 p-2">
                  {email && <p className="truncate px-2 py-1.5 text-[11px] text-muted">{email}</p>}
                  <div className="my-1 border-t border-line" />
                  <p className="px-2 pb-1 text-[11px] font-medium text-muted">Currency</p>
                  <div className="grid grid-cols-4 gap-1 px-2 pb-2">
                    {CURRENCIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateSettings({ currency: c })}
                        className={`rounded-lg py-1.5 text-xs font-medium ${
                          settings.currency === c ? 'bg-accent text-ink' : 'text-muted hover:bg-surface-2'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                  <div className="my-1 border-t border-line" />
                  <button
                    onClick={() => {
                      setAccountsOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-ink hover:bg-surface-2"
                  >
                    Manage accounts
                  </button>
                  <button
                    onClick={() => {
                      setCategoriesOpen(true);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-ink hover:bg-surface-2"
                  >
                    Manage categories
                  </button>
                  <button
                    onClick={onLogOut}
                    className="w-full rounded-lg px-2 py-1.5 text-left text-xs font-medium text-ink hover:bg-surface-2"
                  >
                    Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {tab !== 'Overview' ? (
          <ComingSoon tab={tab} />
        ) : (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4 px-1 pt-1">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium text-muted">
                  {today.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
                </span>
                <h1 className="font-display text-[clamp(26px,3.2vw,38px)] font-semibold tracking-tight text-ink">Overview</h1>
              </div>
              <div className="flex items-center gap-1 rounded-[14px] bg-surface p-1 shadow-[0_1px_2px_rgba(14,17,22,.04)]">
                <button onClick={prevMonth} aria-label="Previous month" className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-surface-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                </button>
                <span className="min-w-[132px] text-center text-sm font-semibold text-ink">
                  {new Date(Date.UTC(year, month, 1)).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' })}
                </span>
                <button onClick={nextMonth} aria-label="Next month" className="flex h-10 w-10 items-center justify-center rounded-[10px] hover:bg-surface-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </button>
              </div>
            </div>

            {/* Row 1: hero + paid stats */}
            <div className="flex flex-wrap items-stretch gap-5">
              <section className="card flex min-w-0 flex-[2_1_520px] flex-col gap-6 !bg-ink p-7 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex flex-col gap-2">
                    <h2 className="text-sm font-medium text-muted-on-ink">Left over after bills &amp; savings</h2>
                    <div className="font-display text-[clamp(36px,5vw,56px)] font-semibold leading-none tracking-tight">
                      {leftover < 0 ? '−' : ''}
                      {formatMoney(leftover, settings.currency)}
                    </div>
                    <button
                      onClick={() => setIncomeOpen((v) => !v)}
                      className="inline-flex w-fit items-center gap-1.5 rounded-full bg-ink-2 px-3 py-1.5 text-[13px] font-medium text-[#D5DAE0]"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
                      </svg>
                      Entered by you · tap to edit income
                    </button>
                    {incomeOpen && (
                      <div className="mt-1 flex flex-wrap items-center gap-2 rounded-2xl bg-ink-2 p-3">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={income.amount || ''}
                          onChange={(e) => updateIncome({ amount: Number(e.target.value) || 0 })}
                          className="w-28 rounded-lg border border-ink-line bg-ink px-2.5 py-2 text-sm text-white placeholder:text-muted-on-ink outline-none"
                        />
                        <select
                          value={income.frequency}
                          onChange={(e) => updateIncome({ frequency: e.target.value as Frequency })}
                          className="rounded-lg border border-ink-line bg-ink px-2.5 py-2 text-sm text-white outline-none"
                        >
                          {INCOME_FREQUENCIES.map((f) => (
                            <option key={f} value={f}>
                              {FREQUENCY_LABELS[f]}
                            </option>
                          ))}
                        </select>
                        {income.frequency === 'custom' && (
                          <input
                            type="number"
                            min="1"
                            placeholder="Days"
                            value={income.customIntervalDays ?? ''}
                            onChange={(e) => updateIncome({ customIntervalDays: Number(e.target.value) || null })}
                            className="w-20 rounded-lg border border-ink-line bg-ink px-2.5 py-2 text-sm text-white outline-none"
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={openAddBill} className="flex min-h-11 items-center gap-2 rounded-[14px] bg-accent px-4 font-semibold text-ink">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                      Add bill
                    </button>
                    <button
                      onClick={() => openLogSaving(null)}
                      className="flex min-h-11 items-center gap-2 rounded-[14px] border border-ink-line bg-ink-2 px-4 font-semibold text-white"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                        <path d="M21 11h-6a2 2 0 0 0 0 4h6z" />
                      </svg>
                      Log saving
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-2.5">
                  <div
                    className="flex h-3.5 gap-1"
                    role="img"
                    aria-label={`Of ${formatMoney(monthlyIncome, settings.currency, 0)} income: bills, savings and left over`}
                  >
                    <span className="rounded-full bg-white" style={{ flex: `${Math.max(billsTotal, 0.0001)} 1 0` }} />
                    <span className="rounded-full bg-violet-soft" style={{ flex: `${Math.max(savingsTotal, 0.0001)} 1 0` }} />
                    <span className="rounded-full bg-accent" style={{ flex: `${Math.max(leftover, 0.0001)} 1 0` }} />
                  </div>
                  <span className="text-[13px] text-muted-on-ink">
                    How your {formatMoney(monthlyIncome, settings.currency, 0)} monthly income is planned
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {tiles.map((t) => (
                    <div key={t.k} className="flex flex-col gap-1.5 rounded-2xl bg-ink-2 p-3.5">
                      <span className="flex items-center gap-1.5 text-[13px] text-muted-on-ink">
                        {t.c && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: t.c }} />}
                        {t.k}
                      </span>
                      <span className="text-[17px] font-semibold text-white">{formatMoney(t.v, settings.currency)}</span>
                    </div>
                  ))}
                </div>
              </section>

              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <section className="card flex flex-row items-center gap-5 p-6">
                  <Ring size={120} innerSize={92} background={ringBackground('var(--color-ink)', paidPct)} label={`${paidCount} of ${activeBillRows.length} bills paid`}>
                    <span className="font-display text-2xl font-semibold text-ink">{paidCount}</span>
                    <span className="text-xs text-muted">of {activeBillRows.length} paid</span>
                  </Ring>
                  <div className="flex min-w-0 flex-col gap-1">
                    <h2 className="text-sm font-medium text-muted">Bills still to pay</h2>
                    <span className="font-display text-[32px] font-semibold tracking-tight text-ink">{formatMoney(remaining, settings.currency)}</span>
                    <span className="text-sm text-muted">{formatMoney(paidAmt, settings.currency)} paid so far this month</span>
                  </div>
                </section>

                <div className="grid flex-1 grid-cols-2 gap-5">
                  <section className="card flex flex-col gap-2 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-warn-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-warn-fg)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="5" width="18" height="16" rx="3" />
                        <path d="M16 3v4M8 3v4M3 10h18" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-muted">Next due</span>
                    <span className="font-display text-[22px] font-semibold text-ink">
                      {nextUp ? formatMoney(nextUp.bill.monthly, settings.currency) : '—'}
                    </span>
                    <span className="truncate text-sm text-muted">
                      {nextUp ? `${nextUp.bill.name} · ${formatDate(nextUp.dueDate)}` : 'All paid'}
                    </span>
                  </section>
                  <section className="card flex flex-col gap-2 p-5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-ok-bg">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-ok-fg)" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19V5M6 11l6-6 6 6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-muted">Total saved</span>
                    <span className="font-display text-[22px] font-semibold text-ink">{formatMoney(totalSavedAll, settings.currency, 0)}</span>
                    <span className="text-sm text-muted">across {pots.length} pot{pots.length === 1 ? '' : 's'}</span>
                  </section>
                </div>
              </div>
            </div>

            {/* Row 2: bills list + category donut + coming up */}
            <div className="flex flex-wrap gap-5">
              <section className="card flex min-w-0 flex-[2_1_520px] flex-col gap-1 p-6">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Recurring bills</h2>
                    <span className="text-sm text-muted">
                      {bills.length} bill{bills.length === 1 ? '' : 's'} · {formatMoney(billsTotal, settings.currency)} a month · tap to mark as paid
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => setBulkImportOpen(true)} className="text-sm font-medium text-muted hover:text-ink">
                      Bulk import
                    </button>
                    <button onClick={openAddBill} className="text-sm font-semibold text-ink hover:text-muted">
                      + Add bill
                    </button>
                  </div>
                </div>

                {bills.length === 0 ? (
                  <EmptyState emoji="🧾" title="No bills yet" subtitle="Add a subscription or bill to get started." />
                ) : (
                  <div className="flex flex-col">
                    {billRows.map(({ bill, dueDate, paid, overdue }) => {
                      const category = categories.find((c) => c.id === bill.categoryId);
                      const account = accounts.find((a) => a.id === bill.accountId);
                      return (
                        <div key={bill.id} className="flex items-center gap-3.5 border-t border-line py-2.5 first:border-t-0">
                          <span
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] text-lg"
                            style={{ background: `${category?.color ?? '#64748b'}22` }}
                          >
                            {category?.icon ?? '🗂️'}
                          </span>
                          <button onClick={() => openEditBill(bill)} className="min-w-0 flex-1 text-left">
                            <span className="block truncate text-sm font-semibold text-ink">{bill.name}</span>
                            <span className="block truncate text-xs text-muted">
                              {category?.name ?? 'Uncategorized'} · {FREQUENCY_LABELS[bill.frequency]} · due {formatDueDay(dueDate)}
                              {account ? ` · ${account.name}` : ''}
                            </span>
                          </button>
                          <span className="min-w-[72px] shrink-0 text-right text-[15px] font-semibold text-ink">
                            {formatMoney(bill.monthly, settings.currency)}
                          </span>
                          {bill.active ? (
                            <button
                              onClick={() => togglePaid(bill.id, period)}
                              className={`min-h-10 shrink-0 rounded-xl px-3 text-[13px] font-semibold ${
                                paid ? 'bg-ok-bg text-ok-fg' : overdue ? 'bg-warn-bg text-warn-fg' : 'border border-line bg-surface text-ink'
                              }`}
                            >
                              {paid ? '✓ Paid' : overdue ? 'Overdue' : 'Mark paid'}
                            </button>
                          ) : (
                            <span className="min-h-10 shrink-0 rounded-xl border border-line px-3 py-2.5 text-[13px] font-medium text-muted">
                              Paused
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              <div className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <section className="card flex flex-col gap-5 p-6">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Bills by category</h2>
                  <div className="flex justify-center">
                    <Ring size={168} innerSize={118} background={donut.background} label="Monthly bills by category">
                      <span className="text-xs text-muted">Per month</span>
                      <span className="font-display text-xl font-semibold text-ink">{formatMoney(billsTotal, settings.currency, 0)}</span>
                    </Ring>
                  </div>
                  <div className="flex flex-col gap-2.5">
                    {donut.rows.length === 0 ? (
                      <p className="text-center text-sm text-muted">No categorized bills yet.</p>
                    ) : (
                      donut.rows.map((r) => (
                        <div key={r.id} className="flex items-center gap-2.5 text-sm">
                          <span className="h-2.5 w-2.5 shrink-0 rounded" style={{ background: r.color }} />
                          <span className="flex-1 truncate text-ink">{r.name}</span>
                          <span className="text-muted">{r.pct}%</span>
                          <span className="min-w-16 text-right font-semibold text-ink">{formatMoney(r.value, settings.currency)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </section>

                <section className="card p-6">
                  <h2 className="mb-3 font-display text-xl font-semibold tracking-tight text-ink">Coming up</h2>
                  <div className="flex flex-col gap-3.5">
                    {upcoming.length === 0 ? (
                      <span className="text-sm text-muted">Every bill is marked paid for this period.</span>
                    ) : (
                      upcoming.map(({ bill, dueDate }) => {
                        const diff = Math.round((dueDate.getTime() - today.getTime()) / 86_400_000);
                        return (
                          <div key={bill.id} className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-[14px] bg-surface-2 leading-tight">
                              <b className="text-[15px] text-ink">{String(dueDate.getUTCDate()).padStart(2, '0')}</b>
                              <span className="text-[11px] font-medium text-muted">
                                {dueDate.toLocaleDateString(undefined, { month: 'short', timeZone: 'UTC' })}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">{bill.name}</span>
                              <span className="text-[13px] text-muted">
                                {diff < 0 ? `${-diff} days overdue` : diff === 0 ? 'Due today' : `In ${diff} days`}
                              </span>
                            </div>
                            <span className="shrink-0 text-sm font-semibold text-ink">{formatMoney(bill.monthly, settings.currency)}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Row 3: savings pots + growth */}
            <div className="flex flex-wrap gap-5 pb-4">
              <section className="flex min-w-0 flex-[2_1_520px] flex-col gap-3.5">
                <div className="flex items-center justify-between px-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Savings pots</h2>
                  <button onClick={openNewPot} className="text-sm font-semibold text-ink hover:text-muted">
                    New pot →
                  </button>
                </div>
                {pots.length === 0 ? (
                  <div className="card">
                    <EmptyState emoji="🐷" title="No savings pots yet" subtitle="Create a pot to start tracking a goal." />
                  </div>
                ) : (
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3.5">
                    {potsWithSaved.map(({ pot, saved }) => (
                      <PotCard
                        key={pot.id}
                        pot={pot}
                        saved={saved}
                        currency={settings.currency}
                        onAdd={() => openLogSaving(pot.id)}
                        onEdit={() => openEditPot(pot)}
                        onAdjust={() => openAdjustBalance(pot)}
                      />
                    ))}
                  </div>
                )}
              </section>

              <section className="card flex min-w-0 flex-[1_1_300px] flex-col gap-4 p-6">
                <div className="flex flex-col gap-1">
                  <h2 className="font-display text-xl font-semibold tracking-tight text-ink">Savings growth</h2>
                  <span className="text-sm text-muted">
                    {growthDelta >= 0 ? '+' : '−'}
                    {formatMoney(Math.abs(growthDelta), settings.currency, 0)} since {growth[0]?.label}
                  </span>
                </div>
                <GrowthChart history={growth} currency={settings.currency} />
                <div className="flex flex-col gap-2.5 border-t border-line pt-3">
                  <span className="text-sm font-semibold text-ink">Recent deposits</span>
                  {recentDeposits.length === 0 ? (
                    <span className="text-sm text-muted">No deposits logged yet.</span>
                  ) : (
                    recentDeposits.map((d) => (
                      <div key={d.id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate text-ink">
                          {potName(d.potId)} <span className="text-muted">· {formatDate(parseISODate(d.date))}</span>
                        </span>
                        <span className={`shrink-0 font-semibold ${d.amount >= 0 ? 'text-[var(--color-ok-fg)]' : 'text-alert'}`}>
                          {d.amount >= 0 ? '+' : '−'}
                          {formatMoney(d.amount, settings.currency, 0)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>
          </>
        )}
      </div>

      <Modal open={billFormOpen} onClose={() => setBillFormOpen(false)} title={editingBill ? 'Edit bill' : 'Add a bill'}>
        <BillForm
          bill={editingBill}
          accounts={accounts}
          categories={categories}
          onSave={handleSaveBill}
          onCancel={() => setBillFormOpen(false)}
          onAddAccount={addAccount}
          onAddCategory={addCategory}
        />
        {editingBill && (
          <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
            <button
              onClick={() => {
                toggleBillActive(editingBill.id);
                setBillFormOpen(false);
                setEditingBill(null);
              }}
              className="text-xs font-medium text-muted hover:text-ink"
            >
              {editingBill.active ? 'Pause this bill' : 'Resume this bill'}
            </button>
            <button onClick={() => handleDeleteBill(editingBill.id)} className="text-xs font-medium text-alert hover:underline">
              Delete bill
            </button>
          </div>
        )}
      </Modal>

      <Modal open={potFormOpen} onClose={() => setPotFormOpen(false)} title={editingPot ? 'Edit pot' : 'New pot'}>
        <NewPotForm
          pot={editingPot}
          onSave={handleSavePot}
          onCancel={() => setPotFormOpen(false)}
          onDelete={editingPot ? handleDeletePot : undefined}
        />
      </Modal>

      <Modal open={logSavingOpen} onClose={() => setLogSavingOpen(false)} title="Log a saving">
        <LogSavingForm pots={pots} initialPotId={logSavingPotId} onSave={handleSaveDeposit} onCancel={() => setLogSavingOpen(false)} />
      </Modal>

      <Modal open={adjustOpen} onClose={() => setAdjustOpen(false)} title="Adjust balance">
        {adjustingPot && (
          <AdjustBalanceForm
            potName={adjustingPot.name}
            currentSaved={potSaved(adjustingPot.id, deposits)}
            currency={settings.currency}
            onSave={handleAdjustBalance}
            onCancel={() => setAdjustOpen(false)}
          />
        )}
      </Modal>

      <Modal open={accountsOpen} onClose={() => setAccountsOpen(false)} title="Accounts">
        <AccountManager accounts={accounts} billCounts={billCounts} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />
      </Modal>

      <Modal open={categoriesOpen} onClose={() => setCategoriesOpen(false)} title="Categories">
        <CategoryManager
          categories={categories}
          billCounts={categoryBillCounts}
          onAdd={addCategory}
          onUpdate={updateCategory}
          onDelete={deleteCategory}
        />
      </Modal>

      <Modal open={bulkImportOpen} onClose={() => setBulkImportOpen(false)} title="Bulk import bills">
        <BulkImportForm onImport={handleImportBills} onCancel={() => setBulkImportOpen(false)} />
      </Modal>
    </div>
  );
}

export default App;
