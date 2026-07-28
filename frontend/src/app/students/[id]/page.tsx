'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import { StatusPill, PriorityPill } from '@/components/applications/StatusPill';
import { formatDate, formatDateTime } from '@/lib/format';
import { ApplicationSummary, StudentSummary } from '@/types';

export default function StudentProfilePage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [student, setStudent] = useState<StudentSummary | null>(null);
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/users/my-students'),
      api.get('/search/applications', { params: { applicantId: id, pageSize: 100, sortBy: 'createdAt', sortOrder: 'desc' } }),
    ])
      .then(([studentsRes, appsRes]) => {
        const found = (studentsRes.data.data.students as StudentSummary[]).find((s) => s.id === id);
        setStudent(found || null);
        setApplications(appsRes.data.data.applications);
        if (!found) setError('This student is not assigned to you.');
      })
      .catch(() => setError('Unable to load this student right now.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Loading…</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <Link href="/students" className="text-xs text-brand-600 hover:underline">
          ← Back to Students
        </Link>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {student && (
          <>
            <Card>
              <h1 className="text-2xl font-semibold text-slate-900">{student.fullName}</h1>
              <p className="text-sm text-slate-500">{student.email}</p>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-400">Registration Number</dt>
                  <dd className="text-slate-800">{student.registrationNumber || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Program</dt>
                  <dd className="text-slate-800">{student.program || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Semester</dt>
                  <dd className="text-slate-800">{student.semester ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Department</dt>
                  <dd className="text-slate-800">{student.department || '—'}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Total Applications (with you)</dt>
                  <dd className="text-slate-800">{student.applicationsCount}</dd>
                </div>
                <div>
                  <dt className="text-slate-400">Student Since</dt>
                  <dd className="text-slate-800">{formatDate(student.createdAt)}</dd>
                </div>
              </dl>
            </Card>

            <Card>
              <h2 className="mb-3 font-medium text-slate-900">Application History</h2>
              {applications.length === 0 ? (
                <p className="text-sm text-slate-500">No applications from this student yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {applications.map((a) => (
                    <li key={a.id} className="flex items-center justify-between py-3 text-sm">
                      <div>
                        <Link href={`/applications/${a.id}`} className="font-medium text-brand-700 hover:underline">
                          {a.subject}
                        </Link>
                        <p className="text-xs text-slate-400">
                          {a.applicationNumber} · {a.applicationType?.name || '—'} · {formatDateTime(a.submittedAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityPill priority={a.priority} />
                        <StatusPill status={a.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
