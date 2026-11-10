import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/40 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="animate-rise max-h-[90vh] w-full overflow-y-auto rounded-t-[28px] bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-[0_1px_2px_rgba(14,17,22,.04),0_8px_24px_rgba(14,17,22,.12)] sm:max-w-md sm:rounded-[28px] sm:p-6"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold tracking-tight text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
