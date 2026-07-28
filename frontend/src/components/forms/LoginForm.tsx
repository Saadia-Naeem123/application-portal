'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { useAuth } from '@/context/AuthContext';
import { AxiosError } from 'axios';

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-12 max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Sign in</h1>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading} className="w-full">
          Sign in
        </Button>
      </form>
      <div className="mt-4 flex justify-between text-sm text-slate-600">
        <Link href="/forgot-password" className="hover:text-brand-600">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-brand-600">
          Create an account
        </Link>
      </div>
    </Card>
  );
}
