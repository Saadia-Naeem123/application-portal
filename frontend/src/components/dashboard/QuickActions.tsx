import Link from 'next/link';
import { LucideIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface QuickAction {
  href: string;
  label: string;
  description?: string;
  icon: LucideIcon;
}

interface QuickActionsProps {
  actions: QuickAction[];
  className?: string;
}

/** Grid of shortcut links to the most common tasks for the current role. */
export default function QuickActions({ actions, className }: QuickActionsProps) {
  return (
    <div className={cn('grid gap-3 sm:grid-cols-2', className)}>
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.href}
            href={action.href}
            className="group flex items-center gap-3 rounded-lg border border-neutral-200 p-3.5 transition-colors duration-150 hover:border-primary-200 hover:bg-primary-25"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors duration-150 group-hover:bg-primary-100">
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-neutral-800">{action.label}</p>
              {action.description && <p className="truncate text-xs text-neutral-500">{action.description}</p>}
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300 transition-colors duration-150 group-hover:text-primary-500" />
          </Link>
        );
      })}
    </div>
  );
}
