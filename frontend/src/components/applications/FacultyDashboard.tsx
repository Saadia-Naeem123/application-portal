'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FilePlus2, FileText, Bell, CalendarDays, UserCircle, CheckCircle2, Clock } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import {
  StatCard,
  SectionCard,
  DeadlinesList,
  QuickActions,
  StatusDonut,
  TrendChart,
} from '@/components/dashboard';
import { formatDateTime } from '@/lib/format';
import { AnalyticsOverview, Application, NotificationItem } from '@/types';

// Faculty authority mirrors the Student portal: their own requests are
// scoped the same way on the backend (analytics.service.js#overviewScope
// and application.service.js both fall back to "applicantId = self" for
// any non-privileged, non-supervisor role), so this dashboard is a
// Faculty-framed read of the same endpoints StudentDashboard already uses.
export default function FacultyDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
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
        setNotices(notificationsRes.data.data.notifications);
        setApplications(applicationsRes.data.data.applications);
      })
      .catch(() => setError('Unable to load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  const deadlines = applications
    .filter((a) => a.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt as string).getTime() - new Date(b.deadlineAt as string).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div className="flex justify-end">
        <Link href="/applications/new">
          <Button leftIcon={<FilePlus2 className="h-4 w-4" />}>New Application</Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Requests" value={overview?.totals.total ?? 0} icon={FileText} accent="neutral" loading={loading} />
        <StatCard label="Pending Requests" value={overview?.totals.pending ?? 0} icon={Clock} accent="info" loading={loading} />
        <StatCard label="Approved Requests" value={overview?.totals.approved ?? 0} icon={CheckCircle2} accent="success" loading={loading} />
        <StatCard
          label="Avg. Processing (hrs)"
          value={overview?.avgResolutionHours ?? 0}
          icon={Clock}
          accent="warning"
          loading={loading}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Request Status Breakdown" className="lg:col-span-1">
          <StatusDonut
            loading={loading}
            data={[
              { label: 'Pending', value: overview?.totals.pending ?? 0, color: '#3b82f6' },
              { label: 'Approved', value: overview?.totals.approved ?? 0, color: '#10b981' },
              { label: 'Rejected', value: overview?.totals.rejected ?? 0, color: '#ef4444' },
              { label: 'Escalated', value: overview?.totals.escalated ?? 0, color: '#f59e0b' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Submission Trend" className="lg:col-span-2">
          <TrendChart data={overview?.monthlyTrend ?? []} loading={loading} height={200} />
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Department Notices" actionHref="/notifications" icon={<Bell className="h-4.5 w-4.5" />}>
          {loading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : notices.length === 0 ? (
            <p className="text-sm text-neutral-500">No notices yet.</p>
          ) : (
            <ul className="space-y-3">
              {notices.map((n) => (
                <li key={n.id} className="text-sm">
                  <p className={n.isRead ? 'text-neutral-600' : 'font-medium text-neutral-900'}>{n.title}</p>
                  <p className="text-xs text-neutral-400">{formatDateTime(n.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Deadlines" actionHref="/calendar" actionLabel="View calendar" icon={<CalendarDays className="h-4.5 w-4.5" />}>
          <DeadlinesList
            loading={loading}
            items={deadlines.map((a) => ({ id: a.id, title: a.subject, href: `/applications/${a.id}`, deadlineAt: a.deadlineAt, status: a.status }))}
          />
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <QuickActions
          actions={[
            { href: '/applications/new', label: 'New Application', description: 'Start a fresh submission', icon: FilePlus2 },
            { href: '/applications', label: 'My Applications', description: 'Track everything you\u2019ve submitted', icon: FileText },
            { href: '/calendar', label: 'Calendar', description: 'Deadlines & holidays', icon: CalendarDays },
            { href: '/profile', label: 'Profile', description: 'Manage your account', icon: UserCircle },
          ]}
        />
      </SectionCard>
    </div>
  );
}
