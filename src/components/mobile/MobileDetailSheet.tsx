import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface Props {
  title: string;
  subtitle?: string;
  backLabel?: string;
  onBack?: () => void;
  onClose: () => void;
  /** Changing this replays the content's fade-in, e.g. when stepping from an account into one of its pots. */
  contentKey?: string;
  children: ReactNode;
}

const CLOSE_MS = 220;

/** Read-only detail pop-up: slides up from the bottom, slides back down on Done, scrim tap, Escape or a drag. */
export function MobileDetailSheet({ title, subtitle, backLabel, onBack, onClose, contentKey, children }: Props) {
  const [closing, setClosing] = useState(false);
  const [closeFrom, setCloseFrom] = useState(0);
  const [dragY, setDragY] = useState<number | null>(null);
  const drag = useRef<{ y0: number } | null>(null);
  const timer = useRef<number | null>(null);

  const requestClose = (from = 0) => {
    if (timer.current !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }
    setCloseFrom(from);
    setClosing(true);
    timer.current = window.setTimeout(onClose, CLOSE_MS);
  };

  useEffect(
    () => () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    },
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const onDragStart = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return;
    drag.current = { y0: e.clientY };
  };
  const onDragMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.y0));
  };
  const onDragEnd = () => {
    if (!drag.current) return;
    drag.current = null;
    const y = dragY ?? 0;
    setDragY(null);
    if (y > 100) requestClose(y);
  };

  const sheetStyle: CSSProperties = closing
    ? ({ '--m-detail-from': `${closeFrom}px` } as CSSProperties)
    : dragY !== null
      ? { transform: `translateY(${dragY}px)`, transition: 'none' }
      : {};

  return (
    <>
      <div className={`m-detail-scrim fixed inset-0 z-20 bg-ink/45 ${closing ? 'is-closing' : ''}`} onClick={() => requestClose()} aria-hidden="true" />
      <div
        className={`m-detail-sheet fixed inset-x-0 bottom-0 z-30 mx-auto flex max-h-[calc(100dvh-env(safe-area-inset-top,20px)-40px)] min-h-[45dvh] max-w-[500px] flex-col rounded-t-[28px] bg-[#F6F7F4] shadow-[0_-8px_30px_rgba(14,17,22,.18)] ${closing ? 'is-closing' : ''}`}
        style={sheetStyle}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="flex shrink-0 touch-none flex-col"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="mt-2 h-[5px] w-10 self-center rounded-full bg-[#C9CDC6]" aria-hidden="true" />
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-2 pb-1.5 pt-1">
            <div className="flex min-w-0 justify-start">
              {onBack && (
                <button type="button" onClick={onBack} className="flex min-h-11 min-w-0 items-center gap-0.5 px-2 text-sm font-medium text-muted-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                  <span className="truncate">{backLabel ?? 'Back'}</span>
                </button>
              )}
            </div>
            <div className="flex min-w-0 flex-col items-center">
              <h2 className="max-w-[52vw] truncate text-[17px] font-semibold text-ink">{title}</h2>
              {subtitle && <span className="max-w-[52vw] truncate text-xs text-muted">{subtitle}</span>}
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => requestClose()} className="min-h-11 px-2.5 text-sm font-semibold text-ink">
                Done
              </button>
            </div>
          </div>
        </div>
        <div
          key={contentKey}
          className="m-detail-body flex-1 overflow-y-auto overscroll-contain px-4 pt-1"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
