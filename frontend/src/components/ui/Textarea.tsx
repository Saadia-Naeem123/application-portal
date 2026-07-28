'use client';

import { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className, containerClassName, rows = 5, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className={cn('block mb-4', containerClassName)}>
        {label && (
          <label htmlFor={textareaId} className="mb-1.5 block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors duration-150 placeholder:text-neutral-400',
            'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
            'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
            error ? 'border-error-400 focus:border-error-500 focus:ring-error-500/15' : 'border-neutral-300',
            className
          )}
          {...props}
        />
        {error ? (
          <p id={`${textareaId}-error`} className="mt-1.5 text-xs text-error-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${textareaId}-helper`} className="mt-1.5 text-xs text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
