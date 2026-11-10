import { useState } from 'react';
import type { Frequency } from '../types';
import { FREQUENCY_LABELS } from '../lib/frequency';

interface ParsedBill {
  name: string;
  amount: number;
  accountName: string | null;
  categoryName: string | null;
  frequency?: Frequency;
}

interface Props {
  onImport: (entries: ParsedBill[]) => void;
  onCancel: () => void;
}

const inputClass =
  'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20 focus:bg-surface';

const PLACEHOLDER = `Mortgage Payment, 894, Joint Account, Housing & Rent
Groceries, 175, Joint Account
Spotify, 9, Joint Account, Streaming & Media`;

function parseLines(text: string, frequency: Frequency): { entries: ParsedBill[]; errors: string[] } {
  const entries: ParsedBill[] = [];
  const errors: string[] = [];

  text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .forEach((line, i) => {
      const parts = line.split(',').map((p) => p.trim());
      const [name, amountStr, accountName, categoryName] = parts;
      const amount = Number(amountStr);
      if (!name || !Number.isFinite(amount) || amount <= 0) {
        errors.push(`Line ${i + 1}: expected "Name, Amount, Account, Category" — got "${line}"`);
        return;
      }
      entries.push({
        name,
        amount,
        accountName: accountName || null,
        categoryName: categoryName || null,
        frequency,
      });
    });

  return { entries, errors };
}

export function BulkImportForm({ onImport, onCancel }: Props) {
  const [text, setText] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [errors, setErrors] = useState<string[]>([]);

  const handleImport = () => {
    const { entries, errors: parseErrors } = parseLines(text, frequency);
    if (entries.length === 0) {
      setErrors(parseErrors.length > 0 ? parseErrors : ['Paste at least one bill first.']);
      return;
    }
    onImport(entries);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted">
        One bill per line: <code className="text-ink">Name, Amount, Account, Category</code> — account and category
        are optional, and any name that doesn't exist yet is created automatically.
      </p>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Frequency for all of these</label>
        <select className={inputClass} value={frequency} onChange={(e) => setFrequency(e.target.value as Frequency)}>
          {(Object.keys(FREQUENCY_LABELS) as Frequency[]).map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted">Bills</label>
        <textarea
          className={`${inputClass} min-h-40 resize-y font-mono text-xs`}
          placeholder={PLACEHOLDER}
          value={text}
          onChange={(e) => setText(e.target.value)}
          autoFocus
        />
      </div>

      {errors.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl bg-warn-bg p-3">
          {errors.map((err, i) => (
            <p key={i} className="text-xs text-warn-fg">
              {err}
            </p>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-line py-2.5 text-sm font-semibold text-muted hover:bg-surface-2"
        >
          Cancel
        </button>
        <button type="button" onClick={handleImport} className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-ink">
          Import bills
        </button>
      </div>
    </div>
  );
}
