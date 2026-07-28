'use client';

import { ReactNode, useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import TopNav from './TopNav';
import Footer from './Footer';
import { useAuth } from '@/context/AuthContext';

const STORAGE_KEY = 'sidebar-collapsed';

/**
 * Global authenticated application chrome: persistent collapsible sidebar
 * (with its own open/close toggle button) + slim top bar (search,
 * notifications, account menu). Mounted once in the root layout so every
 * page gets the same navigation — no more per-page opt-in, and the
 * collapsed/expanded state survives client-side navigation between pages
 * and (via localStorage) page reloads.
 *
 * Logged-out routes (login, register, the marketing home page, etc.) get
 * no sidebar or top bar — they render full-bleed with whatever centered
 * layout that page already provides.
 */
export default function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Restore the saved collapse preference after mount (avoids a
  // server/client markup mismatch since localStorage isn't available
  // during SSR).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === 'true');
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopNav onMobileMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
