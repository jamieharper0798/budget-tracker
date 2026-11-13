import { useState } from 'react';
import type { Account } from '../types';
import { ACCOUNT_COLORS } from '../lib/categories';

interface Props {
  accounts: Account[];
  billCounts: Record<string, number>;
  onAdd: (name: string, color: string, parentAccountId?: string | null) => void;
  onUpdate: (id: string, name: string, color: string, parentAccountId?: string | null) => void;
  onDelete: (id: string) => void;
}

export function AccountManager({ accounts, billCounts, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(ACCOUNT_COLORS[0]);
  const [newParentId, setNewParentId] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const topLevel = accounts.filter((a) => !a.parentAccountId);
  const childrenOf = (parentId: string) => accounts.filter((a) => a.parentAccountId === parentId);

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditingName(account.name);
  };

  const saveEdit = (account: Account) => {
    if (editingName.trim()) onUpdate(account.id, editingName, account.color);
    setEditingId(null);
  };

  const handleDelete = (account: Account) => {
    const count = billCounts[account.id] ?? 0;
    if (count > 0) {
      window.alert(`Reassign the ${count} bill${count === 1 ? '' : 's'} on ${account.name} to another account first, then delete it.`);
      return;
    }
    onDelete(account.id);
  };

  const renderRow = (account: Account, indent: boolean) => (
    <div key={account.id} className={`flex items-center gap-2 rounded-xl bg-surface-2 p-2.5 ${indent ? 'ml-6' : ''}`}>
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: account.color }} />
      {editingId === account.id ? (
        <input
          autoFocus
          className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink outline-none focus:border-ink/20"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onBlur={() => saveEdit(account)}
          onKeyDown={(e) => e.key === 'Enter' && saveEdit(account)}
        />
      ) : (
        <button className="min-w-0 flex-1 truncate text-left text-sm text-ink" onClick={() => startEdit(account)}>
          {account.name}
        </button>
      )}
      {!indent && (childrenOf(account.id).length === 0 ? (
        <select
          value={account.parentAccountId ?? ''}
          onChange={(e) => onUpdate(account.id, account.name, account.color, e.target.value || null)}
          className="shrink-0 rounded-lg border border-line bg-surface px-1.5 py-1 text-[11px] text-muted outline-none"
          aria-label={`Move ${account.name} under another account`}
        >
          <option value="">Top-level</option>
          {topLevel
            .filter((a) => a.id !== account.id)
            .map((a) => (
              <option key={a.id} value={a.id}>
                Under {a.name}
              </option>
            ))}
        </select>
      ) : (
        <span className="shrink-0 text-[11px] text-muted">Has sub-accounts</span>
      ))}
      <span className="shrink-0 text-[11px] text-muted">
        {billCounts[account.id] ?? 0} bill{(billCounts[account.id] ?? 0) === 1 ? '' : 's'}
      </span>
      <button
        onClick={() => handleDelete(account)}
        className="shrink-0 rounded-full p-1.5 text-muted hover:bg-warn-bg hover:text-alert"
        aria-label={`Delete ${account.name}`}
      >
        🗑
      </button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {accounts.length === 0 && (
          <p className="py-2 text-center text-sm text-muted">No accounts yet — add one below.</p>
        )}
        {topLevel.map((account) => (
          <div key={account.id} className="flex flex-col gap-2">
            {renderRow(account, false)}
            {childrenOf(account.id).map((child) => renderRow(child, true))}
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-2 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Add account</p>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20"
            placeholder="e.g. Chase Checking, Subscription Pot"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                onAdd(newName, newColor, newParentId || null);
                setNewName('');
              }
            }}
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onAdd(newName, newColor, newParentId || null);
              setNewName('');
            }}
            className="shrink-0 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
          >
            Add
          </button>
        </div>
        {topLevel.length > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-muted">Nest under</span>
            <select
              value={newParentId}
              onChange={(e) => setNewParentId(e.target.value)}
              className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none"
            >
              <option value="">Top-level account</option>
              {topLevel.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="mt-2 flex gap-1.5">
          {ACCOUNT_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewColor(c)}
              className={`h-5 w-5 rounded-full ring-2 ring-offset-1 ring-offset-surface-2 ${newColor === c ? 'ring-ink' : 'ring-transparent'}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
