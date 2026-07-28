'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!token) {
      setError('Reset link is missing its token. Please use the link from your email.');
      return;
    }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Unable to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Password updated</h1>
        <p className="mb-4 text-sm text-slate-600">You can now sign in with your new password.</p>
        <Button onClick={() => router.push('/login')}>Go to login</Button>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-12 max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Choose a new password</h1>
      <form onSubmit={handleSubmit}>
        <Input
          label="New Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm New Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Reset Password
        </Button>
      </form>
    </Card>
  );
}
