'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextValue | undefined>(undefined);

interface AccordionProps {
  children: ReactNode;
  className?: string;
  /** Allow more than one item open at a time */
  type?: 'single' | 'multiple';
  defaultOpen?: string[];
}

export function Accordion({ children, className, type = 'single', defaultOpen = [] }: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultOpen));

  const toggle = (id: string) => {
    setOpenItems((prev) => {
      const next = new Set(type === 'multiple' ? prev : []);
      if (prev.has(id)) {
        if (type === 'multiple') next.delete(id);
        // single mode: clicking an open item closes it (next stays empty)
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <AccordionContext.Provider value={{ openItems, toggle }}>
      <div className={cn('divide-y divide-neutral-200 rounded-xl border border-neutral-200 bg-white', className)}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const ctx = useContext(AccordionContext);
  if (!ctx) throw new Error('AccordionItem must be used within <Accordion>');
  const isOpen = ctx.openItems.has(id);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => ctx.toggle(id)}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-neutral-800 transition-colors duration-150 hover:bg-neutral-50"
      >
        {title}
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-neutral-400 transition-transform duration-200', isOpen && 'rotate-180')} />
      </button>
      {isOpen && <div className="animate-slide-up px-5 pb-4 text-sm text-neutral-600">{children}</div>}
    </div>
  );
}
