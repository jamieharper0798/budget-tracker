import { useEffect, useMemo, useState } from 'react';
import { useBudget } from '../../hooks/useBudget';
import type { NewBillInput } from '../../hooks/useBudget';
import { enrichBills } from '../../lib/derive';
import type { EnrichedBill } from '../../lib/derive';
import { dueDateInMonth, dueDayInMonth, monthlyCost, todayUTC } from '../../lib/frequency';
import { potSaved, savingsHistory, totalSaved } from '../../lib/savings';
import type { SavingsPot } from '../../types';
import { BillForm } from '../BillForm';
import { NewPotForm } from '../NewPotForm';
import { LogSavingForm } from '../LogSavingForm';
import { AdjustBalanceForm } from '../AdjustBalanceForm';
import { AccountManager } from '../AccountManager';
import { CategoryManager } from '../CategoryManager';
import { BottomTabBar } from './BottomTabBar';
import { MobileHome } from './MobileHome';
import { MobileBills } from './MobileBills';
import { MobileSavings } from './MobileSavings';
import { MobileSettings } from './MobileSettings';
import { MobileSheet } from './MobileSheet';

type Screen = 'home' | 'bills' | 'savings' | 'settings';

type SheetState =
  | { kind: 'bill'; bill: EnrichedBill | null }
  | { kind: 'pot'; pot: SavingsPot | null }
  | { kind: 'logSaving'; potId: string | null }
  | { kind: 'adjust'; pot: SavingsPot }
  | { kind: 'accounts' }
  | { kind: 'categories' }
  | null;

interface Props {
  uid: string;
  email: string | null;
  onLogOut: () => void;
}

function LoadingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg">
      <p className="text-sm text-muted">Syncing…</p>
    </div>
  );
}

