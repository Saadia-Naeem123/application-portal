'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Api from '@/lib/api';
import {
  Card,
  Button,
  Input,
  Select,
  Checkbox,
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
import { Search, Download, Inbox, ChevronLeft, ChevronRight } from 'lucide-react';
import { StatusPill, PriorityPill } from '@/components/applications/StatusPill';
import { formatDateTime } from '@/lib/format';
import { ApplicationSummary, Priority } from '@/types';

const PAGE_SIZE = 15;
const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

export default function ReviewQueueTable({
  status,
  currentStage,
  emptyMessage,
  sortBy: initialSortBy = 'deadlineAt',
  sortOrder: initialSortOrder = 'asc',
}: {
  status: string;
  currentStage?: string;
  emptyMessage: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { toast } = useToast();
  const [applications, setApplications] = useState<ApplicationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [priority, setPriority] = useState('');
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(initialSortOrder);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const filterParams = {
    status,
    currentStage,
    q: debouncedSearch || undefined,
    priority: priority || undefined,
    overdue: overdueOnly || undefined,
    sortBy,
    sortOrder,
  };

  const load = useCallback(
    (targetPage: number) => {
      setLoading(true);
      setErrorMsg('');
      Api.get('/search/applications', { params: { ...filterParams, page: targetPage, pageSize: PAGE_SIZE } })
        .then((res) => {
          setApplications(res.data.data.applications);
          setTotal(res.data.data.total);
          setPage(targetPage);
          setSelected(new Set());
        })
        .catch(() => setErrorMsg('Unable to load applications right now.'))
        .finally(() => setLoading(false));
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [status, currentStage, debouncedSearch, priority, overdueOnly, sortBy, sortOrder]
  );

  useEffect(() => {
    load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, currentStage, debouncedSearch, priority, overdueOnly, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allSelected = applications.length > 0 && applications.every((a) => selected.has(a.id));

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => setSelected(allSelected ? new Set() : new Set(applications.map((a) => a.id)));
  const toggleSelectOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const exportSelectedAsCsv = () => {
    const rows = applications.filter((a) => selected.has(a.id));
    const headers = ['Application #', 'Subject', 'Student', 'Type', 'Priority', 'Status', 'Deadline'];
    const csvRows = rows.map((a) => [
      a.applicationNumber,
      a.subject,
      a.applicant?.fullName || '',
      a.applicationType?.name || '',
      a.priority,
      a.status,
      formatDateTime(a.deadlineAt),
    ]);
    const csv = [headers, ...csvRows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'selected-applications.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (selected.size > 0) {
      exportSelectedAsCsv();
      return;
    }
    setExporting(true);
    try {
      const res = await Api.get('/search/applications/export', {
        params: { ...filterParams, format: 'xlsx' },
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'applications.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({ variant: 'error', title: 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card padded={false}>
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Input
          containerClassName="mb-0 w-60"
          placeholder="Search # , subject, applicant…"
          leftIcon={<Search />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select containerClassName="mb-0 w-36" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">Any priority</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </Select>
        <Checkbox
          label="Overdue only"
          checked={overdueOnly}
          onChange={(e) => setOverdueOnly(e.target.checked)}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" leftIcon={<Download />} loading={exporting} onClick={handleExport} disabled={total === 0}>
            {selected.size > 0 ? `Export ${selected.size} Selected` : 'Export All (.xlsx)'}
          </Button>
        </div>
      </div>

      {errorMsg && <p className="px-4 pb-3 text-sm text-error-600">{errorMsg}</p>}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('applicationNumber')}>
              Application # {sortBy === 'applicationNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('priority')}>
              Priority {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('status')}>
              Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('deadlineAt')}>
              Deadline {sortBy === 'deadlineAt' && (sortOrder === 'asc' ? '↑' : '↓')}
            </TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <SkeletonTableRows rows={6} columns={8} />
          ) : applications.length === 0 ? (
            <tr>
              <td colSpan={8}>
                <EmptyState icon={<Inbox className="h-5 w-5" />} title={emptyMessage} />
              </td>
            </tr>
          ) : (
            applications.map((a) => (
              <TableRow key={a.id}>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox checked={selected.has(a.id)} onChange={() => toggleSelectOne(a.id)} aria-label={`Select ${a.applicationNumber}`} />
                </TableCell>
                <TableCell className="font-medium text-neutral-900">{a.applicationNumber}</TableCell>
                <TableCell className="text-neutral-600">{a.applicant?.fullName || '—'}</TableCell>
                <TableCell className="text-neutral-600">{a.applicationType?.name || '—'}</TableCell>
                <TableCell>
                  <PriorityPill priority={a.priority} />
                </TableCell>
                <TableCell>
                  <StatusPill status={a.status} />
                </TableCell>
                <TableCell className="text-neutral-500">{formatDateTime(a.deadlineAt)}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/applications/${a.id}`} className="text-xs font-medium text-primary-700 hover:underline">
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!loading && applications.length > 0 && (
        <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
          <p className="text-xs text-neutral-500">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" leftIcon={<ChevronLeft />} disabled={page <= 1} onClick={() => load(page - 1)}>
              Previous
            </Button>
            <Button variant="outline" size="sm" rightIcon={<ChevronRight />} disabled={page >= totalPages} onClick={() => load(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
