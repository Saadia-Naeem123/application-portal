'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';

export interface DonutSlice {
  label: string;
  value: number;
  color: string;
}

interface StatusDonutProps {
  data: DonutSlice[];
  loading?: boolean;
  totalLabel?: string;
}

/** Donut chart with a centered total and a color-keyed legend list, used for application status breakdowns. */
export default function StatusDonut({ data, loading, totalLabel = 'Total' }: StatusDonutProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (loading) {
    return (
      <div className="flex items-center gap-6">
        <Skeleton className="h-36 w-36 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2.5">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-3.5 w-full max-w-[140px]" />
          ))}
        </div>
      </div>
    );
  }

  if (total === 0) {
    return <EmptyState icon={<PieChartIcon className="h-5 w-5" />} title="No data yet" className="py-6" />;
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={44} outerRadius={64} paddingAngle={2} strokeWidth={0}>
              {data.map((slice, i) => (
                <Cell key={i} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number, name: string) => [value, name]} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-semibold text-neutral-900">{total}</span>
          <span className="text-[10px] uppercase tracking-wide text-neutral-400">{totalLabel}</span>
        </div>
      </div>

      <ul className="flex-1 space-y-2">
        {data.map((slice) => (
          <li key={slice.label} className="flex items-center justify-between gap-3 text-sm">
            <span className="flex items-center gap-2 text-neutral-600">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="font-medium text-neutral-900">{slice.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
