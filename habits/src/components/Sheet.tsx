import type { ReactNode, TouchEvent } from 'react';
import { useEffect, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Drag distance (px) past which releasing a swipe-down closes the sheet. */
const DISMISS_DISTANCE = 110;
/** A quick flick closes the sheet even if it hasn't travelled far (px per ms). */
const DISMISS_VELOCITY = 0.6;

// Open sheets share one history entry, so the phone's back button / back gesture closes the
// sheet instead of leaving the app. Closing a sheet from the UI pops that entry, unless another
// sheet opened in the meantime (e.g. detail → edit) and took it over.
let openSheets = 0;
const isSheetEntry = () => (window.history.state as { momentumSheet?: boolean } | null)?.momentumSheet === true;

/** Bottom sheet on phones (swipe down, ✕ or back to close), centered dialog on larger screens. */
export function Sheet({ open, onClose, title, children }: Props) {
  const onCloseRef = useRef(onClose);
  const panelRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startTime: number } | null>(null);
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    openSheets++;
    if (!isSheetEntry()) window.history.pushState({ momentumSheet: true }, '');

    const onPop = () => onCloseRef.current();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('popstate', onPop);
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      openSheets--;
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      setOffset(0);
      setDragging(false);
      // Deferred so a sheet opening in the same update can claim the history entry first.
      setTimeout(() => {
        if (openSheets === 0 && isSheetEntry()) window.history.back();
      }, 0);
    };
  }, [open]);

  if (!open) return null;

  const onTouchStart = (e: TouchEvent) => {
    // Only start a dismiss-drag when the sheet is scrolled to the top, so normal scrolling still works.
    if ((panelRef.current?.scrollTop ?? 0) > 0) return;
    drag.current = { startY: e.touches[0].clientY, startTime: Date.now() };
  };

  const onTouchMove = (e: TouchEvent) => {
    if (!drag.current) return;
    const dy = e.touches[0].clientY - drag.current.startY;
    if (dy <= 0) {
      setOffset(0);
      return;
    }
    if (!dragging) setDragging(true);
    setOffset(dy);
  };

  const onTouchEnd = () => {
    if (!drag.current) return;
    const velocity = offset / Math.max(1, Date.now() - drag.current.startTime);
    drag.current = null;
    setDragging(false);
    if (offset > DISMISS_DISTANCE || (offset > 30 && velocity > DISMISS_VELOCITY)) onClose();
    else setOffset(0);
  };

  return (
    <div
      className="animate-fade fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      style={offset ? { backgroundColor: `rgba(0,0,0,${Math.max(0.15, 0.6 - offset / 600)})` } : undefined}
      onClick={onClose}
    >
      <div
        ref={panelRef}
        className="animate-sheet relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[2rem] border border-white/10 bg-[#140d26]/95 px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-[2rem] sm:pt-5"
        style={{
          transform: offset ? `translateY(${offset}px)` : undefined,
          transition: dragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.9, 0.3, 1)',
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" aria-hidden />
        <div className={`flex items-center justify-between ${title ? 'mb-4' : '-mb-2'}`}>
          {title ? <h2 className="font-display text-xl font-bold">{title}</h2> : <span />}
          <button
            onClick={onClose}
            className="-mr-1 rounded-full bg-white/8 p-2 text-white/60 hover:bg-white/15 hover:text-white"
            aria-label="Close"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
