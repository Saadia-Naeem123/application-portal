import { LucideIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import Skeleton from '@/components/ui/Skeleton';

export type StatAccent = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

const ACCENT_ICON_STYLES: Record<StatAccent, string> = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  error: 'bg-error-50 text-error-600',
  info: 'bg-info-50 text-info-600',
  neutral: 'bg-neutral-100 text-neutral-600',
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  accent?: StatAccent;
  /** Positive shows an upward green delta, negative shows a downward red delta */
  trend?: { value: string; positive?: boolean };
  loading?: boolean;
  className?: string;
}

/**
 * Compact KPI card used across every role dashboard's stat grid.
 * Renders a skeleton in place of the value while `loading` is true so grids
 * never jump/reflow once data arrives.
 */
export default function StatCard({ label, value, icon: Icon, accent = 'neutral', trend, loading, className }: StatCardProps) {
  return (
    <Card className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-neutral-400">{label}</p>
          {loading ? (
            <Skeleton className="mt-2.5 h-7 w-16" />
          ) : (
            <p className="mt-1.5 text-2xl font-semibold tracking-tight text-neutral-900">{value}</p>
          )}
          {trend && !loading && (
            <p
              className={cn(
                'mt-1.5 inline-flex items-center gap-1 text-xs font-medium',
                trend.positive ? 'text-success-600' : 'text-error-600'
              )}
            >
              {trend.positive ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
              {trend.value}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ACCENT_ICON_STYLES[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
