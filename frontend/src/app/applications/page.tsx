'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { StatusPill, PriorityPill } from '@/components/applications/StatusPill';
import { formatDateTime } from '@/lib/format';
import { Application, ApplicationStatus, STATUS_LABELS } from '@/types';

const PAGE_SIZE = 10;

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api
      .get('/applications', { params: { status: status || undefined, page, pageSize: PAGE_SIZE } })
      .then((res) => {
        setApplications(res.data.data.applications);
        setTotal(res.data.data.total);
      })
      .catch(() => setError('Unable to load your applications.'))
      .finally(() => setLoading(false));
  }, [status, page]);

  useEffect(() => {
    load();
  }, [load]);

  const withdrawDraft = async (id: string) => {
    if (!confirm('Withdraw this draft application? This cannot be undone.')) return;
    setWithdrawingId(id);
    try {
      await api.delete(`/applications/${id}`);
      load();
    } catch {
      setError('Failed to withdraw application.');
    } finally {
      setWithdrawingId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-900">My Applications</h1>
          <Link href="/applications/new">
            <Button>New Application</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <Select
            label="Filter by status"
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as ApplicationStatus | '');
            }}
            className="max-w-xs"
          >
            <option value="">All statuses</option>
            {(Object.keys(STATUS_LABELS) as ApplicationStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </Card>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : applications.length === 0 ? (
          <Card>
            <p className="text-sm text-slate-500">
              You haven&apos;t submitted any applications yet.{' '}
              <Link href="/applications/new" className="font-medium text-brand-600 hover:underline">
                Start a new application
              </Link>
              .
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/applications/${app.id}`}
                        className="font-medium text-slate-900 hover:text-brand-600"
                      >
                        {app.subject}
                      </Link>
                      <StatusPill status={app.status} />
                      <PriorityPill priority={app.priority} />
                    </div>
                    <p className="text-xs text-slate-500">
                      {app.applicationNumber} · {app.applicationType?.name || 'Unknown type'}
                      {app.department?.name ? ` · ${app.department.name}` : ''}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {app.status === 'DRAFT'
                        ? `Last updated ${formatDateTime(app.updatedAt)}`
                        : `Submitted ${formatDateTime(app.submittedAt)}`}
                      {app.deadlineAt && ` · Deadline ${formatDateTime(app.deadlineAt)}`}
                    </p>
                  </div>
                  <div className="flex flex-shrink-0 gap-2">
                    <Link href={`/applications/${app.id}`}>
                      <Button variant="secondary">View</Button>
                    </Link>
                    {app.status === 'DRAFT' && (
                      <Button
                        variant="danger"
                        loading={withdrawingId === app.id}
                        onClick={() => withdrawDraft(app.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3 text-sm">
            <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="text-slate-500">
              Page {page} of {totalPages}
            </span>
            <Button variant="secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
