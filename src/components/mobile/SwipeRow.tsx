import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface Props {
  paid: boolean;
  label: string;
  onToggle: () => void;
  children: ReactNode;
}

const CHECK = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </svg>
);

/** One row in the Bills list: swipe left past 80px toggles paid, per mobile.html's `.swipe` pattern. */
export function SwipeRow({ paid, label, onToggle, children }: Props) {
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x0: number; y0: number; locked: 'x' | 'y' | null } | null>(null);

  const onPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { x0: e.clientX, y0: e.clientY, locked: null };
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const dxRaw = e.clientX - drag.current.x0;
    const dyRaw = e.clientY - drag.current.y0;
    if (drag.current.locked === null && (Math.abs(dxRaw) > 8 || Math.abs(dyRaw) > 8)) {
      drag.current.locked = Math.abs(dxRaw) > Math.abs(dyRaw) ? 'x' : 'y';
    }
    if (drag.current.locked !== 'x') return;
    setDx(Math.max(-140, Math.min(0, dxRaw)));
  };
  const endDrag = () => {
    if (!drag.current) return;
    setDragging(false);
    if (dx < -80) onToggle();
    setDx(0);
    drag.current = null;
  };

  return (
    <div className="relative overflow-hidden border-t border-line first:border-t-0">
      <button
        type="button"
        tabIndex={-1}
        onClick={onToggle}
        className="absolute inset-y-0 right-0 flex w-24 flex-col items-center justify-center gap-0.5 bg-accent text-[12px] font-bold text-ink"
      >
        {CHECK}
        {paid ? 'Unpaid' : 'Paid'}
      </button>
      <div
        className={`m-swipe-content relative flex items-center gap-3 bg-surface py-2.5 pl-3.5 pr-2 ${dragging ? '' : 'transition-transform duration-200'}`}
        style={{ transform: `translateX(${dx}px)`, touchAction: 'pan-y' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {children}
        <button
          onClick={onToggle}
          aria-pressed={paid}
          aria-label={`${paid ? 'Paid' : 'Mark as paid'}: ${label}`}
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 ${
            paid ? 'border-0 bg-accent text-ink' : 'border-[#D9DCD6] bg-surface text-[#C2C6CC]'
          }`}
        >
          {CHECK}
        </button>
      </div>
    </div>
  );
}
