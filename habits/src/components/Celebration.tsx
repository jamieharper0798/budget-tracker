import { useEffect } from 'react';

export type CelebrationEvent =
  | { kind: 'perfect'; streak: number }
  | { kind: 'level'; level: number; title: string };

interface Props {
  event: CelebrationEvent;
  onClose: () => void;
}

export function Celebration({ event, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => (e.key === 'Escape' || e.key === 'Enter') && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const content =
    event.kind === 'perfect'
      ? { icon: '🌟', kicker: 'Perfect day', title: 'You crushed it!', body: event.streak > 1 ? `${event.streak} perfect days in a row. Unreal.` : 'Every habit done. +20 bonus XP.' }
      : { icon: '🚀', kicker: 'Level up', title: `Level ${event.level}`, body: `You’re now “${event.title}”. Keep climbing.` };

  return (
    <div className="animate-fade fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6 backdrop-blur-md" onClick={onClose} role="dialog" aria-modal="true" aria-label={content.kicker}>
      <div className="animate-bounce-in relative w-full max-w-xs text-center" onClick={(e) => e.stopPropagation()}>
        <div className="animate-glow absolute left-1/2 top-6 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 blur-3xl" />
        <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-[2.25rem] bg-gradient-to-br from-pink-500 via-fuchsia-500 to-orange-400 text-6xl shadow-2xl shadow-fuchsia-500/50">
          {content.icon}
        </div>
        <p className="relative mt-6 text-xs font-extrabold uppercase tracking-[0.25em] text-fuchsia-300">{content.kicker}</p>
        <h2 className="font-display relative mt-1 text-4xl font-extrabold">{content.title}</h2>
        <p className="relative mt-2 text-white/70">{content.body}</p>
        <button onClick={onClose} autoFocus className="btn-primary relative mt-7 w-full rounded-2xl py-3.5 font-bold">
          Let’s go!
        </button>
      </div>
    </div>
  );
}
