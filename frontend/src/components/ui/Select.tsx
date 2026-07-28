'use client';

import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, className, containerClassName, children, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={cn('block mb-4', containerClassName)}>
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={!!error}
            aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
            className={cn(
              'h-9.5 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-neutral-900 outline-none transition-colors duration-150',
              'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
              error ? 'border-error-400 focus:border-error-500 focus:ring-error-500/15' : 'border-neutral-300',
              className
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        </div>
        {error ? (
          <p id={`${selectId}-error`} className="mt-1.5 text-xs text-error-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${selectId}-helper`} className="mt-1.5 text-xs text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
