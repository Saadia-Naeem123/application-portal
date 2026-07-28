'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('This verification link is missing its token.');
      return;
    }
    api
      .get(`/auth/verify-email/${token}`)
      .then(() => setStatus('success'))
      .catch((err) => {
        setStatus('error');
        setMessage(err?.response?.data?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  return (
    <Card className="mx-auto mt-12 max-w-md text-center">
      {status === 'verifying' && <p className="text-sm text-slate-600">Verifying your email…</p>}
      {status === 'success' && (
        <>
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Email verified!</h1>
          <p className="mb-4 text-sm text-slate-600">Your account is now active.</p>
          <Link href="/login">
            <Button>Go to login</Button>
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <h1 className="mb-2 text-xl font-semibold text-slate-900">Verification failed</h1>
          <p className="text-sm text-slate-600">{message}</p>
        </>
      )}
    </Card>
  );
}
