'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

function toLabel(segment: string) {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

interface BreadcrumbsProps {
  /** Optional override — pass explicit labels for dynamic segments (e.g. IDs) */
  overrides?: Record<string, string>;
}

export default function Breadcrumbs({ overrides = {} }: BreadcrumbsProps) {
  const pathname = usePathname() || '/';
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return null;

  let href = '';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-neutral-500">
      <Link href="/dashboard" className="flex items-center gap-1 hover:text-neutral-700">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, i) => {
        href += `/${segment}`;
        const isLast = i === segments.length - 1;
        const label = overrides[segment] || toLabel(segment);
        return (
          <Fragment key={href}>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-neutral-300" />
            {isLast ? (
              <span className="font-medium text-neutral-800">{label}</span>
            ) : (
              <Link href={href} className="hover:text-neutral-700">
                {label}
              </Link>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}
