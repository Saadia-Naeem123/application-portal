import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HomePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-3xl font-bold text-slate-900">
        Smart University Complaint & Application Management System
      </h1>
      <p className="mt-4 text-slate-600">
        A centralized platform to submit, track, and resolve academic and
        administrative applications — with automated deadlines, escalation,
        and full transparency.
      </p>
      <div className="mt-8 flex justify-center gap-4">
        <Link href="/register">
          <Button>Create an account</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Sign in</Button>
        </Link>
      </div>
    </div>
  );
}
