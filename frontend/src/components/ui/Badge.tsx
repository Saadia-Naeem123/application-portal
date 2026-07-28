import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'info' | 'outline';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  /** Small leading dot, useful for status indicators */
  dot?: boolean;
}

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-100 text-neutral-700',
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-success-50 text-success-700',
  warning: 'bg-warning-50 text-warning-700',
  error: 'bg-error-50 text-error-700',
  info: 'bg-info-50 text-info-700',
  outline: 'border border-neutral-300 text-neutral-700 bg-white',
};

const DOT_STYLES: Record<BadgeVariant, string> = {
  neutral: 'bg-neutral-400',
  primary: 'bg-primary-500',
  success: 'bg-success-500',
  warning: 'bg-warning-500',
  error: 'bg-error-500',
  info: 'bg-info-500',
  outline: 'bg-neutral-400',
};

export default function Badge({ variant = 'neutral', dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none',
        VARIANT_STYLES[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', DOT_STYLES[variant])} aria-hidden="true" />}
      {children}
    </span>
  );
}
