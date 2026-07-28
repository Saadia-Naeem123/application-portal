'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = useId();
    const switchId = id || generatedId;

    return (
      <label htmlFor={switchId} className="flex cursor-pointer items-start gap-3">
        <span className="relative inline-flex h-6 w-10 shrink-0 items-center">
          <input
            ref={ref}
            type="checkbox"
            id={switchId}
            role="switch"
            className={cn(
              'peer h-6 w-10 shrink-0 appearance-none rounded-full bg-neutral-200 transition-colors duration-150',
              'checked:bg-primary-600',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <span className="pointer-events-none absolute left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-150 peer-checked:translate-x-4" />
        </span>
        {(label || description) && (
          <span className="select-none">
            {label && <span className="block text-sm font-medium text-neutral-800">{label}</span>}
            {description && <span className="block text-xs text-neutral-500">{description}</span>}
          </span>
        )}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
export default Switch;
