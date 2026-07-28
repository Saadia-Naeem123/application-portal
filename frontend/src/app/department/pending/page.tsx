import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function PendingDepartmentRequestsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Pending Department Requests</h1>
        <p className="mb-6 text-sm text-slate-500">
          Applications routed to your department that are awaiting your review.
        </p>
        <ReviewQueueTable status="UNDER_DEPARTMENT_REVIEW" emptyMessage="Nothing awaiting your review right now." />
      </div>
    </ProtectedRoute>
  );
}
