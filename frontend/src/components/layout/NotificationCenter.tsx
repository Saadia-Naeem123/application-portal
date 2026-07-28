'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck } from 'lucide-react';
import api from '@/lib/api';
import Dropdown, { DropdownItem } from '@/components/ui/Dropdown';
import EmptyState from '@/components/ui/EmptyState';
import { useAuth } from '@/context/AuthContext';

interface NotificationPreview {
  id: string;
  title: string;
  message?: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<NotificationPreview[]>([]);

  useEffect(() => {
    if (!user) return;
    const poll = () => {
      api
        .get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.data.unreadCount))
        .catch(() => {});
    };
    poll();
    const interval = setInterval(poll, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const loadPreview = () => {
    api
      .get('/notifications', { params: { limit: 5 } })
      .then((res) => setItems(res.data.data.notifications || res.data.data.items || []))
      .catch(() => setItems([]));
  };

  return (
    <Dropdown
      trigger={
        <button
          type="button"
          onClick={loadPreview}
          aria-label="Notifications"
          className="relative flex h-9.5 w-9.5 items-center justify-center rounded-lg text-neutral-500 transition-colors duration-150 hover:bg-neutral-100 hover:text-neutral-700"
        >
          <Bell className="h-4.5 w-4.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-error-500" />
          )}
        </button>
      }
      className="w-80"
    >
      <div className="flex items-center justify-between px-3.5 py-2">
        <span className="text-sm font-semibold text-neutral-900">Notifications</span>
        {unreadCount > 0 && (
          <span className="rounded-full bg-error-50 px-2 py-0.5 text-xs font-medium text-error-600">
            {unreadCount} new
          </span>
        )}
      </div>
      <div className="max-h-80 overflow-y-auto">
        {items.length === 0 ? (
          <EmptyState
            icon={<CheckCheck className="h-5 w-5" />}
            title="You're all caught up"
            description="New notifications will show up here."
            className="py-8"
          />
        ) : (
          items.map((n) => (
            <DropdownItem key={n.id} onClick={() => router.push('/notifications')}>
              <span className="flex flex-col gap-0.5">
                <span className={n.isRead ? 'text-neutral-600' : 'font-medium text-neutral-900'}>{n.title}</span>
                {n.message && <span className="line-clamp-1 text-xs text-neutral-400">{n.message}</span>}
              </span>
            </DropdownItem>
          ))
        )}
      </div>
      <div className="border-t border-neutral-100 px-3.5 py-2">
        <DropdownItem onClick={() => router.push('/notifications')} className="justify-center font-medium text-primary-600">
          View all notifications
        </DropdownItem>
      </div>
    </Dropdown>
  );
}
