'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { TrendingUp } from 'lucide-react';

interface TrendChartProps {
  data: { month: string; count: number }[];
  loading?: boolean;
  height?: number;
}

/** Monthly trend area chart, styled to match the primary color scale. */
export default function TrendChart({ data, loading, height = 220 }: TrendChartProps) {
  if (loading) return <Skeleton style={{ height }} className="w-full" />;
  if (!data || data.length === 0) {
    return <EmptyState icon={<TrendingUp className="h-5 w-5" />} title="No trend data yet" className="py-6" />;
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            labelStyle={{ color: '#334155', fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fill="url(#trendFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
