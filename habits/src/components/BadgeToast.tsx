import { useEffect } from 'react';

interface Props {
  emoji: string;
  name: string;
  onDone: () => void;
  onOpen: () => void;
}

export function BadgeToast({ emoji, name, onDone, onOpen }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 2600);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-[calc(0.75rem+env(safe-area-inset-top,0px))] z-50 flex justify-center px-4" role="status">
      <button
        onClick={onOpen}
        className="animate-bounce-in pointer-events-auto flex items-center gap-3 rounded-full border border-white/15 bg-[#1d1236]/90 py-2 pl-2 pr-5 shadow-2xl shadow-fuchsia-900/50 backdrop-blur-xl"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-pink-500 to-fuchsia-600 text-xl">{emoji}</span>
        <span className="text-left">
          <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-fuchsia-300">Badge unlocked</span>
          <span className="block text-sm font-bold">{name}</span>
        </span>
      </button>
    </div>
  );
}
