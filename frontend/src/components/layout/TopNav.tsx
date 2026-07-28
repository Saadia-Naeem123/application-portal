'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, Search, GraduationCap } from 'lucide-react';
import NotificationCenter from './NotificationCenter';
import UserMenu from './UserMenu';
import GlobalSearch from './GlobalSearch';
import { useAuth } from '@/context/AuthContext';

interface TopNavProps {
  onMobileMenuClick: () => void;
}

/**
 * Fixed top navigation bar for the authenticated application shell.
 * Houses the mobile sidebar toggle, global search trigger (Cmd/Ctrl+K),
 * notification center, and the user menu.
 */
export default function TopNav({ onMobileMenuClick }: TopNavProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-15 shrink-0 items-center gap-3 border-b border-neutral-200 bg-white/95 px-4 backdrop-blur sm:px-6">
        <button
          type="button"
          onClick={onMobileMenuClick}
          aria-label="Open navigation menu"
          className="flex h-9.5 w-9.5 items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 lg:hidden"
        >
          <Menu className="h-4.5 w-4.5" />
        </button>

        <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary-600 text-white">
            <GraduationCap className="h-4 w-4" />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="flex h-9.5 flex-1 max-w-md items-center gap-2.5 rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-400 transition-colors duration-150 hover:border-neutral-300 hover:bg-white"
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="hidden truncate sm:block">Search applications, students, departments…</span>
          <span className="ml-auto hidden shrink-0 rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:block">
            ⌘K
          </span>
        </button>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          {user && <NotificationCenter />}
          {user ? (
            <UserMenu />
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Link href="/login" className="text-neutral-600 hover:text-primary-600">
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-primary-600 px-3.5 py-2 font-medium text-white hover:bg-primary-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </header>

      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
