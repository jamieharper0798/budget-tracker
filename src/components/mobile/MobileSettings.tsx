import { useRef, useState } from 'react';
import type { BudgetState, Settings } from '../../types';

const CURRENCIES = ['$', '£', '€', '¥', '₹', 'A$', 'C$'];

interface Props {
  email: string | null;
  settings: Settings;
  onUpdateSettings: (settings: Partial<Settings>) => void;
  onManageAccounts: () => void;
  onManageCategories: () => void;
  onLogOut: () => void;
  exportState: BudgetState;
  onImportState: (next: BudgetState) => void;
}

function isBudgetStateShaped(value: unknown): value is BudgetState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.bills) &&
    Array.isArray(v.accounts) &&
    Array.isArray(v.categories) &&
    Array.isArray(v.pots) &&
    Array.isArray(v.deposits) &&
    Array.isArray(v.payments) &&
    typeof v.settings === 'object' &&
    typeof v.income === 'object'
  );
}

export function MobileSettings({ email, settings, onUpdateSettings, onManageAccounts, onManageCategories, onLogOut, exportState, onImportState }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importedAt, setImportedAt] = useState<number | null>(null);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(exportState, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledgerly-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (file: File) => {
    setImportError('');
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!isBudgetStateShaped(parsed)) {
        setImportError("That file doesn't look like a Ledgerly backup.");
        return;
      }
      onImportState(parsed);
      setImportedAt(Date.now());
    } catch {
      setImportError('Could not read that file as JSON.');
    }
  };

  return (
    <main className="flex flex-col gap-4 px-4 pt-1" style={{ paddingTop: 'calc(env(safe-area-inset-top, 20px) + 14px)', paddingBottom: 'calc(60px + env(safe-area-inset-bottom, 0px) + 24px)' }}>
      <h1 className="px-1 font-display text-[34px] font-semibold tracking-tight text-ink">Settings</h1>

      <section className="card flex flex-col gap-1">
        <span className="text-[13px] font-medium text-muted">Signed in as</span>
        <span className="truncate text-sm font-semibold text-ink">{email ?? 'Unknown'}</span>
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-[16px] font-semibold text-ink">Currency</h2>
        <div className="grid grid-cols-4 gap-2">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              onClick={() => onUpdateSettings({ currency: c })}
              className={`min-h-11 rounded-xl text-sm font-semibold ${settings.currency === c ? 'bg-accent text-ink' : 'bg-surface-2 text-muted'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      <section className="card flex flex-col">
        <button onClick={onManageAccounts} className="flex min-h-13 items-center justify-between py-1 text-left text-sm font-semibold text-ink">
          Manage accounts
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        <button onClick={onManageCategories} className="flex min-h-13 items-center justify-between border-t border-line py-1 text-left text-sm font-semibold text-ink">
          Manage categories
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
        </button>
      </section>

      <section className="card flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-[16px] font-semibold text-ink">Backup</h2>
          <span className="text-[13px] text-muted">Export your data as a JSON file, or restore from one.</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleExport} className="min-h-12 rounded-xl bg-surface-2 text-sm font-semibold text-ink">
            Export JSON
          </button>
          <button onClick={() => fileInput.current?.click()} className="min-h-12 rounded-xl bg-surface-2 text-sm font-semibold text-ink">
            Import JSON
          </button>
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="application/json"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleImportFile(file);
            e.target.value = '';
          }}
        />
        {importError && <p className="text-xs text-alert">{importError}</p>}
        {importedAt && !importError && <p className="text-xs text-[var(--color-ok-fg)]">Backup imported.</p>}
      </section>

      <button onClick={onLogOut} className="card flex min-h-13 items-center justify-center text-sm font-semibold text-alert">
        Log out
      </button>
    </main>
  );
}
