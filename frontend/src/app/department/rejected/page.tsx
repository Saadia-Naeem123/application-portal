import ProtectedRoute from '@/components/layout/ProtectedRoute';
import ReviewQueueTable from '@/components/applications/ReviewQueueTable';

export default function RejectedApplicationsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-1 text-2xl font-semibold text-slate-900">Rejected Applications</h1>
        <p className="mb-6 text-sm text-slate-500">Applications your department has rejected.</p>
        <ReviewQueueTable
          status="REJECTED"
          emptyMessage="No rejected applications yet."
          sortBy="createdAt"
          sortOrder="desc"
        />
      </div>
    </ProtectedRoute>
  );
}
