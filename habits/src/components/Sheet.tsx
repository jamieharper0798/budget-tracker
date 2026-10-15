import type { ReactNode } from 'react';
import { useEffect } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

/** Bottom sheet on phones, centered dialog on larger screens. */
export function Sheet({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="animate-fade fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="animate-sheet relative max-h-[92dvh] w-full overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#140d26]/95 px-5 pt-3 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl backdrop-blur-xl sm:max-w-md sm:rounded-[2rem] sm:pt-5"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <button onClick={onClose} className="rounded-full p-2 text-white/40 hover:bg-white/10 hover:text-white" aria-label="Close">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
