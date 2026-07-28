'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, AlertTriangle, Clock, Building2, Award, BarChart3 } from 'lucide-react';
import api from '@/lib/api';
import { StatCard, SectionCard, DeadlinesList, QuickActions } from '@/components/dashboard';
import { ApplicationSummary, DeanOverview } from '@/types';

// The Dean Portal's dashboard, per spec: total escalations, pending
// escalations, average department response, and overdue departments, plus
// a quick look at what's currently sitting in the Dean's queue. All figures
// come from /analytics/dean-overview, which is restricted to DEAN/ADMIN and
// is system-wide by design — a Dean isn't scoped to one department.
export default function DeanDashboard() {
  const [overview, setOverview] = useState<DeanOverview | null>(null);
  const [pending, setPending] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/dean-overview'),
      api.get('/search/applications', {
        params: { status: 'ESCALATED', currentStage: 'DEAN', pageSize: 100, sortBy: 'deadlineAt', sortOrder: 'asc' },
      }),
    ])
      .then(([overviewRes, pendingRes]) => {
        setOverview(overviewRes.data.data);
        setPending(pendingRes.data.data.applications);
      })
      .catch(() => setError('Unable to load your dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Escalations" value={overview?.totalEscalations ?? 0} icon={ArrowUpRight} accent="warning" loading={loading} />
        <StatCard label="Pending Escalations" value={overview?.pendingEscalations ?? 0} icon={AlertTriangle} accent="error" loading={loading} />
        <StatCard
          label="Avg. Department Response (hrs)"
          value={overview?.avgDepartmentResponseHours ?? 0}
          icon={Clock}
          accent="neutral"
          loading={loading}
        />
        <StatCard label="Overdue Departments" value={overview?.overdueDepartments ?? 0} icon={Building2} accent="error" loading={loading} />
      </div>

      <SectionCard title="Awaiting Your Decision" actionHref="/dean/escalated" icon={<ArrowUpRight className="h-4.5 w-4.5" />}>
        <DeadlinesList
          loading={loading}
          limit={8}
          items={pending.map((a) => ({
            id: a.id,
            title: `${a.applicant?.fullName || a.applicationNumber} — ${a.subject}${a.department?.name ? ` (${a.department.name})` : ''}`,
            href: `/applications/${a.id}`,
            deadlineAt: a.deadlineAt,
            priority: a.priority,
            status: a.status,
          }))}
          emptyLabel="Nothing escalated to you right now."
        />
      </SectionCard>

      <SectionCard title="Quick Actions">
        <QuickActions
          actions={[
            { href: '/dean/escalated', label: 'Escalated Applications', description: 'Cases awaiting your decision', icon: ArrowUpRight },
            { href: '/dean/performance', label: 'Department Performance', description: 'Compare departments', icon: Award },
            { href: '/analytics', label: 'Reports', description: 'System-wide analytics', icon: BarChart3 },
          ]}
        />
      </SectionCard>
    </div>
  );
}
