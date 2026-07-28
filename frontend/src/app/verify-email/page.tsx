import { Suspense } from 'react';
import VerifyEmailStatus from '@/components/forms/VerifyEmailStatus';

export default function VerifyEmailPage() {
  return (
    <div className="px-4">
      <Suspense fallback={<div className="mx-auto mt-12 max-w-md text-center text-sm text-slate-500">Loading…</div>}>
        <VerifyEmailStatus />
      </Suspense>
    </div>
  );
}
