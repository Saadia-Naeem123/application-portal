'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface MiniCalendarProps {
  /** ISO date strings (or datetimes) that should be marked with a dot */
  markedDates?: string[];
  className?: string;
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function toKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/**
 * Lightweight, dependency-free month calendar used to give deadline/holiday
 * widgets a visual "when" alongside their agenda list. No external date
 * library required — plain Date arithmetic only.
 */
export default function MiniCalendar({ markedDates = [], className }: MiniCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const markedKeys = useMemo(() => new Set(markedDates.filter(Boolean).map((d) => toKey(new Date(d)))), [markedDates]);

  const { weeks, monthLabel } = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: (Date | null)[] = Array(startOffset).fill(null);
    for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
    while (cells.length % 7 !== 0) cells.push(null);

    const weeksOut: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeksOut.push(cells.slice(i, i + 7));

    return {
      weeks: weeksOut,
      monthLabel: firstDay.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
    };
  }, [cursor]);

  const today = new Date();

  return (
    <div className={className}>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800">{monthLabel}</p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Previous month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            aria-label="Next month"
            onClick={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1.5 text-center">
        {WEEKDAYS.map((w, i) => (
          <span key={i} className="text-[11px] font-medium text-neutral-400">
            {w}
          </span>
        ))}

        {weeks.map((week, wi) =>
          week.map((d, di) => {
            if (!d) return <span key={`${wi}-${di}`} />;
            const isToday = toKey(d) === toKey(today);
            const isMarked = markedKeys.has(toKey(d));
            return (
              <div key={`${wi}-${di}`} className="flex flex-col items-center gap-0.5">
                <span
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isToday ? 'bg-primary-600 font-semibold text-white' : 'text-neutral-700'
                  )}
                >
                  {d.getDate()}
                </span>
                <span className={cn('h-1 w-1 rounded-full', isMarked && !isToday ? 'bg-primary-500' : 'bg-transparent')} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
