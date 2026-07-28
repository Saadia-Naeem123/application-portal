import { HTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Card
 * -----
 * Default export keeps the original padded-box behaviour so every existing
 * page that does `<Card>...</Card>` keeps its spacing untouched.
 *
 * For new pages that want the compound pattern (header / content / footer
 * with dividers), pass `padded={false}` and compose with CardHeader,
 * CardContent and CardFooter below — see /design-system for examples.
 */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
}

export function Card({ className, padded = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-neutral-200 bg-white shadow-xs transition-shadow duration-150',
        padded && 'p-6',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex items-start justify-between gap-4 px-6 pt-6', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-md font-semibold text-neutral-900', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('mt-1 text-sm text-neutral-500', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-6 py-6', className)} {...props} />;
}

export function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-end gap-3 border-t border-neutral-100 px-6 py-4', className)}
      {...props}
    />
  );
}

export default Card;
