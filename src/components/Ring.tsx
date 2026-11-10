import type { ReactNode } from 'react';

interface Props {
  size: number;
  innerSize: number;
  background: string;
  label?: string;
  children?: ReactNode;
}

export function Ring({ size, innerSize, background, label, children }: Props) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, background }}
      role="img"
      aria-label={label}
    >
      <div
        className="flex flex-col items-center justify-center rounded-full bg-surface"
        style={{ width: innerSize, height: innerSize }}
      >
        {children}
      </div>
    </div>
  );
}
