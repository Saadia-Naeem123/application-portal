'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import { StatusPill } from '@/components/applications/StatusPill';
import { formatDate, formatDateTime } from '@/lib/format';
import { Application, Holiday, SemesterBreak } from '@/types';

const HOLIDAY_TYPE_LABELS: Record<string, string> = {
  PUBLIC: 'Public Holiday',
  UNIVERSITY: 'University Holiday',
  SPECIAL: 'Special Holiday',
};

export default function CalendarPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [semesterBreaks, setSemesterBreaks] = useState<SemesterBreak[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const today = new Date();
    const from = today.toISOString().slice(0, 10);
    const to = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate()).toISOString().slice(0, 10);

    Promise.all([
      api.get('/calendar', { params: { from, to } }),
      api.get('/applications', { params: { pageSize: 100 } }),
    ])
      .then(([calendarRes, applicationsRes]) => {
        setHolidays(calendarRes.data.data.holidays);
        setSemesterBreaks(calendarRes.data.data.semesterBreaks);
        setApplications(applicationsRes.data.data.applications);
      })
      .catch(() => setError('Unable to load the calendar.'))
      .finally(() => setLoading(false));
  }, []);

  const upcomingDeadlines = applications
    .filter((a) => a.deadlineAt)
    .sort((a, b) => new Date(a.deadlineAt as string).getTime() - new Date(b.deadlineAt as string).getTime());

  const submitted = applications
    .filter((a) => a.submittedAt)
    .sort((a, b) => new Date(b.submittedAt as string).getTime() - new Date(a.submittedAt as string).getTime());

  const upcomingHolidays = holidays
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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
        <h1 className="text-2xl font-semibold text-slate-900">Calendar</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">Upcoming Deadlines</h2>
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-slate-500">No pending applications with an active deadline.</p>
          ) : (
            <ul className="space-y-3">
              {upcomingDeadlines.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/applications/${a.id}`} className="font-medium text-slate-800 hover:text-brand-600">
                      {a.subject}
                    </Link>
                    <p className="text-xs text-slate-400">{a.applicationNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-700">{formatDateTime(a.deadlineAt)}</p>
                    <StatusPill status={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">Submitted Applications</h2>
          {submitted.length === 0 ? (
            <p className="text-sm text-slate-500">You haven&apos;t submitted any applications yet.</p>
          ) : (
            <ul className="space-y-2">
              {submitted.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-sm">
                  <Link href={`/applications/${a.id}`} className="text-slate-800 hover:text-brand-600">
                    {a.subject}
                  </Link>
                  <span className="text-xs text-slate-400">{formatDate(a.submittedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">University Holidays</h2>
          {upcomingHolidays.length === 0 && semesterBreaks.length === 0 ? (
            <p className="text-sm text-slate-500">No holidays or semester breaks in the next 3 months.</p>
          ) : (
            <>
              <ul className="mb-4 space-y-2">
                {upcomingHolidays.map((h) => (
                  <li key={h.id} className="flex items-center justify-between text-sm">
                    <span className="text-slate-800">{h.name}</span>
                    <span className="text-xs text-slate-400">
                      {formatDate(h.date)} · {HOLIDAY_TYPE_LABELS[h.type] || h.type}
                    </span>
                  </li>
                ))}
              </ul>
              {semesterBreaks.length > 0 && (
                <>
                  <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Semester Breaks
                  </h3>
                  <ul className="space-y-2">
                    {semesterBreaks.map((b) => (
                      <li key={b.id} className="flex items-center justify-between text-sm">
                        <span className="text-slate-800">{b.name}</span>
                        <span className="text-xs text-slate-400">
                          {formatDate(b.startDate)} – {formatDate(b.endDate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
