'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

// Registration only ever collects basic account details — no role and no
// supervisor selection. New accounts start as Students; an administrator
// assigns the real role afterwards, and every user picks their own
// supervisor/authority later from their profile.
export default function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', {
        fullName,
        email,
        password,
        phoneNumber: phoneNumber || undefined,
      });
      setSuccess(true);
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string; errors?: { message: string }[] }>;
      const first = axiosErr.response?.data?.errors?.[0]?.message;
      setError(first || axiosErr.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="text-sm text-slate-600">
          We&apos;ve sent a verification link to <strong>{email}</strong>. Verify your
          address, then{' '}
          <button className="text-brand-600 underline" onClick={() => router.push('/login')}>
            sign in
          </button>
          .
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-12 max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Create your account</h1>
      <form onSubmit={handleSubmit}>
        <Input label="Full Name" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <Input
          label="University Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm Password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <Button type="submit" loading={loading} className="w-full">
          Create Account
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/login" className="text-brand-600 hover:underline">
          Log in
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-slate-400">
        Your role, department, and other details will be set up by an administrator, or you can add them
        from your profile after logging in.
      </p>
    </Card>
  );
}
