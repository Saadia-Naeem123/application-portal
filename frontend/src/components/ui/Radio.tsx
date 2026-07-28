'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@/lib/cn';

interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className={cn(
              'peer h-4.5 w-4.5 shrink-0 appearance-none rounded-full border border-neutral-300 bg-white transition-colors duration-150',
              'checked:border-[5px] checked:border-primary-600',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <label htmlFor={radioId} className="cursor-pointer select-none">
            {label && <span className="block text-sm font-medium text-neutral-800">{label}</span>}
            {description && <span className="block text-xs text-neutral-500">{description}</span>}
          </label>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';
export default Radio;
