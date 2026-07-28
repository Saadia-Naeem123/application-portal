import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export default function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('skeleton-shimmer animate-shimmer rounded-md', className)} {...props} />;
}

/** Pre-built skeleton row for tables while data is loading */
export function SkeletonTableRows({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r}>
          {Array.from({ length: columns }).map((_, c) => (
            <td key={c} className="px-4 py-3">
              <Skeleton className="h-4 w-full max-w-[160px]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/** Pre-built skeleton for a card / stat block */
export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
      <Skeleton className="mt-4 h-3 w-32" />
    </div>
  );
}
