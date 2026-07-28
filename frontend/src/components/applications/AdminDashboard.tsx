'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  GraduationCap,
  Briefcase,
  UserCog,
  Building2,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  AlertTriangle,
  ScrollText,
  Settings,
  Route,
} from 'lucide-react';
import api from '@/lib/api';
import {
  StatCard,
  SectionCard,
  RankedList,
  ActivityTimeline,
  QuickActions,
  StatusDonut,
  TrendChart,
} from '@/components/dashboard';
import { AdminOverview, AnalyticsOverview, DepartmentReportRow, SupervisorReportRow } from '@/types';

// The Administrator Portal's dashboard, per spec: user/department
// headcounts, application totals by status, near-deadline count, average
// processing time, department & supervisor performance, and recent
// activity. /analytics/overview is unscoped for ADMIN (system-wide), so it
// covers every application total here without any department filter.
export default function AdminDashboard() {
  const [admin, setAdmin] = useState<AdminOverview | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentReportRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/analytics/admin-overview'),
      api.get('/analytics/overview'),
      api.get('/analytics/departments'),
      api.get('/analytics/supervisors'),
    ])
      .then(([adminRes, overviewRes, deptRes, supRes]) => {
        setAdmin(adminRes.data.data);
        setOverview(overviewRes.data.data);
        setDepartments(deptRes.data.data.departments);
        setSupervisors(supRes.data.data.supervisors);
      })
      .catch(() => setError('Unable to load the dashboard right now.'))
      .finally(() => setLoading(false));
  }, []);

  const topDepartments = [...departments].sort((a, b) => b.total - a.total).slice(0, 5);
  const topSupervisors = [...supervisors].sort((a, b) => b.total - a.total).slice(0, 5);
  const maxDeptTotal = Math.max(1, ...topDepartments.map((d) => d.total));
  const maxSupTotal = Math.max(1, ...topSupervisors.map((s) => s.total));

  return (
    <div className="space-y-6">
      {error && <p className="text-sm text-error-600">{error}</p>}

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">People & Departments</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Total Users" value={admin?.totalUsers ?? 0} icon={Users} accent="neutral" loading={loading} />
          <StatCard label="Students" value={admin?.students ?? 0} icon={GraduationCap} accent="primary" loading={loading} />
          <StatCard label="Faculty" value={admin?.faculty ?? 0} icon={Briefcase} accent="info" loading={loading} />
          <StatCard label="Staff" value={admin?.staff ?? 0} icon={UserCog} accent="info" loading={loading} />
          <StatCard label="Supervisors" value={admin?.supervisors ?? 0} icon={Users} accent="neutral" loading={loading} />
          <StatCard label="Departments" value={admin?.departmentCount ?? 0} icon={Building2} accent="neutral" loading={loading} />
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-neutral-400">Applications</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Submitted" value={overview?.totals.total ?? 0} icon={FileText} accent="primary" loading={loading} />
          <StatCard label="Pending" value={overview?.totals.pending ?? 0} icon={Clock} accent="warning" loading={loading} />
          <StatCard label="Approved" value={overview?.totals.approved ?? 0} icon={CheckCircle2} accent="success" loading={loading} />
          <StatCard label="Rejected" value={overview?.totals.rejected ?? 0} icon={XCircle} accent="error" loading={loading} />
          <StatCard label="Escalated" value={overview?.totals.escalated ?? 0} icon={ArrowUpRight} accent="warning" loading={loading} />
          <StatCard label="Near Deadline" value={overview?.totals.nearDeadline ?? 0} icon={AlertTriangle} accent="warning" loading={loading} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Overdue" value={overview?.totals.overdue ?? 0} icon={AlertTriangle} accent="error" loading={loading} />
          <StatCard label="Closed" value={overview?.totals.closed ?? 0} icon={FileText} accent="neutral" loading={loading} />
          <StatCard label="Avg. Processing Time (hrs)" value={overview?.avgResolutionHours ?? 0} icon={Clock} accent="neutral" loading={loading} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="System-Wide Status" className="lg:col-span-1">
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

        <SectionCard title="Submission Trend" description="System-wide, last 6 months" className="lg:col-span-2">
          <TrendChart data={overview?.monthlyTrend ?? []} loading={loading} height={200} />
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Department Performance" actionHref="/analytics" actionLabel="Full report" icon={<Building2 className="h-4.5 w-4.5" />}>
          <RankedList
            loading={loading}
            rows={topDepartments.map((d) => ({
              id: d.departmentId,
              name: d.departmentName,
              primaryMetric: `${d.total} apps`,
              secondaryMetric: `${d.avgResolutionHours}h avg`,
              percent: (d.total / maxDeptTotal) * 100,
            }))}
            emptyLabel="No department activity yet."
          />
        </SectionCard>

        <SectionCard title="Supervisor Performance" actionHref="/analytics" actionLabel="Full report" icon={<Users className="h-4.5 w-4.5" />}>
          <RankedList
            loading={loading}
            rows={topSupervisors.map((s) => ({
              id: s.supervisorId,
              name: s.supervisorName,
              primaryMetric: `${s.total} apps`,
              secondaryMetric: `${s.avgResolutionHours}h avg`,
              percent: (s.total / maxSupTotal) * 100,
            }))}
            emptyLabel="No supervisor activity yet."
          />
        </SectionCard>
      </div>

      <SectionCard title="Recent Activity" actionHref="/admin/audit-logs" actionLabel="View audit logs" icon={<ScrollText className="h-4.5 w-4.5" />}>
        <ActivityTimeline
          loading={loading}
          entries={(admin?.recentActivity ?? []).map((a) => ({
            id: a.id,
            title: (
              <>
                <span className="font-medium text-neutral-900">{a.actorName}</span> — {a.description}
              </>
            ),
            timestamp: a.occurredAt,
          }))}
        />
      </SectionCard>

      <SectionCard title="Quick Actions">
        <QuickActions
          actions={[
            { href: '/admin/users', label: 'User Management', description: 'Manage accounts & roles', icon: UserCog },
            { href: '/admin/departments', label: 'Departments', description: 'Manage departments', icon: Building2 },
            { href: '/admin/routing-rules', label: 'Routing Rules', description: 'Application routing config', icon: Route },
            { href: '/admin/audit-logs', label: 'Audit Logs', description: 'System activity trail', icon: ScrollText },
            { href: '/analytics', label: 'Reports & Analytics', description: 'System-wide reporting', icon: FileText },
            { href: '/admin/settings', label: 'System Settings', description: 'Global configuration', icon: Settings },
          ]}
        />
      </SectionCard>
    </div>
  );
}
