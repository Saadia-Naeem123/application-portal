'use client';

import { ReactNode, useEffect, useRef, useState, KeyboardEvent, cloneElement, isValidElement } from 'react';
import { cn } from '@/lib/cn';

interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Generic dropdown menu shell used by the top nav's notification center,
 * user menu, and any table row "..." action menu.
 *
 * Accessible by default: the trigger gets aria-haspopup/aria-expanded and
 * responds to Enter/Space/ArrowDown; the panel is a role="menu" that closes
 * on Escape or an outside click and returns focus to the trigger.
 */
export default function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const close = (restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent | globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') close(true);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKeyDown as (e: globalThis.KeyboardEvent) => void);
    // Move focus onto the first menu item once the panel renders.
    const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]');
    firstItem?.focus();
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKeyDown as (e: globalThis.KeyboardEvent) => void);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const handleMenuKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
    const currentIndex = items.findIndex((i) => i === document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      items[(currentIndex + 1) % items.length]?.focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      items[(currentIndex - 1 + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      // Tabbing out of the menu should close it rather than leaving a
      // dangling open panel with nothing focused inside it.
      close();
    }
  };

  // The trigger is often a styled <button>/<Avatar> already, sometimes with
  // its own onClick (e.g. NotificationCenter loads a preview on open) — so
  // we compose with whatever handlers it already has instead of overwriting
  // them, rather than forcing every caller to wire up the a11y bits itself.
  const existingProps = (isValidElement(trigger) ? trigger.props : {}) as {
    onClick?: (e: React.MouseEvent) => void;
    onKeyDown?: (e: React.KeyboardEvent) => void;
  };

  const triggerElement = isValidElement(trigger) ? (
    cloneElement(trigger as React.ReactElement<Record<string, unknown>>, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        existingProps.onClick?.(e);
        setOpen((o) => !o);
      },
      onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => {
        existingProps.onKeyDown?.(e);
        handleTriggerKeyDown(e);
      },
      'aria-haspopup': 'menu',
      'aria-expanded': open,
    })
  ) : (
    <button
      type="button"
      ref={triggerRef}
      onClick={() => setOpen((o) => !o)}
      onKeyDown={handleTriggerKeyDown}
      aria-haspopup="menu"
      aria-expanded={open}
    >
      {trigger}
    </button>
  );

  return (
    <div className="relative" ref={rootRef}>
      {triggerElement}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute z-40 mt-2 min-w-[220px] animate-scale-in rounded-xl border border-neutral-200 bg-white py-1.5 shadow-lg',
            align === 'right' ? 'right-0' : 'left-0',
            className
          )}
          onClick={() => close()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownItem({
  children,
  onClick,
  danger,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  danger?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-sm transition-colors duration-150 hover:bg-neutral-50 focus-visible:bg-neutral-50 focus-visible:outline-none',
        danger ? 'text-error-600 hover:bg-error-50 focus-visible:bg-error-50' : 'text-neutral-700',
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="my-1.5 border-t border-neutral-100" />;
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <div className="px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-400">{children}</div>;
}
