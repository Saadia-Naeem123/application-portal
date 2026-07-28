import { Suspense } from 'react';
import ResetPasswordForm from '@/components/forms/ResetPasswordForm';

export default function ResetPasswordPage() {
  return (
    <div className="px-4">
      <Suspense fallback={<div className="mx-auto mt-12 max-w-md text-center text-sm text-slate-500">Loading…</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
