'use client';

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';

const FAQS = [
  {
    q: 'How do I submit a new application?',
    a: 'Go to New Application, choose the application type, fill in the details, and save it as a draft. You can attach supporting documents before submitting — once submitted it is automatically routed to the right reviewer.',
  },
  {
    q: 'Can I edit an application after submitting it?',
    a: 'No — once submitted, an application enters review and can no longer be edited or withdrawn. You can still add comments and, if a reviewer requests more information, reply with details or documents from the application page.',
  },
  {
    q: "Why can't I choose a department when submitting?",
    a: 'Routing is automatic. Every application type is pre-configured with the department (and, where required, the academic supervisor) that should review it, so applicants cannot assign or change this manually.',
  },
  {
    q: 'What does "Awaiting Additional Info" mean?',
    a: 'A reviewer has paused your application and asked for more details. Open the application, reply in the comments (with documents if needed), then use "Resume Review" to send it back to the reviewer.',
  },
  {
    q: 'How will I know when my application status changes?',
    a: 'You will receive an in-app notification (and email, if enabled) for approvals, rejections, information requests, comments, and escalations. Check the Notifications page or the bell icon for updates.',
  },
  {
    q: 'What happens if my application misses its deadline?',
    a: "Applications are automatically escalated one level up the review hierarchy if they aren't actioned within their SLA window, and you'll be notified when that happens.",
  },
];

export default function HelpPage() {
  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Help &amp; Support</h1>
          <p className="mt-1 text-sm text-slate-500">
            Answers to common questions about applications and how the review process works.
          </p>
        </div>

        <Card>
          <h2 className="mb-4 font-medium text-slate-900">Frequently Asked Questions</h2>
          <div className="divide-y divide-slate-100">
            {FAQS.map((item) => (
              <details key={item.q} className="group py-3">
                <summary className="cursor-pointer list-none text-sm font-medium text-slate-800 marker:content-none">
                  <span className="mr-2 inline-block text-brand-500 transition-transform group-open:rotate-90">
                    ›
                  </span>
                  {item.q}
                </summary>
                <p className="mt-2 pl-5 text-sm text-slate-600">{item.a}</p>
              </details>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-2 font-medium text-slate-900">Still need help?</h2>
          <p className="text-sm text-slate-600">
            Reach out to your Department Officer through the comment thread on a specific application, or contact
            the university IT / registrar&apos;s helpdesk for account and access issues.
          </p>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
