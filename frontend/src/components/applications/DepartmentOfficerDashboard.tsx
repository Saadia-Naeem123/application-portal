'use client';

import { useEffect, useState } from 'react';
import { Inbox, Clock, AlertTriangle, Briefcase, CheckCircle2, XCircle, ArrowUpRight, History } from 'lucide-react';
import api from '@/lib/api';
import { StatusPill } from '@/components/applications/StatusPill';
import {
  StatCard,
  SectionCard,
  DeadlinesList,
  QuickActions,
  StatusDonut,
} from '@/components/dashboard';
import EmptyState from '@/components/ui/EmptyState';
import { AnalyticsOverview, ApplicationSummary } from '@/types';

function isToday(value: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

// The Department Officer Portal's dashboard, per spec: pending applications,
// applications near deadline, overdue applications, department workload, and
// daily statistics. /analytics/overview is already scoped to the officer's
// own department (see analytics.service.js#overviewScope), so every number
// here reflects their department only, never the whole system.
export default function DepartmentOfficerDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pending, setPending] = useState<ApplicationSummary[]>([]);
  const [recentDecisions, setRecentDecisions] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/search/applications', { params: { status: 'UNDER_DEPARTMENT_REVIEW', pageSize: 100, sortBy: 'deadlineAt', sortOrder: 'asc' } }),
      api.get('/search/applications', {
        params: { status: 'APPROVED,REJECTED,ESCALATED', pageSize: 5, sortBy: 'createdAt', sortOrder: 'desc' },
      }),
    ])
      .then(([overviewRes, pendingRes, recentRes]) => {
        setOverview(overviewRes.data.data);
        setPending(pendingRes.data.data.applications);
        setRecentDecisions(recentRes.data.data.applications);
      })
      .catch(() => setError('Unable to load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  const dueToday = pending.filter((a) => isToday(a.deadlineAt)).length;
  const overdue = pending.filter((a) => a.deadlineAt && new Date(a.deadlineAt) < new Date()).length;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Pending Applications" value={pending.length} icon={Inbox} accent="info" loading={loading} />
        <StatCard label="Near Deadline" value={overview?.totals.nearDeadline ?? dueToday} icon={Clock} accent="warning" loading={loading} />
        <StatCard label="Overdue" value={overview?.totals.overdue ?? overdue} icon={AlertTriangle} accent="error" loading={loading} />
        <StatCard label="Department Workload" value={overview?.totals.pending ?? pending.length} icon={Briefcase} accent="neutral" loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Decision Breakdown" className="lg:col-span-1">
          <StatusDonut
            loading={loading}
            data={[
              { label: 'Approved', value: overview?.totals.approved ?? 0, color: '#10b981' },
              { label: 'Rejected', value: overview?.totals.rejected ?? 0, color: '#ef4444' },
              { label: 'Escalated', value: overview?.totals.escalated ?? 0, color: '#f59e0b' },
            ]}
          />
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="Approved (all time)" value={overview?.totals.approved ?? 0} icon={CheckCircle2} accent="success" loading={loading} />
          <StatCard label="Rejected (all time)" value={overview?.totals.rejected ?? 0} icon={XCircle} accent="error" loading={loading} />
          <StatCard label="Escalated (all time)" value={overview?.totals.escalated ?? 0} icon={ArrowUpRight} accent="warning" loading={loading} />
          <StatCard label="Avg. Response Time (hrs)" value={overview?.avgResolutionHours ?? 0} icon={Clock} accent="neutral" loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Pending Department Requests" actionHref="/department/pending" icon={<Inbox className="h-4.5 w-4.5" />}>
          <DeadlinesList
            loading={loading}
            items={pending.slice(0, 5).map((a) => ({
              id: a.id,
              title: `${a.applicant?.fullName || a.applicationNumber} — ${a.subject}`,
              href: `/applications/${a.id}`,
              deadlineAt: a.deadlineAt,
              priority: a.priority,
            }))}
            emptyLabel="Nothing waiting on your department right now."
          />
        </SectionCard>

        <SectionCard title="Recent Decisions" actionHref="/department/approved" icon={<History className="h-4.5 w-4.5" />}>
          {loading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : recentDecisions.length === 0 ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No decisions recorded yet." className="py-6" />
          ) : (
            <ul className="space-y-3">
              {recentDecisions.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 text-sm">
                  <a href={`/applications/${a.id}`} className="min-w-0 flex-1 truncate text-neutral-800 hover:text-primary-600">
                    {a.applicant?.fullName || a.applicationNumber} — {a.subject}
                  </a>
                  <StatusPill status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Quick Actions">
        <QuickActions
          actions={[
            { href: '/department/pending', label: 'Pending Requests', description: 'Applications awaiting a decision', icon: Inbox },
            { href: '/department/escalated', label: 'Escalated Applications', description: 'Sent up to the Dean', icon: ArrowUpRight },
            { href: '/analytics', label: 'Reports', description: 'Department performance', icon: CheckCircle2 },
            { href: '/calendar', label: 'Calendar', description: 'Deadlines & holidays', icon: Clock },
          ]}
        />
      </SectionCard>
    </div>
  );
}
