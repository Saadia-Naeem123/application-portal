import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function EscalatedApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Escalated Applications</h1>
        <p className="mb-6 text-sm text-slate-500">
          Applications from your department that have escalated past the normal review deadline. If you are your
          department&apos;s head, department-head-level escalations still awaiting a decision can be actioned by
          opening them below.
        </p>
        <ReviewQueueTable status="ESCALATED" emptyMessage="No escalated applications right now." />
      </div>
    </ProtectedRoute>
  );
}
