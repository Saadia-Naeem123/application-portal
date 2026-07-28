'use client';

import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  containerClassName?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, containerClassName, id, ...props }, ref) => {
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
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-neutral-400 [&>svg]:h-4 [&>svg]:w-4">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            className={cn(
              'h-9.5 w-full rounded-lg border bg-white px-3 text-sm text-neutral-900 outline-none transition-colors duration-150 placeholder:text-neutral-400',
              'focus:border-primary-500 focus:ring-4 focus:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-400',
              error ? 'border-error-400 focus:border-error-500 focus:ring-error-500/15' : 'border-neutral-300',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className
            )}
            {...props}
          />
          {rightIcon && !error && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-neutral-400 [&>svg]:h-4 [&>svg]:w-4">
              {rightIcon}
            </span>
          )}
          {error && (
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-error-500 [&>svg]:h-4 [&>svg]:w-4">
              <AlertCircle />
            </span>
          )}
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-error-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={`${inputId}-helper`} className="mt-1.5 text-xs text-neutral-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
