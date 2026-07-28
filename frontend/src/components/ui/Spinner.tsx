import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export default function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <Loader2 className={cn('h-5 w-5 animate-spin text-primary-600', className)} aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Full-section loading state, e.g. inside a page or a large card */
export function SpinnerBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
      <Loader2 className="h-6 w-6 animate-spin text-primary-600" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
