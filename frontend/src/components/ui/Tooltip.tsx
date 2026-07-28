'use client';

import { ReactNode, useId, useState } from 'react';
import { cn } from '@/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

const SIDE_STYLES: Record<NonNullable<TooltipProps['side']>, string> = {
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
  left: 'right-full top-1/2 mr-2 -translate-y-1/2',
  right: 'left-full top-1/2 ml-2 -translate-y-1/2',
};

/**
 * Lightweight, dependency-free tooltip. Shows on hover/focus for
 * accessibility (keyboard users get it too via focus-within).
 */
export default function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      <span aria-describedby={id}>{children}</span>
      <span
        role="tooltip"
        id={id}
        className={cn(
          'pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-neutral-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg transition-opacity duration-150',
          SIDE_STYLES[side],
          visible ? 'opacity-100' : 'opacity-0',
          className
        )}
      >
        {content}
      </span>
    </span>
  );
}
