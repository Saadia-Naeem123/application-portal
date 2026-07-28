import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_STYLES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9.5 w-9.5 text-sm',
  lg: 'h-12 w-12 text-base',
};

const PALETTE = ['bg-primary-100 text-primary-700', 'bg-success-100 text-success-700', 'bg-warning-100 text-warning-700', 'bg-info-100 text-info-700'];

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function colorFor(name: string) {
  const idx = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length;
  return PALETTE[idx];
}

export default function Avatar({ name, src, size = 'md', className }: AvatarProps) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={cn('shrink-0 rounded-full object-cover', SIZE_STYLES[size], className)}
      />
    );
  }

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        SIZE_STYLES[size],
        colorFor(name),
        className
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
