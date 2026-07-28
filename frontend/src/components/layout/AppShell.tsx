'use client';

import { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';
import { useAuth } from '@/context/AuthContext';

interface AppShellProps {
  children: ReactNode;
  /** Page title shown in the header area, above the content */
  title?: string;
  /** Short description under the title */
  description?: string;
  /** Optional action buttons rendered top-right of the page header */
  actions?: ReactNode;
  /** Set false to hide the breadcrumb trail (e.g. on the dashboard itself) */
  showBreadcrumbs?: boolean;
  /** Override labels for dynamic breadcrumb segments (slugs, IDs) */
  breadcrumbOverrides?: Record<string, string>;
}

/**
 * Page-level content wrapper: breadcrumb trail, page header (title +
 * description + actions), and the padded/max-width content column.
 *
 * The sidebar, top bar, and footer are part of the global app chrome
 * mounted once in the root layout (see components/layout/Shell.tsx) so
 * every page gets the same persistent navigation — this component only
 * owns what sits inside that shell's <main>.
 *
 * Usage:
 *   <AppShell title="My Applications" description="Track and manage your submissions">
 *     ...page content...
 *   </AppShell>
 */
export default function AppShell({
  children,
  title,
  description,
  actions,
  showBreadcrumbs = true,
  breadcrumbOverrides,
}: AppShellProps) {
  const { user } = useAuth();

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {showBreadcrumbs && user && (
          <div className="mb-4">
            <Breadcrumbs overrides={breadcrumbOverrides} />
          </div>
        )}

        {(title || actions) && (
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              {title && <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">{title}</h1>}
              {description && <p className="mt-1 text-sm text-neutral-500">{description}</p>}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
          </div>
        )}

        {children}
      </div>
    </div>
  );
}
