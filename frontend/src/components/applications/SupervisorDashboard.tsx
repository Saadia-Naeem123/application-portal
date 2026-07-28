'use client';

import { useEffect, useState } from 'react';
import { ClipboardCheck, Clock, AlertTriangle, Users, CheckCircle2, XCircle, History } from 'lucide-react';
import api from '@/lib/api';
import { StatusPill } from '@/components/applications/StatusPill';
import {
  StatCard,
  SectionCard,
  DeadlinesList,
  QuickActions,
  StatusDonut,
} from '@/components/dashboard';
import { AnalyticsOverview, ApplicationSummary, StudentSummary } from '@/types';
import EmptyState from '@/components/ui/EmptyState';

function isToday(value: string | null) {
  if (!value) return false;
  const d = new Date(value);
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export default function SupervisorDashboard() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [pending, setPending] = useState<ApplicationSummary[]>([]);
  const [recentReviews, setRecentReviews] = useState<ApplicationSummary[]>([]);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/search/applications', { params: { status: 'UNDER_SUPERVISOR_REVIEW', pageSize: 100, sortBy: 'deadlineAt', sortOrder: 'asc' } }),
      api.get('/search/applications', {
        params: {
          status: 'UNDER_DEPARTMENT_REVIEW,AWAITING_INFO,APPROVED,REJECTED,ESCALATED,CLOSED',
          pageSize: 5,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      }),
      api.get('/users/my-students'),
    ])
      .then(([overviewRes, pendingRes, recentRes, studentsRes]) => {
        setOverview(overviewRes.data.data);
        setPending(pendingRes.data.data.applications);
        setRecentReviews(recentRes.data.data.applications);
        setStudents(studentsRes.data.data.students);
      })
      .catch(() => setError('Unable to load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  const dueToday = pending.filter((a) => isToday(a.deadlineAt)).length;
  const overdue = pending.filter((a) => a.deadlineAt && new Date(a.deadlineAt) < new Date()).length;
  const studentsWithApplications = students.filter((s) => s.applicationsCount > 0).length;

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Awaiting Review" value={pending.length} icon={ClipboardCheck} accent="info" loading={loading} />
        <StatCard label="Due Today" value={dueToday} icon={Clock} accent="warning" loading={loading} />
        <StatCard label="Overdue" value={overdue} icon={AlertTriangle} accent="error" loading={loading} />
        <StatCard label="Assigned Students" value={students.length} icon={Users} accent="neutral" loading={loading} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Review Outcomes" className="lg:col-span-1">
          <StatusDonut
            loading={loading}
            data={[
              { label: 'Approved', value: overview?.totals.approved ?? 0, color: '#10b981' },
              { label: 'Rejected', value: overview?.totals.rejected ?? 0, color: '#ef4444' },
              { label: 'Pending', value: overview?.totals.pending ?? 0, color: '#3b82f6' },
            ]}
          />
        </SectionCard>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
          <StatCard label="Approved (all time)" value={overview?.totals.approved ?? 0} icon={CheckCircle2} accent="success" loading={loading} />
          <StatCard label="Rejected (all time)" value={overview?.totals.rejected ?? 0} icon={XCircle} accent="error" loading={loading} />
          <StatCard label="Avg. Review Time (hrs)" value={overview?.avgResolutionHours ?? 0} icon={Clock} accent="neutral" loading={loading} />
          <StatCard label="Students w/ Applications" value={studentsWithApplications} icon={Users} accent="neutral" loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Applications Awaiting Review" actionHref="/reviews" icon={<ClipboardCheck className="h-4.5 w-4.5" />}>
          <DeadlinesList
            loading={loading}
            items={pending.slice(0, 5).map((a) => ({
              id: a.id,
              title: `${a.applicant?.fullName || a.applicationNumber} — ${a.subject}`,
              href: `/applications/${a.id}`,
              deadlineAt: a.deadlineAt,
              priority: a.priority,
            }))}
            emptyLabel="Nothing waiting on you right now."
          />
        </SectionCard>

        <SectionCard title="Recent Reviews" actionHref="/reviews/history" icon={<History className="h-4.5 w-4.5" />}>
          {loading ? (
            <p className="text-sm text-neutral-400">Loading…</p>
          ) : recentReviews.length === 0 ? (
            <EmptyState icon={<History className="h-5 w-5" />} title="No reviewed applications yet." className="py-6" />
          ) : (
            <ul className="space-y-3">
              {recentReviews.map((a) => (
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
            { href: '/reviews', label: 'Pending Reviews', description: 'Applications waiting on your decision', icon: ClipboardCheck },
            { href: '/students', label: 'Students', description: 'View your supervised students', icon: Users },
            { href: '/analytics', label: 'Reports', description: 'Review activity & performance', icon: CheckCircle2 },
            { href: '/reviews/history', label: 'Reviewed Applications', description: 'Past decisions', icon: History },
          ]}
        />
      </SectionCard>
    </div>
  );
}
