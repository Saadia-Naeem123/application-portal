import ProtectedRoute from '@/components/layout/ProtectedRoute';
import TrackingTimeline from '@/components/search/TrackingTimeline';

export default function TrackingPage({ params }: { params: { id: string } }) {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Application Tracking</h1>
        <TrackingTimeline applicationId={params.id} />
      </div>
    </ProtectedRoute>
  );
}
