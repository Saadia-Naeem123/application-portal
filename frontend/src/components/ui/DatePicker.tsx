'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DatePickerProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

/**
 * Styled wrapper around the native date input — no extra dependency,
 * fully accessible and works with the OS-native date picker UI, while
 * matching the rest of the form component styling.
 */
const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  ({ label, error, helperText, className, containerClassName, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('block mb-4', containerClassName)}>
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <div className="relative">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400">
            <Calendar className="h-4 w-4" />
          </span>
          <input
            ref={ref}
            id={inputId}
            type="date"
            aria-invalid={!!error}
            className={cn(
              'h-9.5 w-full rounded-lg border bg-white pl-9 pr-3 text-sm text-neutral-900 outline-none transition-colors duration-150',
              'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
              error ? 'border-error-400 focus:border-error-500 focus:ring-error-500/15' : 'border-neutral-300',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-error-600">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';
export default DatePicker;
