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
          <p className="py-2 text-center text-sm text-white/40">No accounts yet — add one below.</p>
        )}
        {accounts.map((account) => (
          <div key={account.id} className="glass flex items-center gap-2 rounded-xl p-2.5">
            <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: account.color }} />
            {editingId === account.id ? (
              <input
                autoFocus
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-sm text-white outline-none focus:border-emerald-400/50"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => saveEdit(account)}
                onKeyDown={(e) => e.key === 'Enter' && saveEdit(account)}
              />
            ) : (
              <button className="min-w-0 flex-1 truncate text-left text-sm text-white" onClick={() => startEdit(account)}>
                {account.name}
              </button>
            )}
            <span className="shrink-0 text-[11px] text-white/35">
              {billCounts[account.id] ?? 0} bill{(billCounts[account.id] ?? 0) === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => onDelete(account.id)}
              className="shrink-0 rounded-full p-1.5 text-white/30 hover:bg-rose-500/10 hover:text-rose-400"
              aria-label={`Delete ${account.name}`}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="glass rounded-xl p-3">
        <p className="mb-2 text-xs font-medium text-white/50">Add account</p>
        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
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
            className="shrink-0 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-semibold text-white"
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
              className={`h-5 w-5 rounded-full ring-2 ${newColor === c ? 'ring-white' : 'ring-transparent'}`}
              style={{ backgroundColor: c }}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
