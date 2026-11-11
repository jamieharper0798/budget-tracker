import type { ReactNode } from 'react';

type Screen = 'home' | 'bills' | 'savings' | 'settings';

interface Props {
  active: Screen;
  onGo: (screen: Screen) => void;
  onAddBill: () => void;
}

const TABS: { key: Screen; label: string; icon: ReactNode }[] = [
  {
    key: 'home',
    label: 'Home',
    icon: (
      <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3v-6h-6v6H6a2 2 0 0 1-2-2z" />
    ),
  },
  {
    key: 'bills',
    label: 'Bills',
    icon: (
      <>
        <path d="M6 3h12v18l-3-2-3 2-3-2-3 2z" />
        <path d="M9 8h6M9 12h6" />
      </>
    ),
  },
  {
    key: 'savings',
    label: 'Savings',
    icon: (
      <>
        <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        <path d="M21 11h-6a2 2 0 0 0 0 4h6z" />
      </>
    ),
  },
  {
    key: 'settings',
    label: 'Settings',
    icon: (
      <>
        <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" />
        <circle cx="16" cy="6" r="2" />
        <circle cx="10" cy="12" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
  },
];

export function BottomTabBar({ active, onGo, onAddBill }: Props) {
  const left = TABS.slice(0, 2);
  const right = TABS.slice(2);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-around border-t border-ink/[.06] bg-white/88 px-2 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(60px + env(safe-area-inset-bottom, 0px))' }}
      aria-label="Tabs"
    >
      {left.map((t) => (
        <button
          key={t.key}
          onClick={() => onGo(t.key)}
          aria-current={active === t.key ? 'page' : undefined}
          className={`flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            active === t.key ? 'font-semibold text-ink' : 'text-[#6B727D]'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          {t.label}
        </button>
      ))}
      <button
        onClick={onAddBill}
        aria-label="Add bill"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-ink text-accent shadow-[0_6px_16px_rgba(14,17,22,.22)]"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {right.map((t) => (
        <button
          key={t.key}
          onClick={() => onGo(t.key)}
          aria-current={active === t.key ? 'page' : undefined}
          className={`flex min-h-[50px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${
            active === t.key ? 'font-semibold text-ink' : 'text-[#6B727D]'
          }`}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {t.icon}
          </svg>
          {t.label}
        </button>
      ))}
    </nav>
  );
}
