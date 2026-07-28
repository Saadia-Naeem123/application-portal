import ProtectedRoute from '@/components/layout/ProtectedRoute';
import SearchPanel from '@/components/search/SearchPanel';

export default function SearchPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="mb-6 text-2xl font-semibold text-slate-900">Search Applications</h1>
        <SearchPanel />
      </div>
    </ProtectedRoute>
  );
}
