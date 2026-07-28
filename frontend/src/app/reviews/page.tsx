import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function PendingReviewsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Pending Reviews</h1>
        <p className="mb-6 text-sm text-slate-500">Applications currently awaiting your review.</p>
        <ReviewQueueTable status="UNDER_SUPERVISOR_REVIEW" emptyMessage="Nothing awaiting your review right now." />
      </div>
    </ProtectedRoute>
  );
}
