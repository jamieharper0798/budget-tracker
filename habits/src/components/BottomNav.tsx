import type { ComponentType, SVGProps } from 'react';
import { PlusIcon, StatsIcon, TodayIcon, TrophyIcon, UserIcon } from './Icons';

export type Tab = 'today' | 'stats' | 'rewards' | 'profile';

const ITEMS: { tab: Tab; label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { tab: 'today', label: 'Today', Icon: TodayIcon },
  { tab: 'stats', label: 'Stats', Icon: StatsIcon },
  { tab: 'rewards', label: 'Rewards', Icon: TrophyIcon },
  { tab: 'profile', label: 'Profile', Icon: UserIcon },
];

interface Props {
  tab: Tab;
  onTab: (t: Tab) => void;
  onAdd: () => void;
  badgeDot: boolean;
}

export function BottomNav({ tab, onTab, onAdd, badgeDot }: Props) {
  const item = ({ tab: t, label, Icon }: (typeof ITEMS)[number]) => {
    const on = tab === t;
    return (
      <button key={t} onClick={() => onTab(t)} className="relative flex flex-1 flex-col items-center gap-1 py-1.5" aria-current={on ? 'page' : undefined}>
        <Icon className={`h-6 w-6 transition ${on ? 'scale-110 text-white' : 'text-white/40'}`} strokeWidth={on ? 2.4 : 2} />
        <span className={`text-[10.5px] font-semibold ${on ? 'text-white' : 'text-white/40'}`}>{label}</span>
        {on && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-fuchsia-400" />}
        {t === 'rewards' && badgeDot && !on && <span className="absolute right-[calc(50%-16px)] top-1 h-2 w-2 rounded-full bg-orange-400 ring-2 ring-[#140d26]" />}
      </button>
    );
  };

  return (
    <nav className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3">
      <div className="pointer-events-auto mx-auto flex max-w-md items-center rounded-[1.75rem] border border-white/10 bg-[#140d26]/85 px-2 py-1.5 shadow-2xl shadow-black/50 backdrop-blur-xl">
        {item(ITEMS[0])}
        {item(ITEMS[1])}
        <div className="flex flex-1 justify-center">
          <button
            onClick={onAdd}
            className="btn-primary -mt-7 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xl shadow-fuchsia-600/40"
            aria-label="Add habit"
          >
            <PlusIcon className="h-7 w-7" strokeWidth={2.6} />
          </button>
        </div>
        {item(ITEMS[2])}
        {item(ITEMS[3])}
      </div>
    </nav>
  );
}
