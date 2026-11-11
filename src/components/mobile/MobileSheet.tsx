import { useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Bottom sheet matching the mobile.html reference: slides up over a dimmed scrim, grabber drags down to dismiss. */
export function MobileSheet({ open, title, onClose, children }: Props) {
  const [dragY, setDragY] = useState<number | null>(null);
  const drag = useRef<{ y0: number } | null>(null);

  if (!open) return null;

  const onGrabberPointerDown = (e: ReactPointerEvent) => {
    drag.current = { y0: e.clientY };
  };
  const onGrabberPointerMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    setDragY(Math.max(0, e.clientY - drag.current.y0));
  };
  const endDrag = () => {
    if (dragY !== null && dragY > 120) onClose();
    drag.current = null;
    setDragY(null);
  };

  return (
    <>
      <div
        className="m-scrim fixed inset-0 z-20 bg-ink/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="m-sheet fixed inset-x-0 bottom-0 z-30 mx-auto flex h-[calc(100dvh-env(safe-area-inset-top,20px)-12px)] max-w-[500px] flex-col rounded-t-[28px] bg-[#F6F7F4] shadow-[0_-8px_30px_rgba(14,17,22,.18)]"
        style={dragY !== null ? { transform: `translateY(${dragY}px)`, transition: 'none' } : undefined}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div
          className="mt-2 h-[5px] w-10 shrink-0 touch-none self-center rounded-full bg-[#C9CDC6]"
          onPointerDown={onGrabberPointerDown}
          onPointerMove={onGrabberPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          aria-hidden="true"
        />
        <div
          className="flex shrink-0 items-center justify-between p-2"
          onPointerDown={onGrabberPointerDown}
          onPointerMove={onGrabberPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          <button type="button" onClick={onClose} className="min-h-11 px-2.5 text-sm font-medium text-muted-2">
            Cancel
          </button>
          <h2 className="text-[17px] font-semibold text-ink">{title}</h2>
          <span className="w-[70px]" />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 pt-1 text-base [&_input]:text-base [&_select]:text-base [&_textarea]:text-base">
          {children}
        </div>
      </div>
    </>
  );
}
