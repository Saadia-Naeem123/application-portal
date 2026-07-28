import { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatDateTime } from '@/lib/format';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { History } from 'lucide-react';

export interface TimelineEntry {
  id: string;
  title: ReactNode;
  timestamp: string;
  accent?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
}

const DOT_STYLES: Record<NonNullable<TimelineEntry['accent']>, string> = {
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  neutral: 'bg-neutral-400',
};

interface ActivityTimelineProps {
  entries: TimelineEntry[];
  loading?: boolean;
  emptyLabel?: string;
}

export default function ActivityTimeline({ entries, loading, emptyLabel = 'No recent activity.' }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-2.5 w-2.5 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return <EmptyState icon={<History className="h-5 w-5" />} title={emptyLabel} className="py-6" />;
  }

  return (
    <ul className="relative">
      {entries.map((entry, idx) => (
        <li key={entry.id} className="relative flex gap-3 pb-5 last:pb-0">
          {idx !== entries.length - 1 && (
            <span className="absolute left-[4.5px] top-3 h-full w-px bg-neutral-200" aria-hidden="true" />
          )}
          <span
            className={cn('relative mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-4 ring-white', DOT_STYLES[entry.accent || 'neutral'])}
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-neutral-700">{entry.title}</p>
            <p className="mt-0.5 text-xs text-neutral-400">{formatDateTime(entry.timestamp)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
