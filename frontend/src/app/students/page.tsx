'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { StudentSummary } from '@/types';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/users/my-students')
      .then((res) => setStudents(res.data.data.students))
      .catch(() => setError('Unable to load your assigned students right now.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Assigned Students</h1>
        <p className="mb-6 text-sm text-slate-500">Students who selected you as their Academic Supervisor.</p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Registration #</th>
                  <th className="py-2 pr-4">Program</th>
                  <th className="py-2 pr-4">Semester</th>
                  <th className="py-2 pr-4">Applications</th>
                  <th className="py-2 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100">
                    <td className="py-2 pr-4 font-medium text-slate-700">
                      <Link href={`/students/${s.id}`} className="text-brand-700 hover:underline">
                        {s.fullName}
                      </Link>
                      <div className="text-xs text-slate-400">{s.email}</div>
                    </td>
                    <td className="py-2 pr-4">{s.registrationNumber || '—'}</td>
                    <td className="py-2 pr-4">{s.program || '—'}</td>
                    <td className="py-2 pr-4">{s.semester ?? '—'}</td>
                    <td className="py-2 pr-4">{s.applicationsCount}</td>
                    <td className="py-2 pr-4">
                      <Badge className={s.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-600'}>
                        {s.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      No students are currently assigned to you.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
