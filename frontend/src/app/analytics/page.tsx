import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AnalyticsDashboard from '@/components/search/AnalyticsDashboard';

export default function AnalyticsPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Analytics & Reporting</h1>
        <AnalyticsDashboard />
      </div>
    </ProtectedRoute>
  );
}
