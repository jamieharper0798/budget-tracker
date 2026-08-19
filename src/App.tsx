import { useMemo, useState } from 'react';
import { useBudget } from './hooks/useBudget';
import type { NewBillInput } from './hooks/useBudget';
import { enrichBills } from './lib/derive';
import type { EnrichedBill } from './lib/derive';
import { SummaryCards } from './components/SummaryCards';
import { UpcomingList } from './components/UpcomingList';
import { BreakdownBars } from './components/BreakdownBars';
import type { BreakdownRow } from './components/BreakdownBars';
import { BillForm } from './components/BillForm';
import { BillList } from './components/BillList';
import { AccountManager } from './components/AccountManager';
import { FilterBar } from './components/FilterBar';
import type { StatusFilter } from './components/FilterBar';
import { Modal } from './components/Modal';
import { InstallButton } from './components/InstallButton';
import { UpdateToast } from './components/UpdateToast';

const CURRENCIES = ['$', '£', '€', '¥', '₹', 'A$', 'C$'];

function App() {
  const {
    bills,
    accounts,
    categories,
    settings,
    addBill,
    updateBill,
    deleteBill,
    toggleBillActive,
    addAccount,
    updateAccount,
    deleteAccount,
    addCategory,
    updateSettings,
  } = useBudget();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<EnrichedBill | null>(null);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [accountFilter, setAccountFilter] = useState<string | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');

  const enriched = useMemo(() => enrichBills(bills), [bills]);

  const filtered = useMemo(() => {
    return enriched.filter((b) => {
      if (status === 'active' && !b.active) return false;
      if (status === 'paused' && b.active) return false;
      if (accountFilter !== 'all' && b.accountId !== accountFilter) return false;
      if (categoryFilter !== 'all' && b.categoryId !== categoryFilter) return false;
      if (search.trim() && !b.name.toLowerCase().includes(search.trim().toLowerCase())) return false;
      return true;
    });
  }, [enriched, status, accountFilter, categoryFilter, search]);

  const categoryRows: BreakdownRow[] = useMemo(() => {
    return categories.map((c) => ({
      id: c.id,
      label: c.name,
      icon: c.icon,
      color: c.color,
      monthly: enriched
        .filter((b) => b.active && b.categoryId === c.id)
        .reduce((sum, b) => sum + b.monthly, 0),
    }));
  }, [categories, enriched]);

  const accountRows: BreakdownRow[] = useMemo(() => {
    return accounts.map((a) => ({
      id: a.id,
      label: a.name,
      color: a.color,
      monthly: enriched
        .filter((b) => b.active && b.accountId === a.id)
        .reduce((sum, b) => sum + b.monthly, 0),
    }));
  }, [accounts, enriched]);

  const billCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const b of bills) {
      if (!b.accountId) continue;
      counts[b.accountId] = (counts[b.accountId] ?? 0) + 1;
    }
    return counts;
  }, [bills]);

  const openAddForm = () => {
    setEditingBill(null);
    setFormOpen(true);
  };

  const openEditForm = (bill: EnrichedBill) => {
    setEditingBill(bill);
    setFormOpen(true);
  };

  const handleSave = (input: NewBillInput) => {
    if (editingBill) updateBill(editingBill.id, input);
    else addBill(input);
    setFormOpen(false);
    setEditingBill(null);
  };

  const handleDelete = (id: string) => {
    deleteBill(id);
    if (editingBill?.id === id) {
      setFormOpen(false);
      setEditingBill(null);
    }
  };

  return (
    <div className="bg-ledger min-h-screen">
      <UpdateToast />

      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-24 pt-8 sm:px-6">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">💰</span>
            <h1 className="font-display text-xl font-bold text-white">Ledger</h1>
          </div>
          <div className="flex items-center gap-2">
            <InstallButton />
            <div className="relative">
              <button
                onClick={() => setCurrencyOpen((v) => !v)}
                className="rounded-full p-2 text-sm text-white/50 transition hover:bg-white/10 hover:text-white"
                title="Currency"
              >
                {settings.currency}
              </button>
              {currencyOpen && (
                <div className="glass animate-rise absolute right-0 top-full z-10 mt-2 grid w-40 grid-cols-4 gap-1 rounded-xl p-2">
                  {CURRENCIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        updateSettings({ currency: c });
                        setCurrencyOpen(false);
                      }}
                      className={`rounded-lg py-1.5 text-xs font-medium ${
                        settings.currency === c ? 'bg-emerald-500/20 text-emerald-300' : 'text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setAccountsOpen(true)}
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              title="Manage accounts"
              aria-label="Manage accounts"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="2" y="6" width="20" height="13" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 10h20" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6">
          <SummaryCards bills={enriched} currency={settings.currency} />

          <section>
            <h2 className="font-display mb-2 text-sm font-semibold text-white/70">Upcoming payments</h2>
            <UpcomingList bills={enriched} accounts={accounts} categories={categories} currency={settings.currency} />
          </section>

          {bills.length > 0 && (
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <BreakdownBars title="By category" rows={categoryRows} currency={settings.currency} />
              <BreakdownBars title="By account" rows={accountRows} currency={settings.currency} />
            </section>
          )}

          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-semibold text-white/70">All bills</h2>
              <button
                onClick={openAddForm}
                className="rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 active:scale-95"
              >
                + Add bill
              </button>
            </div>

            <FilterBar
              search={search}
              onSearchChange={setSearch}
              status={status}
              onStatusChange={setStatus}
              accountId={accountFilter}
              onAccountChange={setAccountFilter}
              categoryId={categoryFilter}
              onCategoryChange={setCategoryFilter}
              accounts={accounts}
              categories={categories}
            />

            <BillList
              bills={filtered}
              accounts={accounts}
              categories={categories}
              currency={settings.currency}
              onEdit={openEditForm}
              onDelete={handleDelete}
              onToggleActive={toggleBillActive}
            />
          </section>
        </main>
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title={editingBill ? 'Edit bill' : 'Add a bill'}>
        <BillForm
          bill={editingBill}
          accounts={accounts}
          categories={categories}
          onSave={handleSave}
          onCancel={() => setFormOpen(false)}
          onAddAccount={addAccount}
          onAddCategory={addCategory}
        />
      </Modal>

      <Modal open={accountsOpen} onClose={() => setAccountsOpen(false)} title="Accounts">
        <AccountManager
          accounts={accounts}
          billCounts={billCounts}
          onAdd={addAccount}
          onUpdate={updateAccount}
          onDelete={deleteAccount}
        />
      </Modal>
    </div>
  );
}

export default App;
