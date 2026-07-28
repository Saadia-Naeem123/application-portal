import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function ReviewedApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Reviewed Applications</h1>
        <p className="mb-6 text-sm text-slate-500">
          Applications you have already acted on — approved, rejected, forwarded, or awaiting the student&apos;s reply.
        </p>
        <ReviewQueueTable
          status="UNDER_DEPARTMENT_REVIEW,AWAITING_INFO,APPROVED,REJECTED,ESCALATED,CLOSED"
          emptyMessage="You haven't reviewed any applications yet."
          sortBy="createdAt"
          sortOrder="desc"
        />
      </div>
    </ProtectedRoute>
  );
}
