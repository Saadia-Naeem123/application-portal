import { cn } from '@/lib/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const VARIANT_STYLES: Record<NonNullable<ProgressBarProps['variant']>, string> = {
  primary: 'bg-primary-600',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
};

export default function ProgressBar({ value, max = 100, variant = 'primary', label, showValue, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-neutral-600">
          <span>{label}</span>
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-100"
      >
        <div
          className={cn('h-full rounded-full transition-all duration-300 ease-out', VARIANT_STYLES[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
