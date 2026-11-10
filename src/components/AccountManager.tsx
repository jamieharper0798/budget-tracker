import { useState } from 'react';
import type { Account } from '../types';
import { ACCOUNT_COLORS } from '../lib/categories';

interface Props {
  accounts: Account[];
  billCounts: Record<string, number>;
  onAdd: (name: string, color: string) => void;
  onUpdate: (id: string, name: string, color: string) => void;
  onDelete: (id: string) => void;
}

export function AccountManager({ accounts, billCounts, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(ACCOUNT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const startEdit = (account: Account) => {
    setEditingId(account.id);
    setEditingName(account.name);
  };

  const saveEdit = (account: Account) => {
    if (editingName.trim()) onUpdate(account.id, editingName, account.color);
    setEditingId(null);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {accounts.length === 0 && (
          <p className="py-2 text-center text-sm text-muted">No accounts yet — add one below.</p>
        )}
        {accounts.map((account) => (
          <div key={account.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2.5">
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
            <span className="shrink-0 text-[11px] text-muted">
              {billCounts[account.id] ?? 0} bill{(billCounts[account.id] ?? 0) === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => onDelete(account.id)}
              className="shrink-0 rounded-full p-1.5 text-muted hover:bg-warn-bg hover:text-alert"
              aria-label={`Delete ${account.name}`}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-2 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Add account</p>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20"
            placeholder="e.g. Chase Checking, Amex"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                onAdd(newName, newColor);
                setNewName('');
              }
            }}
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onAdd(newName, newColor);
              setNewName('');
            }}
            className="shrink-0 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
          >
            Add
          </button>
        </div>
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
