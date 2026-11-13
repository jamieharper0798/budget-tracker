import type { ReactNode } from 'react';

interface Props {
  size: number;
  innerSize: number;
  background: string;
  label?: string;
  children?: ReactNode;
  /** Defaults to a white (`bg-surface`) center; pass e.g. "bg-ink" when the ring sits on a dark card. */
  innerClassName?: string;
}

export function Ring({ size, innerSize, background, label, children, innerClassName = 'bg-surface' }: Props) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background }}
      role="img"
      aria-label={label}
    >
      <div
        className={`flex flex-col items-center justify-center rounded-full ${innerClassName}`}
        style={{ width: innerSize, height: innerSize }}
      >
        {children}
      </div>
    </div>
  );
}
