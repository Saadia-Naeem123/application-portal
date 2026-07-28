'use client';

import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  description?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, className, id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <div className="flex items-start gap-2.5">
        <div className="relative flex h-4.5 w-4.5 shrink-0 items-center justify-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className={cn(
              'peer h-4.5 w-4.5 shrink-0 appearance-none rounded-md border border-neutral-300 bg-white transition-colors duration-150',
              'checked:border-primary-600 checked:bg-primary-600',
              'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/15',
              'disabled:cursor-not-allowed disabled:opacity-50',
              className
            )}
            {...props}
          />
          <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" />
        </div>
        {(label || description) && (
          <label htmlFor={checkboxId} className="cursor-pointer select-none">
            {label && <span className="block text-sm font-medium text-neutral-800">{label}</span>}
            {description && <span className="block text-xs text-neutral-500">{description}</span>}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
export default Checkbox;
