'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  /** Icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Icon rendered after the label */
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary-600 text-white shadow-xs hover:bg-primary-700 active:bg-primary-800 disabled:bg-primary-300',
  secondary:
    'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 active:bg-neutral-300 disabled:text-neutral-400',
  outline:
    'border border-neutral-300 bg-white text-neutral-700 shadow-xs hover:bg-neutral-50 hover:border-neutral-400 active:bg-neutral-100',
  ghost: 'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200',
  danger: 'bg-error-600 text-white shadow-xs hover:bg-error-700 active:bg-error-700 disabled:bg-error-300',
  success: 'bg-success-600 text-white shadow-xs hover:bg-success-700 active:bg-success-700',
  link: 'text-primary-600 hover:text-primary-700 underline-offset-4 hover:underline p-0 h-auto',
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-md',
  md: 'h-9.5 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-sm gap-2 rounded-lg',
  icon: 'h-9.5 w-9.5 rounded-lg',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth,
      className,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors duration-150',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15',
          'disabled:cursor-not-allowed disabled:opacity-60',
          VARIANT_STYLES[variant],
          variant !== 'link' && SIZE_STYLES[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{leftIcon}</span>
        )}
        {size !== 'icon' && children}
        {!loading && rightIcon && <span className="shrink-0 [&>svg]:h-4 [&>svg]:w-4">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
