'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FileText, CheckCircle2, XCircle, ArrowUpRight, Bell, CalendarDays, UserCircle } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import {
  StatCard,
  SectionCard,
  DeadlinesList,
  QuickActions,
  StatusDonut,
  TrendChart,
  MiniCalendar,
} from '@/components/dashboard';
import { formatDateTime } from '@/lib/format';
import { AnalyticsOverview, Application, NotificationItem } from '@/types';

export default function StudentDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/notifications', { params: { pageSize: 5 } }),
      api.get('/applications', { params: { pageSize: 100 } }),
    ])
      .then(([overviewRes, notificationsRes, applicationsRes]) => {
        setOverview(overviewRes.data.data);
        setNotifications(notificationsRes.data.data.notifications);
        setApplications(applicationsRes.data.data.applications);
      })
      .catch(() => setError('Unable to load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  const deadlines = applications
    .filter((a) => a.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt as string).getTime() - new Date(b.deadlineAt as string).getTime())
    .slice(0, 8);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div className="flex justify-end">
        <Link href="/applications/new">
          <Button leftIcon={<FilePlus2 className="h-4 w-4" />}>Quick Submit New Application</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Total Applications" value={overview?.totals.total ?? 0} icon={FileText} accent="neutral" loading={loading} />
        <StatCard label="Pending" value={overview?.totals.pending ?? 0} icon={Bell} accent="info" loading={loading} />
        <StatCard label="Approved" value={overview?.totals.approved ?? 0} icon={CheckCircle2} accent="success" loading={loading} />
        <StatCard label="Rejected" value={overview?.totals.rejected ?? 0} icon={XCircle} accent="error" loading={loading} />
        <StatCard label="Escalated" value={overview?.totals.escalated ?? 0} icon={ArrowUpRight} accent="warning" loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Application Status Breakdown" className="lg:col-span-1">
          <StatusDonut
            loading={loading}
            data={[
              { label: 'Pending', value: overview?.totals.pending ?? 0, color: '#3b82f6' },
              { label: 'Approved', value: overview?.totals.approved ?? 0, color: '#10b981' },
              { label: 'Rejected', value: overview?.totals.rejected ?? 0, color: '#ef4444' },
              { label: 'Escalated', value: overview?.totals.escalated ?? 0, color: '#f59e0b' },
              { label: 'Closed', value: overview?.totals.closed ?? 0, color: '#94a3b8' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Submission Trend" description="Applications submitted over time" className="lg:col-span-2">
          <TrendChart data={overview?.monthlyTrend ?? []} loading={loading} height={200} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Recent Notifications" actionHref="/notifications" icon={<Bell className="h-4.5 w-4.5" />} className="lg:col-span-1">
          {loading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-neutral-500">No notifications yet.</p>
          ) : (
            <ul className="space-y-3">
              {notifications.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.isRead ? 'text-neutral-600' : 'font-medium text-neutral-900'}>{n.title}</p>
                  <p className="text-xs text-neutral-400">{formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title="Upcoming Deadlines"
          actionHref="/calendar"
          actionLabel="View calendar"
          icon={<CalendarDays className="h-4.5 w-4.5" />}
          className="lg:col-span-2"
        >
          <DeadlinesList
            loading={loading}
            items={deadlines.map((a) => ({ id: a.id, title: a.subject, href: `/applications/${a.id}`, deadlineAt: a.deadlineAt, status: a.status }))}
          />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Quick Actions" className="lg:col-span-2">
          <QuickActions
            actions={[
              { href: '/applications/new', label: 'New Application', description: 'Start a fresh submission', icon: FilePlus2 },
              { href: '/applications', label: 'My Applications', description: 'Track everything you\u2019ve submitted', icon: FileText },
              { href: '/calendar', label: 'Calendar', description: 'Deadlines & holidays', icon: CalendarDays },
              { href: '/profile', label: 'Profile', description: 'Manage your account', icon: UserCircle },
            ]}
          />
        </SectionCard>

        <SectionCard title="This Month" className="lg:col-span-1">
          <MiniCalendar markedDates={deadlines.map((a) => a.deadlineAt as string)} />
        </SectionCard>
      </div>
    </div>
  );
}
