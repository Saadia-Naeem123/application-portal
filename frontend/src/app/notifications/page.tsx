'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { formatDateTime } from '@/lib/format';
import { NotificationItem } from '@/types';

const PAGE_SIZE = 15;

const TYPE_LABELS: Record<string, string> = {
  SUBMITTED: 'Application Submitted',
  APPROVED: 'Approval Update',
  STATUS_CHANGE: 'Status Update',
  REJECTED: 'Approval Update',
  INFO_REQUESTED: 'Information Requested',
  INFO_PROVIDED: 'Information Provided',
  FORWARDED: 'Forwarded',
  COMMENT: 'Comment',
  REMINDER: 'Reminder',
  ESCALATED: 'Escalation',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get('/notifications', {
        params: { isRead: filter === 'unread' ? false : undefined, page, pageSize: PAGE_SIZE },
      })
      .then((res) => {
        setNotifications(res.data.data.notifications);
        setTotal(res.data.data.total);
        setUnreadCount(res.data.data.unreadCount);
      })
      .catch(() => setError('Unable to load notifications.'))
      .finally(() => setLoading(false));
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      setError('Failed to mark as read.');
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      load();
    } catch {
      setError('Failed to mark all as read.');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">{unreadCount} unread</p>
          </div>
          <div className="flex gap-2">
            <Select
              value={filter}
              onChange={(e) => {
                setPage(1);
                setFilter(e.target.value as 'all' | 'unread');
              }}
              className="w-auto"
            >
              <option value="all">All</option>
              <option value="unread">Unread only</option>
            </Select>
            <Button variant="secondary" onClick={markAllRead} disabled={unreadCount === 0}>
              Mark All Read
            </Button>
          </div>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : notifications.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">No notifications to show.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <Card key={n.id} className={n.isRead ? '' : 'border-brand-200 bg-brand-50/40'}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      {!n.isRead && <span className="h-2 w-2 rounded-full bg-brand-500" />}
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                        {TYPE_LABELS[n.type] || n.type.replaceAll('_', ' ')}
                      </span>
                    </div>
                    <p className="font-medium text-slate-900">{n.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{n.message}</p>
                    <p className="mt-1 text-xs text-slate-400">{formatDateTime(n.createdAt)}</p>
                    {n.applicationId && (
                      <Link
                        href={`/applications/${n.applicationId}`}
                        className="mt-2 inline-block text-xs font-medium text-brand-600 hover:underline"
                      >
                        View application →
                      </Link>
                    )}
                  </div>
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      className="flex-shrink-0 text-xs font-medium text-brand-600 hover:underline"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
