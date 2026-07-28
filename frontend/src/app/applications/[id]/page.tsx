'use client';

import { useEffect, useState, useCallback, ChangeEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { StatusPill, PriorityPill } from '@/components/applications/StatusPill';
import CommentThread from '@/components/applications/CommentThread';
import ReviewActionPanel from '@/components/applications/ReviewActionPanel';
import AdminCloseControl from '@/components/applications/AdminCloseControl';
import TrackingTimeline from '@/components/search/TrackingTimeline';
import { formatDateTime, formatFileSize } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';
import { Application, EDITABLE_STATUSES } from '@/types';

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;
  const { user } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resuming, setResuming] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/applications/${id}`)
      .then((res) => setApplication(res.data.data.application))
      .catch(() => setError('Unable to load this application, or you do not have access to it.'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    if (!application || !e.target.files || e.target.files.length === 0) return;
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => formData.append('files', file));
    setBusy(true);
    setActionError('');
    try {
      const res = await api.post(`/applications/${application.id}/attachments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setApplication({ ...application, attachments: [...application.attachments, ...res.data.data.attachments] });
    } catch {
      setActionError('Failed to upload document(s).');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };

  const downloadAttachment = (attachmentId: string) => {
    if (!application) return;
    api
      .get(`/applications/${application.id}/attachments/${attachmentId}/download`, { responseType: 'blob' })
      .then((res) => {
        const url = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', '');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => setActionError('Failed to download document.'));
  };

  const handleWithdraw = async () => {
    if (!application) return;
    if (!confirm('Withdraw this application? This cannot be undone.')) return;
    setBusy(true);
    setActionError('');
    try {
      await api.delete(`/applications/${application.id}`);
      router.push('/applications');
    } catch {
      setActionError('Failed to withdraw application.');
      setBusy(false);
    }
  };

  // AWAITING_INFO: the reviewer paused the SLA clock and asked for more
  // detail/documents. The student replies via a comment (optionally with
  // attachments), then resumes the stage with provide-info.
  const handleResume = async () => {
    if (!application) return;
    setResuming(true);
    setActionError('');
    try {
      const res = await api.patch(`/applications/${application.id}/provide-info`, {});
      setApplication(res.data.data.application);
    } catch {
      setActionError('Failed to resume review. Please try again.');
    } finally {
      setResuming(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl px-4 py-10 text-sm text-slate-500">Loading…</div>
      </ProtectedRoute>
    );
  }

  if (error || !application) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl px-4 py-10">
          <p className="text-sm text-red-600">{error || 'Application not found.'}</p>
          <Link href="/applications" className="mt-4 inline-block text-sm text-brand-600 hover:underline">
            ← Back to My Applications
          </Link>
        </div>
      </ProtectedRoute>
    );
  }

  const isDraft = EDITABLE_STATUSES.includes(application.status);
  const isAwaitingInfo = application.status === 'AWAITING_INFO';
  const isFinal = ['APPROVED', 'REJECTED', 'CLOSED'].includes(application.status);

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6 print:max-w-full">
        <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
          <div>
            <Link href="/applications" className="text-xs text-brand-600 hover:underline">
              ← Back to My Applications
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900">{application.subject}</h1>
            <p className="text-sm text-slate-500">{application.applicationNumber}</p>
          </div>
          <Button variant="secondary" onClick={() => window.print()}>
            Print Receipt
          </Button>
        </div>

        <Card>
          <div className="mb-4 flex flex-wrap items-center gap-2 print:mb-2">
            <StatusPill status={application.status} />
            <PriorityPill priority={application.priority} />
          </div>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-400">Application Type</dt>
              <dd className="text-slate-800">{application.applicationType?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Department</dt>
              <dd className="text-slate-800">{application.department?.name || 'Not yet assigned'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Academic Supervisor</dt>
              <dd className="text-slate-800">{application.supervisor?.fullName || 'Not required for this type'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Currently With</dt>
              <dd className="text-slate-800">{application.assignedOfficer?.fullName || '—'}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Submitted</dt>
              <dd className="text-slate-800">{formatDateTime(application.submittedAt)}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Deadline</dt>
              <dd className="text-slate-800">{formatDateTime(application.deadlineAt)}</dd>
            </div>
          </dl>
          <div className="mt-4">
            <dt className="text-sm text-slate-400">Description</dt>
            <dd className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{application.description}</dd>
          </div>
        </Card>

        {actionError && <p className="text-sm text-red-600 print:hidden">{actionError}</p>}

        <Card>
          <h2 className="mb-1 font-medium text-slate-900">Documents</h2>
          {isDraft && (
            <>
              <p className="mb-4 text-sm text-slate-500 print:hidden">
                Add supporting documents while this application is still a draft.
              </p>
              <input
                type="file"
                multiple
                onChange={handleUpload}
                disabled={busy}
                className="mb-4 block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 print:hidden"
              />
            </>
          )}
          {application.attachments.length === 0 ? (
            <p className="text-sm text-slate-500">No documents attached.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {application.attachments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2 text-sm">
                  <span className="text-slate-700">
                    {a.fileName} <span className="text-slate-400">({formatFileSize(a.size)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => downloadAttachment(a.id)}
                    className="text-xs font-medium text-brand-600 hover:underline print:hidden"
                  >
                    Download
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {isAwaitingInfo && (
          <Card className="border-amber-200 bg-amber-50 print:hidden">
            <h2 className="mb-1 font-medium text-amber-900">Additional Information Requested</h2>
            <p className="mb-4 text-sm text-amber-800">
              Reply below with the requested details (attach documents if needed), then resume review.
            </p>
            <Button onClick={handleResume} loading={resuming}>
              I&apos;ve Replied — Resume Review
            </Button>
          </Card>
        )}

        <ReviewActionPanel application={application} onUpdated={setApplication} />

        {user?.role === 'ADMIN' && application.status !== 'CLOSED' && (
          <AdminCloseControl application={application} onUpdated={setApplication} />
        )}

        <div className="print:hidden">
          <TrackingTimeline key={application.updatedAt} applicationId={application.id} />
        </div>

        <div className="print:hidden">
          <CommentThread applicationId={application.id} onAfterPost={load} />
        </div>

        <div className="flex flex-wrap gap-3 print:hidden">
          {isDraft && (
            <>
              <Link href={`/applications/new?id=${application.id}`}>
                <Button variant="secondary">Continue Editing</Button>
              </Link>
              <Button variant="danger" loading={busy} onClick={handleWithdraw}>
                Withdraw
              </Button>
            </>
          )}
          {isFinal && application.status === 'APPROVED' && application.attachments.length > 0 && (
            <p className="text-sm text-slate-500">
              Your approved documents are available for download above.
            </p>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
