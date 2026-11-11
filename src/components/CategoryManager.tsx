import { useState } from 'react';
import type { Category } from '../types';
import { CATEGORY_COLORS } from '../lib/categories';

interface Props {
  categories: Category[];
  billCounts: Record<string, number>;
  onAdd: (name: string, icon: string, color: string) => void;
  onUpdate: (id: string, name: string, icon: string, color: string) => void;
  onDelete: (id: string) => void;
}

export function CategoryManager({ categories, billCounts, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState('🗂️');
  const [newColor, setNewColor] = useState(CATEGORY_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingIcon, setEditingIcon] = useState('');

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setEditingName(category.name);
    setEditingIcon(category.icon);
  };

  const commitEdit = (category: Category, icon: string, name: string) => {
    if (name.trim()) onUpdate(category.id, name, icon || category.icon, category.color);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        {categories.length === 0 && (
          <p className="py-2 text-center text-sm text-muted">No categories yet — add one below.</p>
        )}
        {categories.map((category) => (
          <div key={category.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2.5">
            {editingId === category.id ? (
              <div
                className="flex min-w-0 flex-1 items-center gap-2"
                onBlur={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) setEditingId(null);
                }}
              >
                <input
                  className="w-10 shrink-0 rounded-lg border border-line bg-surface px-1 py-1 text-center text-sm outline-none focus:border-ink/20"
                  value={editingIcon}
                  onChange={(e) => {
                    setEditingIcon(e.target.value);
                    commitEdit(category, e.target.value, editingName);
                  }}
                  maxLength={2}
                />
                <input
                  autoFocus
                  className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink outline-none focus:border-ink/20"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onBlur={() => commitEdit(category, editingIcon, editingName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      commitEdit(category, editingIcon, editingName);
                      setEditingId(null);
                    }
                  }}
                />
              </div>
            ) : (
              <button
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-ink"
                onClick={() => startEdit(category)}
              >
                <span className="shrink-0 text-base">{category.icon}</span>
                <span className="truncate">{category.name}</span>
              </button>
            )}
            <span className="shrink-0 text-[11px] text-muted">
              {billCounts[category.id] ?? 0} bill{(billCounts[category.id] ?? 0) === 1 ? '' : 's'}
            </span>
            <button
              onClick={() => onDelete(category.id)}
              className="shrink-0 rounded-full p-1.5 text-muted hover:bg-warn-bg hover:text-alert"
              aria-label={`Delete ${category.name}`}
            >
              🗑
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-surface-2 p-3">
        <p className="mb-2 text-xs font-medium text-muted">Add category</p>
        <div className="flex gap-2">
          <input
            className="w-12 shrink-0 rounded-xl border border-line bg-surface px-1 py-2 text-center text-sm outline-none focus:border-ink/20"
            placeholder="🗂️"
            value={newIcon}
            onChange={(e) => setNewIcon(e.target.value)}
            maxLength={2}
          />
          <input
            className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/60 outline-none focus:border-ink/20"
            placeholder="e.g. Pet Care"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                onAdd(newName, newIcon || '🗂️', newColor);
                setNewName('');
              }
            }}
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onAdd(newName, newIcon || '🗂️', newColor);
              setNewName('');
            }}
            className="shrink-0 rounded-xl bg-ink px-3 py-2 text-xs font-semibold text-white"
          >
            Add
          </button>
        </div>
        <div className="mt-2 flex gap-1.5">
          {CATEGORY_COLORS.map((c) => (
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
