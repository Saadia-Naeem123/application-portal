'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import { STATUS_LABELS, ApplicationStatus } from '@/types';

interface TimelineEntry {
  id: string;
  action: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  remarks: string | null;
  actor: { id: string; fullName: string; role: string } | null;
  occurredAt: string;
}

interface Tracking {
  applicationNumber: string;
  currentStatus: ApplicationStatus;
  currentStage: string | null;
  progressPercent: number;
  deadlineAt: string | null;
  isOverdue: boolean;
  submittedAt: string | null;
  closedAt: string | null;
  timeline: TimelineEntry[];
}

export default function TrackingTimeline({ applicationId }: { applicationId: string }) {
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/applications/${applicationId}/tracking`)
      .then((res) => setTracking(res.data.data.tracking))
      .catch(() => setError('Unable to load tracking information for this application.'))
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!tracking) return null;

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium text-slate-900">{tracking.applicationNumber}</h2>
          {tracking.isOverdue && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-700">Overdue</span>
          )}
        </div>
        <p className="mb-3 text-sm text-slate-600">
          Current status: <strong>{STATUS_LABELS[tracking.currentStatus]}</strong>
          {tracking.deadlineAt && (
            <>
              {' '}
              — deadline {new Date(tracking.deadlineAt).toLocaleString()}
            </>
          )}
        </p>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-500 transition-all"
            style={{ width: `${tracking.progressPercent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">{tracking.progressPercent}% complete</p>
      </Card>

      <Card>
        <h2 className="mb-4 font-medium text-slate-900">Status Timeline</h2>
        <ol className="space-y-4 border-l border-slate-200 pl-4">
          {tracking.timeline.map((entry) => (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-brand-500" />
              <p className="text-sm font-medium text-slate-900">
                {entry.action.replaceAll('_', ' ')}
                {entry.toStatus ? ` → ${STATUS_LABELS[entry.toStatus]}` : ''}
              </p>
              <p className="text-xs text-slate-500">
                {new Date(entry.occurredAt).toLocaleString()}
                {entry.actor ? ` · ${entry.actor.fullName}` : ' · System'}
              </p>
              {entry.remarks && <p className="mt-1 text-sm text-slate-600">{entry.remarks}</p>}
            </li>
          ))}
          {tracking.timeline.length === 0 && (
            <p className="text-sm text-slate-500">No activity recorded yet.</p>
          )}
        </ol>
      </Card>
    </div>
  );
}
