'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Download, ScrollText } from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SkeletonTableRows,
  EmptyState,
  useToast,
} from '@/components/ui';
import api from '@/lib/api';
import { formatDateTime } from '@/lib/format';
import { AuditLogEntry } from '@/types';

const CATEGORIES = ['', 'AUTH', 'USER', 'DEPARTMENT', 'APPLICATION_TYPE', 'ROUTING_RULE', 'HOLIDAY', 'SETTINGS'];
const PAGE_SIZE = 25;

function categoryVariant(c: string): 'neutral' | 'info' | 'warning' | 'error' {
  if (c === 'AUTH') return 'info';
  if (c === 'USER') return 'warning';
  return 'neutral';
}

function toCsv(logs: AuditLogEntry[]): string {
  const headers = ['When', 'Category', 'Action', 'Actor', 'Details'];
  const rows = logs.map((l) => [
    formatDateTime(l.createdAt),
    l.category,
    l.action.replace(/_/g, ' '),
    l.actor?.fullName || l.actorEmail || 'System',
    l.details || '',
  ]);
  return [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

// Administrator Portal — Audit Logs. Covers login history, user/department/
// settings changes, and other system-level events not already captured by
// an individual application's history (approvals, rejections, comments,
// and escalations for a specific application are visible on that
// application's own detail page).
export default function AuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [quickFilter, setQuickFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/audit-logs', { params: { category: category || undefined, from: from || undefined, to: to || undefined, page, pageSize: PAGE_SIZE } })
      .then((res) => {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load audit logs' }))
      .finally(() => setLoading(false));
  }, [category, from, to, page, toast]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const visibleLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (!quickFilter) return true;
        const haystack = `${l.action} ${l.actor?.fullName || ''} ${l.actorEmail || ''} ${l.details || ''}`.toLowerCase();
        return haystack.includes(quickFilter.toLowerCase());
      }),
    [logs, quickFilter]
  );

  const handleExport = () => {
    const csv = toCsv(visibleLogs);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-page-${page}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', 'audit-logs': 'Audit Logs' }} />

        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Audit Logs</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Every system activity is recorded — login history, application actions, and user/department/system
            changes.
          </p>
        </div>

        <Card padded={false} className="mb-4">
          <div className="flex flex-wrap items-end gap-3 p-4">
            <Select
              containerClassName="mb-0 w-48"
              label="Category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c || 'All categories'}
                </option>
              ))}
            </Select>
            <Input
              containerClassName="mb-0"
              label="From"
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
            <Input
              containerClassName="mb-0"
              label="To"
              type="date"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
            <Input
              containerClassName="mb-0 w-56"
              label="Filter this page"
              placeholder="Action, actor, details…"
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
            />
            <Button variant="outline" size="sm" leftIcon={<Download />} onClick={handleExport} disabled={visibleLogs.length === 0}>
              Export CSV
            </Button>
          </div>
        </Card>

        <Card padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={PAGE_SIZE > 8 ? 8 : PAGE_SIZE} columns={5} />
              ) : visibleLogs.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState icon={<ScrollText className="h-5 w-5" />} title="No audit log entries match this filter" />
                  </td>
                </tr>
              ) : (
                visibleLogs.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap text-neutral-500">{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell>
                      <Badge variant={categoryVariant(l.category)}>{l.category}</Badge>
                    </TableCell>
                    <TableCell className="font-medium text-neutral-900">{l.action.replace(/_/g, ' ')}</TableCell>
                    <TableCell className="text-neutral-600">
                      {l.actor ? (
                        <Link href={`/admin/users/${l.actor.id}`} className="hover:text-primary-700 hover:underline">
                          {l.actor.fullName}
                        </Link>
                      ) : (
                        l.actorEmail || 'System'
                      )}
                    </TableCell>
                    <TableCell className="text-neutral-600">{l.details || '—'}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && logs.length > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
              <p className="text-xs text-neutral-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
}
