import type { Account, Category } from '../types';

export type StatusFilter = 'all' | 'active' | 'paused';

interface Props {
  search: string;
  onSearchChange: (v: string) => void;
  status: StatusFilter;
  onStatusChange: (v: StatusFilter) => void;
  accountId: string | 'all';
  onAccountChange: (v: string | 'all') => void;
  categoryId: string | 'all';
  onCategoryChange: (v: string | 'all') => void;
  accounts: Account[];
  categories: Category[];
}

export function FilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  accountId,
  onAccountChange,
  categoryId,
  onCategoryChange,
  accounts,
  categories,
}: Props) {
  const selectClass =
    'rounded-xl border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white outline-none focus:border-emerald-400/50';

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-emerald-400/50"
        placeholder="Search bills…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select className={selectClass} value={status} onChange={(e) => onStatusChange(e.target.value as StatusFilter)}>
        <option value="all">All statuses</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
      </select>
      <select className={selectClass} value={accountId} onChange={(e) => onAccountChange(e.target.value)}>
        <option value="all">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select className={selectClass} value={categoryId} onChange={(e) => onCategoryChange(e.target.value)}>
        <option value="all">All categories</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.icon} {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
