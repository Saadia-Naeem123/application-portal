'use client';

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (input: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const VARIANT_ICON: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success-500" />,
  error: <XCircle className="h-5 w-5 text-error-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-warning-500" />,
  info: <Info className="h-5 w-5 text-info-500" />,
};

const VARIANT_BORDER: Record<ToastVariant, string> = {
  success: 'border-l-success-500',
  error: 'border-l-error-500',
  warning: 'border-l-warning-500',
  info: 'border-l-info-500',
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  // `document` exists on the very first client render (hydration), but not
  // during SSR — checking `typeof document !== 'undefined'` directly in the
  // render body therefore renders a different tree on the client's first
  // pass than what the server sent, which is exactly what triggers
  // "Hydration failed because the initial UI does not match what was
  // rendered on the server". Waiting for this effect (which only ever runs
  // client-side, after hydration) keeps the first render identical on both
  // sides — `mounted` is false everywhere until then.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const toast = useCallback((input: Omit<ToastItem, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...input, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismiss = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed top-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2.5">
            {toasts.map((t) => (
              <div
                key={t.id}
                role="status"
                className={cn(
                  'pointer-events-auto flex animate-slide-in-right items-start gap-3 rounded-lg border-l-4 bg-white p-4 shadow-lg',
                  VARIANT_BORDER[t.variant]
                )}
              >
                <span className="shrink-0">{VARIANT_ICON[t.variant]}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-neutral-900">{t.title}</p>
                  {t.description && <p className="mt-0.5 text-xs text-neutral-500">{t.description}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => dismiss(t.id)}
                  aria-label="Dismiss notification"
                  className="shrink-0 rounded p-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
