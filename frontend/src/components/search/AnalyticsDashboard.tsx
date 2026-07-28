'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { AnalyticsOverview, DepartmentReportRow, SupervisorReportRow } from '@/types';

const REPORT_ROLES = ['ADMIN', 'DEAN', 'DEPARTMENT_OFFICER'];

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">{label}</p>
    </Card>
  );
}

async function downloadExport(type: 'overview' | 'departments' | 'supervisors', format: 'xlsx' | 'pdf') {
  const res = await api.get(`/analytics/export?type=${type}&format=${format}`, { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([res.data]));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${type}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function AnalyticsDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [departments, setDepartments] = useState<DepartmentReportRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorReportRow[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const canSeeReports = Boolean(user && REPORT_ROLES.includes(user.role));

  useEffect(() => {
    async function load() {
      try {
        const overviewRes = await api.get('/analytics/overview');
        setOverview(overviewRes.data.data);

        if (canSeeReports) {
          const [deptRes, supRes] = await Promise.all([
            api.get('/analytics/departments'),
            api.get('/analytics/supervisors'),
          ]);
          setDepartments(deptRes.data.data.departments);
          setSupervisors(supRes.data.data.supervisors);
        }
      } catch {
        setError('Unable to load analytics right now.');
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSeeReports]);

  if (loading) return <p className="text-sm text-slate-500">Loading analytics…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!overview) return null;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total" value={overview.totals.total} />
        <StatCard label="Pending" value={overview.totals.pending} />
        <StatCard label="Approved" value={overview.totals.approved} />
        <StatCard label="Rejected" value={overview.totals.rejected} />
        <StatCard label="Escalated" value={overview.totals.escalated} />
        <StatCard label="Closed" value={overview.totals.closed} />
        <StatCard label="Overdue" value={overview.totals.overdue} />
        <StatCard label="Near Deadline" value={overview.totals.nearDeadline} />
      </div>

      <Card>
        <p className="text-sm text-slate-600">
          Average resolution time: <strong>{overview.avgResolutionHours} hours</strong>
        </p>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-medium text-slate-900">Monthly Submission Trend</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <LineChart data={overview.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#3b5bdb" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">Most Common Categories</h2>
          <div style={{ width: '100%', height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={overview.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="applicationType" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b5bdb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => downloadExport('overview', 'xlsx')}>
          Export Overview (Excel)
        </Button>
        <Button variant="secondary" onClick={() => downloadExport('overview', 'pdf')}>
          Export Overview (PDF)
        </Button>
      </div>

      {canSeeReports && (
        <>
          <Card className="overflow-x-auto">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-slate-900">Department Performance</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => downloadExport('departments', 'xlsx')}>
                  Excel
                </Button>
                <Button variant="secondary" onClick={() => downloadExport('departments', 'pdf')}>
                  PDF
                </Button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Approved</th>
                  <th className="py-2 pr-4">Rejected</th>
                  <th className="py-2 pr-4">Pending</th>
                  <th className="py-2 pr-4">Overdue</th>
                  <th className="py-2 pr-4">Avg Resolution (hrs)</th>
                  <th className="py-2 pr-4">Escalation Frequency</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((d) => (
                  <tr key={d.departmentId} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{d.departmentName}</td>
                    <td className="py-2 pr-4">{d.total}</td>
                    <td className="py-2 pr-4">{d.approved}</td>
                    <td className="py-2 pr-4">{d.rejected}</td>
                    <td className="py-2 pr-4">{d.pending}</td>
                    <td className="py-2 pr-4">{d.overdue}</td>
                    <td className="py-2 pr-4">{d.avgResolutionHours}</td>
                    <td className="py-2 pr-4">{d.escalationCount}</td>
                  </tr>
                ))}
                {departments.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-4 text-center text-slate-500">
                      No department activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>

          <Card className="overflow-x-auto">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-medium text-slate-900">Supervisor Performance</h2>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => downloadExport('supervisors', 'xlsx')}>
                  Excel
                </Button>
                <Button variant="secondary" onClick={() => downloadExport('supervisors', 'pdf')}>
                  PDF
                </Button>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Supervisor</th>
                  <th className="py-2 pr-4">Department</th>
                  <th className="py-2 pr-4">Total</th>
                  <th className="py-2 pr-4">Approved</th>
                  <th className="py-2 pr-4">Rejected</th>
                  <th className="py-2 pr-4">Pending</th>
                  <th className="py-2 pr-4">Avg Resolution (hrs)</th>
                </tr>
              </thead>
              <tbody>
                {supervisors.map((s) => (
                  <tr key={s.supervisorId} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{s.supervisorName}</td>
                    <td className="py-2 pr-4">{s.department || '—'}</td>
                    <td className="py-2 pr-4">{s.total}</td>
                    <td className="py-2 pr-4">{s.approved}</td>
                    <td className="py-2 pr-4">{s.rejected}</td>
                    <td className="py-2 pr-4">{s.pending}</td>
                    <td className="py-2 pr-4">{s.avgResolutionHours}</td>
                  </tr>
                ))}
                {supervisors.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500">
                      No supervisor activity yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  );
}
