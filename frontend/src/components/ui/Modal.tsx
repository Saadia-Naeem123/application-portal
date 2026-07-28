'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_STYLES: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({ open, onClose, title, description, children, footer, size = 'md', className }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // `document` exists on the client's first (hydration) render but not
  // during SSR, so checking `typeof document === 'undefined'` directly in
  // render can render a different tree on that first pass than the server
  // sent — the same class of bug fixed in Toast.tsx. This only bites if a
  // caller ever mounts a Modal already `open`, but guarding with a mounted
  // flag keeps that safe regardless.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keep the latest onClose in a ref instead of the effect's dependency
  // array. Callers pass an inline `() => setX(false)` which gets a new
  // identity on every parent re-render (e.g. every keystroke in a form
  // field inside the modal) — depending on it directly caused this effect
  // to tear down and re-run on every keystroke, calling
  // `dialogRef.current?.focus()` again and yanking focus away from
  // whatever input the user was typing in.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;

    // Remember what had focus so it can be restored on close (e.g. the row
    // action button that opened this dialog).
    previouslyFocused.current = document.activeElement as HTMLElement | null;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      // Focus trap: keep Tab/Shift+Tab cycling within the dialog instead of
      // leaking out to the page underneath.
      if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
      previouslyFocused.current?.focus();
    };
    // Intentionally only re-run when the dialog opens/closes, not on every
    // render — see onCloseRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-neutral-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full animate-scale-in rounded-xl bg-white shadow-xl outline-none',
          SIZE_STYLES[size],
          className
        )}
      >
        {(title || description) && (
          <div className="flex items-start justify-between gap-4 border-b border-neutral-100 px-6 py-5">
            <div>
              {title && (
                <h2 id="modal-title" className="text-md font-semibold text-neutral-900">
                  {title}
                </h2>
              )}
              {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              className="shrink-0 rounded-lg p-1.5 text-neutral-400 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-600"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        <div className="max-h-[70vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
