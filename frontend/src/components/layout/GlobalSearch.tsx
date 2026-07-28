'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Users, Building2, CornerDownLeft } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { icon: FileText, label: 'Search applications', href: '/search' },
  { icon: Users, label: 'Search students', href: '/students' },
  { icon: Building2, label: 'Departments', href: '/admin/departments' },
];

/**
 * Command-palette style global search (Cmd/Ctrl+K). Phase 1 ships the
 * shell + navigation shortcuts; wiring it to a live search API is a
 * later-phase task.
 */
export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const filtered = SHORTCUTS.filter((s) => s.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <Modal open={open} onClose={onClose} size="lg" className="overflow-hidden">
      <div className="-mx-6 -mt-5 flex items-center gap-3 border-b border-neutral-100 px-6 py-4">
        <Search className="h-4.5 w-4.5 text-neutral-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && filtered[0]) go(filtered[0].href);
          }}
          placeholder="Search applications, students, departments…"
          className="w-full border-none bg-transparent text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <kbd className="hidden shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400 sm:block">
          ESC
        </kbd>
      </div>

      <div className="-mx-6 -mb-5 mt-3 max-h-80 overflow-y-auto px-2 pb-2">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-neutral-400">No quick results — try Enter to search everywhere.</p>
        ) : (
          filtered.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.href}
                onClick={() => go(item.href)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-neutral-400" />
                  {item.label}
                </span>
                <CornerDownLeft className="h-3.5 w-3.5 text-neutral-300" />
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
