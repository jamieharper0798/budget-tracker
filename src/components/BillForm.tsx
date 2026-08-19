import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Account, Bill, Category, Frequency } from '../types';
import type { NewBillInput } from '../hooks/useBudget';
import { FREQUENCY_LABELS, todayUTC, toISODate } from '../lib/frequency';
import { ACCOUNT_COLORS, CATEGORY_COLORS } from '../lib/categories';

interface Props {
  bill: Bill | null;
  accounts: Account[];
  categories: Category[];
  onSave: (input: NewBillInput) => void;
  onCancel: () => void;
  onAddAccount: (name: string, color: string) => string;
  onAddCategory: (name: string, icon: string, color: string) => string;
}

const FREQUENCIES: Frequency[] = ['weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom'];

export function BillForm({ bill, accounts, categories, onSave, onCancel, onAddAccount, onAddCategory }: Props) {
  const [name, setName] = useState(bill?.name ?? '');
  const [amount, setAmount] = useState(bill ? String(bill.amount) : '');
  const [frequency, setFrequency] = useState<Frequency>(bill?.frequency ?? 'monthly');
  const [customDays, setCustomDays] = useState(bill?.customIntervalDays ? String(bill.customIntervalDays) : '30');
  const [anchorDate, setAnchorDate] = useState(bill?.anchorDate ?? toISODate(todayUTC()));
  const [accountId, setAccountId] = useState<string | null>(bill?.accountId ?? accounts[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<string | null>(bill?.categoryId ?? categories[0]?.id ?? null);
  const [notes, setNotes] = useState(bill?.notes ?? '');

  const [addingAccount, setAddingAccount] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountColor, setNewAccountColor] = useState(ACCOUNT_COLORS[0]);

  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🗂️');
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);

  const [error, setError] = useState('');

  const handleAddAccount = () => {
    if (!newAccountName.trim()) return;
    const id = onAddAccount(newAccountName, newAccountColor);
    setAccountId(id);
    setNewAccountName('');
    setAddingAccount(false);
  };

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    const id = onAddCategory(newCategoryName, newCategoryIcon || '🗂️', newCategoryColor);
    setCategoryId(id);
    setNewCategoryName('');
    setAddingCategory(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const parsedAmount = Number(amount);
    if (!trimmedName) return setError('Give this bill a name.');
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return setError('Enter an amount greater than 0.');
    if (!anchorDate) return setError('Pick a payment date.');
    const parsedCustomDays = Number(customDays);
    if (frequency === 'custom' && (!Number.isFinite(parsedCustomDays) || parsedCustomDays <= 0)) {
      return setError('Enter a valid number of days.');
    }

    onSave({
      name: trimmedName,
      amount: parsedAmount,
      accountId,
      categoryId,
      frequency,
      customIntervalDays: frequency === 'custom' ? Math.round(parsedCustomDays) : null,
      anchorDate,
      notes: notes.trim(),
    });
  };

  const inputClass =
    'w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50 focus:bg-white/8';

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Name</label>
        <input
          className={inputClass}
          placeholder="e.g. Netflix, Rent, Car insurance"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">Amount</label>
          <input
            className={inputClass}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-white/50">
            {frequency === 'monthly' || frequency === 'quarterly' || frequency === 'yearly'
              ? 'Next payment date'
              : 'First payment date'}
          </label>
          <input
            className={inputClass}
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Frequency</label>
        <div className="grid grid-cols-3 gap-1.5">
          {FREQUENCIES.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFrequency(f)}
              className={`rounded-lg px-2 py-2 text-xs font-medium transition ${
                frequency === f ? 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              {FREQUENCY_LABELS[f]}
            </button>
          ))}
        </div>
        {frequency === 'custom' && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-white/50">Every</span>
            <input
              className={`${inputClass} w-20`}
              type="number"
              min="1"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
            />
            <span className="text-xs text-white/50">days</span>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Account it's paid from</label>
        {!addingAccount ? (
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={accountId ?? ''}
              onChange={(e) => setAccountId(e.target.value || null)}
            >
              <option value="">No account set</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingAccount(true)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/60 hover:bg-white/10"
            >
              + New
            </button>
          </div>
        ) : (
          <div className="glass rounded-xl p-3">
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="Account name"
                value={newAccountName}
                onChange={(e) => setNewAccountName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddAccount}
                className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingAccount(false)}
                className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/50"
              >
                Cancel
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {ACCOUNT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewAccountColor(c)}
                  className={`h-5 w-5 rounded-full ring-2 ${newAccountColor === c ? 'ring-white' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Category</label>
        {!addingCategory ? (
          <div className="flex items-center gap-2">
            <select
              className={inputClass}
              value={categoryId ?? ''}
              onChange={(e) => setCategoryId(e.target.value || null)}
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-medium text-white/60 hover:bg-white/10"
            >
              + New
            </button>
          </div>
        ) : (
          <div className="glass rounded-xl p-3">
            <div className="flex gap-2">
              <input
                className={`${inputClass} w-14 text-center`}
                placeholder="🗂️"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                maxLength={2}
              />
              <input
                className={inputClass}
                placeholder="Category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2.5 text-xs font-semibold text-white"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setAddingCategory(false)}
                className="shrink-0 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-white/50"
              >
                Cancel
              </button>
            </div>
            <div className="mt-2 flex gap-1.5">
              {CATEGORY_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewCategoryColor(c)}
                  className={`h-5 w-5 rounded-full ring-2 ${newCategoryColor === c ? 'ring-white' : 'ring-transparent'}`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-white/50">Notes (optional)</label>
        <textarea
          className={`${inputClass} min-h-16 resize-none`}
          placeholder="Plan details, cancellation link, etc."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}

      <div className="mt-1 flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-white/10 py-2.5 text-sm font-semibold text-white/60 hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20"
        >
          {bill ? 'Save changes' : 'Add bill'}
        </button>
      </div>
    </form>
  );
}
