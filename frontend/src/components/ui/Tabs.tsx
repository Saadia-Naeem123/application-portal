'use client';

import { createContext, useContext, useState, ReactNode, KeyboardEvent, useRef } from 'react';
import { cn } from '@/lib/cn';

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext() {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error('Tabs.* components must be used within <Tabs>');
  return ctx;
}

interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const current = value ?? internalValue;

  const setValue = (v: string) => {
    if (value === undefined) setInternalValue(v);
    onValueChange?.(v);
  };

  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }: { children: ReactNode; className?: string }) {
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(listRef.current?.querySelectorAll('button[role="tab"]') || []) as HTMLButtonElement[];
    const currentIndex = buttons.findIndex((b) => b === document.activeElement);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      buttons[(currentIndex + 1) % buttons.length]?.focus();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      buttons[(currentIndex - 1 + buttons.length) % buttons.length]?.focus();
    }
  };

  return (
    <div
      ref={listRef}
      role="tablist"
      onKeyDown={handleKeyDown}
      className={cn('flex items-center gap-1 border-b border-neutral-200', className)}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { value: current, setValue } = useTabsContext();
  const isActive = current === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
      onClick={() => setValue(value)}
      className={cn(
        'relative -mb-px flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15 focus-visible:rounded-t-md',
        isActive
          ? 'border-primary-600 text-primary-700'
          : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700',
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: ReactNode; className?: string }) {
  const { value: current } = useTabsContext();
  if (current !== value) return null;
  return (
    <div role="tabpanel" className={cn('animate-fade-in pt-4', className)}>
      {children}
    </div>
  );
}