export function MobileApp({ uid, email, onLogOut }: Props) {
  const {
    ready, bills, accounts, categories, settings, income, pots, deposits, payments, plannedTransfers,
    addBill, updateBill, deleteBill,
    addAccount, updateAccount, deleteAccount,
    addCategory, updateCategory, deleteCategory,
    updateSettings, togglePaid,
    addPot, updatePot, deletePot, addDeposit, adjustPotBalance,
    replaceState,
  } = useBudget(uid);

  const today = todayUTC();
  const [screen, setScreen] = useState<Screen>('home');
  const [year, setYear] = useState(today.getUTCFullYear());
  const [month, setMonth] = useState(today.getUTCMonth());
  const [sheet, setSheet] = useState<SheetState>(null);

  useEffect(() => {
    navigator.storage?.persist?.().catch(() => {});
  }, []);

  useEffect(() => {
    const prev = document.body.style.overscrollBehaviorY;
    document.body.style.overscrollBehaviorY = 'none';
    return () => {
      document.body.style.overscrollBehaviorY = prev;
    };
  }, []);

  const period = `${year}-${String(month + 1).padStart(2, '0')}`;
  const isCurrentMonth = year === today.getUTCFullYear() && month === today.getUTCMonth();

  const enriched = useMemo(() => enrichBills(bills), [bills]);
  const activeBills = useMemo(() => enriched.filter((b) => b.active), [enriched]);
  const billsTotal = useMemo(() => activeBills.reduce((sum, b) => sum + b.monthly, 0), [activeBills]);
  const savingsTotal = useMemo(() => pots.reduce((sum, p) => sum + p.monthlyContribution, 0), [pots]);
  const monthlyIncome = monthlyCost(income.amount, income.frequency, income.customIntervalDays);
  const leftover = monthlyIncome - billsTotal - savingsTotal;

  const billRows = useMemo(
    () =>
      enriched
        .map((bill) => {
          const dueDate = dueDateInMonth(bill.anchorDate, bill.frequency, bill.customIntervalDays, year, month);
          const paid = payments.some((p) => p.billId === bill.id && p.period === period);
          const overdue = isCurrentMonth && !paid && dueDayInMonth(bill.anchorDate, year, month) < today.getUTCDate();
          return { bill, dueDate, paid, overdue };
        })
        .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime()),
    [enriched, payments, period, year, month, isCurrentMonth, today],
  );
  const activeBillRows = useMemo(() => billRows.filter((r) => r.bill.active), [billRows]);
  const paidAmt = activeBillRows.filter((r) => r.paid).reduce((sum, r) => sum + r.bill.monthly, 0);
  const paidCount = activeBillRows.filter((r) => r.paid).length;
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

  const potsWithSaved = useMemo(() => pots.map((p) => ({ pot: p, saved: potSaved(p.id, deposits) })), [pots, deposits]);
  const growth = useMemo(() => savingsHistory(deposits, 6), [deposits]);
  const growthDelta = growth.length > 0 ? growth[growth.length - 1].total - growth[0].total : 0;
  const recentDeposits = deposits.slice(0, 5);
  const totalSavedAll = totalSaved(deposits);
  const potName = (potId: string) => pots.find((p) => p.id === potId)?.name ?? 'Pot';

  const billCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      if (b.accountId) counts[b.accountId] = (counts[b.accountId] ?? 0) + 1;
    }
    return counts;
  }, [bills]);
  const categoryBillCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      if (b.categoryId) counts[b.categoryId] = (counts[b.categoryId] ?? 0) + 1;
    }
    return counts;
  }, [bills]);

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

  const closeSheet = () => setSheet(null);

  const handleSaveBill = (input: NewBillInput) => {
    if (sheet?.kind === 'bill' && sheet.bill) updateBill(sheet.bill.id, input);
    else addBill(input);
    closeSheet();
  };
  const handleDeleteBill = () => {
    if (sheet?.kind === 'bill' && sheet.bill) deleteBill(sheet.bill.id);
    closeSheet();
  };
  const handleSavePot = (input: Omit<SavingsPot, 'id' | 'createdAt'>) => {
    if (sheet?.kind === 'pot' && sheet.pot) updatePot(sheet.pot.id, input);
    else addPot(input);
    closeSheet();
  };
  const handleDeletePot = () => {
    if (sheet?.kind === 'pot' && sheet.pot) deletePot(sheet.pot.id);
    closeSheet();
  };
  const handleSaveDeposit = (potId: string, amount: number, date: string, note: string) => {
    addDeposit(potId, amount, date, note);
    closeSheet();
  };
  const handleAdjust = (newTotal: number, date: string, note: string) => {
    if (sheet?.kind === 'adjust') adjustPotBalance(sheet.pot.id, newTotal, date, note);
    closeSheet();
  };

  if (!ready) return <LoadingScreen />;

  const sheetTitle =
    sheet?.kind === 'bill' ? (sheet.bill ? 'Edit bill' : 'New bill')
    : sheet?.kind === 'pot' ? (sheet.pot ? 'Edit pot' : 'New pot')
    : sheet?.kind === 'logSaving' ? 'Log a saving'
    : sheet?.kind === 'adjust' ? 'Adjust balance'
    : sheet?.kind === 'accounts' ? 'Accounts'
    : sheet?.kind === 'categories' ? 'Categories'
    : '';

  return (
    <div className="min-h-dvh bg-bg">
      {screen === 'home' && (
        <MobileHome
          today={today}
          year={year}
          month={month}
          prevMonth={prevMonth}
          nextMonth={nextMonth}
          email={email}
          monthlyIncome={monthlyIncome}
          billsTotal={billsTotal}
          savingsTotal={savingsTotal}
          leftover={leftover}
          remaining={remaining}
          paidCount={paidCount}
          activeBillCount={activeBillRows.length}
          nextUp={nextUp}
          upcoming={upcoming}
          potsWithSaved={potsWithSaved}
          currency={settings.currency}
          onAddBill={() => setSheet({ kind: 'bill', bill: null })}
          onLogSaving={() => setSheet({ kind: 'logSaving', potId: null })}
          onTogglePaid={(billId) => togglePaid(billId, period)}
          onGo={setScreen}
        />
      )}
      {screen === 'bills' && (
        <MobileBills
          bills={activeBills}
          categories={categories}
          accounts={accounts}
          currency={settings.currency}
          monthlyIncome={monthlyIncome}
          payDay={settings.payDay}
          onEditBill={(bill) => setSheet({ kind: 'bill', bill })}
        />
      )}
      {screen === 'savings' && (
        <MobileSavings
          potsWithSaved={potsWithSaved}
          growth={growth}
          growthDelta={growthDelta}
          totalSavedAll={totalSavedAll}
          recentDeposits={recentDeposits}
          currency={settings.currency}
          potName={potName}
          onNewPot={() => setSheet({ kind: 'pot', pot: null })}
          onLogSaving={(potId) => setSheet({ kind: 'logSaving', potId })}
          onEditPot={(pot) => setSheet({ kind: 'pot', pot })}
          onAdjust={(pot) => setSheet({ kind: 'adjust', pot })}
        />
      )}
      {screen === 'settings' && (
        <MobileSettings
          email={email}
          settings={settings}
          onUpdateSettings={updateSettings}
          onManageAccounts={() => setSheet({ kind: 'accounts' })}
          onManageCategories={() => setSheet({ kind: 'categories' })}
          onLogOut={onLogOut}
          exportState={{ bills, accounts, categories, settings, income, pots, deposits, payments, plannedTransfers }}
          onImportState={replaceState}
        />
      )}

      <BottomTabBar active={screen} onGo={setScreen} onAddBill={() => setSheet({ kind: 'bill', bill: null })} />

      <MobileSheet open={sheet !== null} onClose={closeSheet} title={sheetTitle}>
        {sheet?.kind === 'bill' && (
          <BillForm
            bill={sheet.bill}
            accounts={accounts}
            categories={categories}
            onSave={handleSaveBill}
            onCancel={closeSheet}
            onAddAccount={addAccount}
            onAddCategory={addCategory}
          />
        )}
        {sheet?.kind === 'bill' && sheet.bill && (
          <button onClick={handleDeleteBill} className="mt-3 w-full text-center text-xs font-medium text-alert">
            Delete bill
          </button>
        )}
        {sheet?.kind === 'pot' && (
          <NewPotForm pot={sheet.pot} onSave={handleSavePot} onCancel={closeSheet} onDelete={sheet.pot ? handleDeletePot : undefined} />
        )}
        {sheet?.kind === 'logSaving' && <LogSavingForm pots={pots} initialPotId={sheet.potId} onSave={handleSaveDeposit} onCancel={closeSheet} />}
        {sheet?.kind === 'adjust' && (
          <AdjustBalanceForm
            potName={sheet.pot.name}
            currentSaved={potSaved(sheet.pot.id, deposits)}
            currency={settings.currency}
            onSave={handleAdjust}
            onCancel={closeSheet}
          />
        )}
        {sheet?.kind === 'accounts' && (
          <AccountManager accounts={accounts} billCounts={billCounts} onAdd={addAccount} onUpdate={updateAccount} onDelete={deleteAccount} />
        )}
        {sheet?.kind === 'categories' && (
          <CategoryManager categories={categories} billCounts={categoryBillCounts} onAdd={addCategory} onUpdate={updateCategory} onDelete={deleteCategory} />
        )}
      </MobileSheet>
    </div>
  );
}
