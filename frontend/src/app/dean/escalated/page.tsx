import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function DeanEscalatedApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Escalated Applications</h1>
        <p className="mb-6 text-sm text-slate-500">
          Applications that have escalated all the way up to you. Open one to view its full history and reviewer
          actions, then approve, reject, return it to the department, or request further investigation.
        </p>
        <ReviewQueueTable
          status="ESCALATED"
          currentStage="DEAN"
          emptyMessage="No applications are currently escalated to you."
        />
      </div>
    </ProtectedRoute>
  );
}
