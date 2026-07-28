'use client';

import { useState, FormEvent } from 'react';
import api from '@/lib/api';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
    } finally {
      setLoading(false);
      setSent(true); // always show the same message, whether or not the email exists
    }
  };

  if (sent) {
    return (
      <Card className="mx-auto mt-12 max-w-md text-center">
        <h1 className="mb-2 text-xl font-semibold text-slate-900">Check your email</h1>
        <p className="text-sm text-slate-600">
          If an account exists for <strong>{email}</strong>, a password reset link has been sent.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mx-auto mt-12 max-w-md">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Forgot your password?</h1>
      <form onSubmit={handleSubmit}>
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button type="submit" loading={loading} className="w-full">
          Send reset link
        </Button>
      </form>
    </Card>
  );
}
