import { ReactNode } from 'react';

interface WelcomeHeaderProps {
  name: string;
  roleLabel: string;
  actions?: ReactNode;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Time-of-day-aware welcome hero shared by every role dashboard. */
export default function WelcomeHeader({ name, roleLabel, actions }: WelcomeHeaderProps) {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
          {greeting()}, {name.split(' ')[0]}
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          {roleLabel} · {today}
        </p>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2.5">{actions}</div>}
    </div>
  );
}
