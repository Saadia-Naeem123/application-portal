import { ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface SectionCardProps {
  title: string;
  description?: string;
  /** Link shown top-right, e.g. "View all" */
  actionHref?: string;
  actionLabel?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * Standard widget shell for dashboard panels (activity feeds, deadline
 * lists, notifications, etc). Keeps every panel's header/title/link
 * treatment identical across all seven role dashboards.
 */
export default function SectionCard({
  title,
  description,
  actionHref,
  actionLabel = 'View all',
  icon,
  children,
  className,
  bodyClassName,
}: SectionCardProps) {
  return (
    <Card padded={false} className={cn('flex h-full flex-col', className)}>
      <div className="flex items-start justify-between gap-4 px-5 pt-5">
        <div className="flex items-start gap-3">
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500">
              {icon}
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-neutral-500">{description}</p>}
          </div>
        </div>
        {actionHref && (
          <Link
            href={actionHref}
            className="flex shrink-0 items-center gap-0.5 text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            {actionLabel}
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
      <div className={cn('flex-1 px-5 pb-5 pt-4', bodyClassName)}>{children}</div>
    </Card>
  );
}
