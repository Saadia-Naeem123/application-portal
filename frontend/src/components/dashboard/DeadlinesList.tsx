import Link from 'next/link';
import { CalendarClock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { PriorityPill, StatusPill } from '@/components/applications/StatusPill';
import { ApplicationStatus, Priority } from '@/types';

export interface DeadlineRow {
  id: string;
  title: string;
  href: string;
  deadlineAt: string | null;
  status?: ApplicationStatus;
  priority?: Priority;
}

function deadlineTone(deadlineAt: string | null): 'overdue' | 'today' | 'upcoming' | 'none' {
  if (!deadlineAt) return 'none';
  const d = new Date(deadlineAt);
  const now = new Date();
  if (d < now) return 'overdue';
  if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()) return 'today';
  return 'upcoming';
}

const TONE_STYLES: Record<ReturnType<typeof deadlineTone>, string> = {
  overdue: 'text-error-600 font-medium',
  today: 'text-warning-600 font-medium',
  upcoming: 'text-neutral-400',
  none: 'text-neutral-400',
};

interface DeadlinesListProps {
  items: DeadlineRow[];
  loading?: boolean;
  emptyLabel?: string;
  limit?: number;
}

export default function DeadlinesList({ items, loading, emptyLabel = 'No upcoming deadlines.', limit = 5 }: DeadlinesListProps) {
  if (loading) {
    return (
      <ul className="space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-16" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return <EmptyState icon={<CalendarClock className="h-5 w-5" />} title={emptyLabel} className="py-6" />;
  }

  return (
    <ul className="space-y-3.5">
      {items.slice(0, limit).map((item) => {
        const tone = deadlineTone(item.deadlineAt);
        return (
          <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
            <Link href={item.href} className="min-w-0 flex-1 truncate text-neutral-800 hover:text-primary-600">
              {item.title}
            </Link>
            <div className="flex shrink-0 items-center gap-2">
              {item.priority && <PriorityPill priority={item.priority} />}
              {item.status && <StatusPill status={item.status} />}
              <span className={cn('whitespace-nowrap text-xs', TONE_STYLES[tone])}>{formatDateTime(item.deadlineAt)}</span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
