'use client';

import { useEffect, useState } from 'react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import api from '@/lib/api';
import { DepartmentReportRow, SupervisorReportRow } from '@/types';

function DeptRow({ d }: { d: DepartmentReportRow }) {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2 pr-4">{d.departmentName}</td>
      <td className="py-2 pr-4">{d.total}</td>
      <td className="py-2 pr-4">{d.pending}</td>
      <td className="py-2 pr-4">{d.overdue}</td>
      <td className="py-2 pr-4">{d.avgResolutionHours}</td>
      <td className="py-2 pr-4">{d.escalationCount}</td>
    </tr>
  );
}

// Dean Portal's Department Performance view, per spec: slow departments,
// fast departments, supervisor performance, and escalation frequency. Same
// underlying data as /analytics (avgResolutionHours, escalationCount per
// department), just sliced and sorted the way a Dean actually wants to
// read it — who's falling behind and who's escalating the most.
export default function DeanPerformancePage() {
  const [departments, setDepartments] = useState<DepartmentReportRow[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/analytics/departments'), api.get('/analytics/supervisors')])
      .then(([deptRes, supRes]) => {
        setDepartments(deptRes.data.data.departments);
        setSupervisors(supRes.data.data.supervisors);
      })
      .catch(() => setError('Unable to load department performance right now.'))
      .finally(() => setLoading(false));
  }, []);

  const withActivity = departments.filter((d) => d.total > 0);
  const slowest = [...withActivity].sort((a, b) => b.avgResolutionHours - a.avgResolutionHours).slice(0, 5);
  const fastest = [...withActivity].sort((a, b) => a.avgResolutionHours - b.avgResolutionHours).slice(0, 5);
  const mostEscalating = [...departments].sort((a, b) => b.escalationCount - a.escalationCount).slice(0, 5);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Department Performance</h1>
          <p className="mt-1 text-sm text-slate-500">
            Slow and fast departments, supervisor performance, and escalation frequency across the university.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {loading && <p className="text-sm text-slate-500">Loading…</p>}

        {!loading && (
          <>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <h2 className="mb-3 font-medium text-slate-900">Slowest Departments</h2>
                <p className="mb-3 text-xs text-slate-500">Highest average resolution time.</p>
                {slowest.length === 0 ? (
                  <p className="text-sm text-slate-500">No department activity yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {slowest.map((d) => (
                      <li key={d.departmentId} className="flex items-center justify-between">
                        <span className="text-slate-800">{d.departmentName}</span>
                        <span className="text-slate-500">{d.avgResolutionHours} hrs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card>
                <h2 className="mb-3 font-medium text-slate-900">Fastest Departments</h2>
                <p className="mb-3 text-xs text-slate-500">Lowest average resolution time.</p>
                {fastest.length === 0 ? (
                  <p className="text-sm text-slate-500">No department activity yet.</p>
                ) : (
                  <ul className="space-y-2 text-sm">
                    {fastest.map((d) => (
                      <li key={d.departmentId} className="flex items-center justify-between">
                        <span className="text-slate-800">{d.departmentName}</span>
                        <span className="text-slate-500">{d.avgResolutionHours} hrs</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>

            <Card>
              <h2 className="mb-3 font-medium text-slate-900">Escalation Frequency</h2>
              <p className="mb-3 text-xs text-slate-500">Departments whose applications escalate past them most often.</p>
              {mostEscalating.every((d) => d.escalationCount === 0) ? (
                <p className="text-sm text-slate-500">No escalations recorded.</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {mostEscalating.map((d) => (
                    <li key={d.departmentId} className="flex items-center justify-between">
                      <span className="text-slate-800">{d.departmentName}</span>
                      <span className="text-slate-500">{d.escalationCount} escalation(s)</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="overflow-x-auto">
              <h2 className="mb-3 font-medium text-slate-900">All Departments</h2>
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4">Department</th>
                    <th className="py-2 pr-4">Total</th>
                    <th className="py-2 pr-4">Pending</th>
                    <th className="py-2 pr-4">Overdue</th>
                    <th className="py-2 pr-4">Avg Resolution (hrs)</th>
                    <th className="py-2 pr-4">Escalation Frequency</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((d) => (
                    <DeptRow key={d.departmentId} d={d} />
                  ))}
                  {departments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-500">
                        No department activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Card>

            <Card className="overflow-x-auto">
              <h2 className="mb-3 font-medium text-slate-900">Supervisor Performance</h2>
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
    </ProtectedRoute>
  );
}
