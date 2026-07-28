import { cn } from '@/lib/cn';
import EmptyState from '@/components/ui/EmptyState';
import Skeleton from '@/components/ui/Skeleton';
import { BarChart3 } from 'lucide-react';

export interface RankedRow {
  id: string;
  name: string;
  primaryMetric: string;
  secondaryMetric?: string;
  /** 0-100, drives the inline progress bar */
  percent: number;
}

interface RankedListProps {
  rows: RankedRow[];
  loading?: boolean;
  emptyLabel?: string;
}

const RANK_STYLES = ['bg-primary-600 text-white', 'bg-primary-100 text-primary-700', 'bg-primary-50 text-primary-600'];

/** Top-N leaderboard used for department/supervisor performance panels. */
export default function RankedList({ rows, loading, emptyLabel = 'No activity yet.' }: RankedListProps) {
  if (loading) {
    return (
      <ul className="space-y-4">
        {[0, 1, 2].map((i) => (
          <li key={i} className="space-y-1.5">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-1.5 w-full" />
          </li>
        ))}
      </ul>
    );
  }

  if (rows.length === 0) {
    return <EmptyState icon={<BarChart3 className="h-5 w-5" />} title={emptyLabel} className="py-6" />;
  }

  return (
    <ul className="space-y-4">
      {rows.map((row, idx) => (
        <li key={row.id}>
          <div className="mb-1.5 flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                  RANK_STYLES[idx] || 'bg-neutral-100 text-neutral-500'
                )}
              >
                {idx + 1}
              </span>
              <span className="truncate text-sm font-medium text-neutral-800">{row.name}</span>
            </div>
            <span className="shrink-0 text-xs text-neutral-500">
              {row.primaryMetric}
              {row.secondaryMetric ? ` · ${row.secondaryMetric}` : ''}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-primary-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, row.percent))}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
