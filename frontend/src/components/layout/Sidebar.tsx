'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/context/AuthContext';
import { getNavLinksForRole } from './nav-config';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  /** Renders as an overlay drawer on small screens */
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle, mobileOpen = false, onMobileClose }: SidebarProps) {
  const { user } = useAuth();
  const pathname = usePathname();
  const links = getNavLinksForRole(user?.role);

  const content = (
    <>
      <div className={cn('flex h-15 items-center gap-2.5 px-4', collapsed && 'justify-center px-0')}>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white">
          <GraduationCap className="h-4.5 w-4.5" />
        </div>
        {!collapsed && (
          <span className="truncate text-sm font-semibold text-neutral-900">University Portal</span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="flex flex-col gap-0.5">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            const Icon = link.icon;
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onMobileClose}
                  title={collapsed ? link.label : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
                  )}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  {!collapsed && <span className="truncate">{link.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-neutral-100 p-3">
        <button
          type="button"
          onClick={onToggle}
          className={cn(
            'hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-800 lg:flex',
            collapsed && 'justify-center px-0'
          )}
        >
          {collapsed ? <PanelLeftOpen className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop / tablet: fixed collapsible column */}
      <aside
        className={cn(
          'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-neutral-200 bg-white transition-all duration-200 lg:flex',
          collapsed ? 'w-19' : 'w-66'
        )}
      >
        {content}
      </aside>

      {/* Mobile: overlay drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-neutral-900/40" onClick={onMobileClose} />
          <aside className="absolute left-0 top-0 flex h-full w-66 animate-slide-in-right flex-col bg-white shadow-xl">
            {content}
          </aside>
        </div>
      )}
    </>
  );
}
