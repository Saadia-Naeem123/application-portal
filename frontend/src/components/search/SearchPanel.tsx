'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ApplicationSummary, STATUS_LABELS, ApplicationStatus } from '@/types';

const STATUS_OPTIONS: ApplicationStatus[] = [
  'SUBMITTED',
  'UNDER_SUPERVISOR_REVIEW',
  'UNDER_DEPARTMENT_REVIEW',
  'AWAITING_INFO',
  'APPROVED',
  'REJECTED',
  'ESCALATED',
  'CLOSED',
];

const PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

interface Filters {
  q: string;
  applicationNumber: string;
  applicantName: string;
  registrationNumber: string;
  employeeId: string;
  status: string;
  priority: string;
  submittedFrom: string;
  submittedTo: string;
  overdue: boolean;
  nearDeadline: boolean;
}

const EMPTY_FILTERS: Filters = {
  q: '',
  applicationNumber: '',
  applicantName: '',
  registrationNumber: '',
  employeeId: '',
  status: '',
  priority: '',
  submittedFrom: '',
  submittedTo: '',
  overdue: false,
  nearDeadline: false,
};

function statusBadgeClasses(status: ApplicationStatus) {
  if (status === 'APPROVED' || status === 'CLOSED') return 'bg-green-100 text-green-700';
  if (status === 'REJECTED') return 'bg-red-100 text-red-700';
  if (status === 'ESCALATED') return 'bg-amber-100 text-amber-700';
  if (status === 'DRAFT') return 'bg-slate-100 text-slate-600';
  return 'bg-blue-100 text-blue-700';
}

function toQuery(filters: Filters, page: number, pageSize: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === false || value === undefined) return;
    params.set(key, String(value));
  });
  params.set('page', String(page));
  params.set('pageSize', String(pageSize));
  return params;
}

export default function SearchPanel() {
  const { user } = useAuth();
  const detailHref = (id: string) =>
    user && ['ADMIN', 'DEAN', 'DEPARTMENT_OFFICER', 'ACADEMIC_SUPERVISOR'].includes(user.role)
      ? `/applications/${id}`
      : `/tracking/${id}`;
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [results, setResults] = useState<ApplicationSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const runSearch = async (targetPage = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = toQuery(filters, targetPage, pageSize);
      const res = await api.get(`/search/applications?${params.toString()}`);
      setResults(res.data.data.applications);
      setTotal(res.data.data.total);
      setPage(targetPage);
      setSearched(true);
    } catch {
      setError('Unable to run search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    runSearch(1);
  };

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
  };

  const handleExport = async (format: 'xlsx' | 'pdf') => {
    const params = toQuery(filters, 1, pageSize);
    params.set('format', format);
    params.delete('page');
    params.delete('pageSize');
    const res = await api.get(`/search/applications/export?${params.toString()}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.download = `applications.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="mb-4 font-medium text-slate-900">Advanced Search & Filters</h2>
        <form onSubmit={handleSubmit} className="grid gap-x-4 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
          <Input
            label="Keyword"
            placeholder="Subject, application #, applicant…"
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
          />
          <Input
            label="Application ID"
            value={filters.applicationNumber}
            onChange={(e) => setFilters({ ...filters, applicationNumber: e.target.value })}
          />
          <Input
            label="Applicant Name"
            value={filters.applicantName}
            onChange={(e) => setFilters({ ...filters, applicantName: e.target.value })}
          />
          <Input
            label="Registration Number"
            value={filters.registrationNumber}
            onChange={(e) => setFilters({ ...filters, registrationNumber: e.target.value })}
          />
          <Input
            label="Employee ID"
            value={filters.employeeId}
            onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
          />

          <label className="block mb-4">
            <span className="block text-sm font-medium text-slate-700 mb-1">Status</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Any status</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </label>

          <label className="block mb-4">
            <span className="block text-sm font-medium text-slate-700 mb-1">Priority</span>
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={filters.priority}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
            >
              <option value="">Any priority</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Submitted From"
            type="date"
            value={filters.submittedFrom}
            onChange={(e) => setFilters({ ...filters, submittedFrom: e.target.value })}
          />
          <Input
            label="Submitted To"
            type="date"
            value={filters.submittedTo}
            onChange={(e) => setFilters({ ...filters, submittedTo: e.target.value })}
          />

          <div className="flex items-end gap-4 mb-4">
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.overdue}
                onChange={(e) => setFilters({ ...filters, overdue: e.target.checked })}
              />
              Overdue only
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={filters.nearDeadline}
                onChange={(e) => setFilters({ ...filters, nearDeadline: e.target.checked })}
              />
              Near deadline
            </label>
          </div>
        </form>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button onClick={handleSubmit} loading={loading}>
            Search
          </Button>
          <Button type="button" variant="secondary" onClick={handleReset}>
            Reset filters
          </Button>
          <div className="ml-auto flex gap-2">
            <Button type="button" variant="secondary" onClick={() => handleExport('xlsx')}>
              Export Excel
            </Button>
            <Button type="button" variant="secondary" onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {searched && (
        <Card className="overflow-x-auto">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-medium text-slate-900">Results ({total})</h2>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4">Application #</th>
                <th className="py-2 pr-4">Applicant</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Priority</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Deadline</th>
              </tr>
            </thead>
            <tbody>
              {results.map((app) => (
                <tr key={app.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4 font-medium text-brand-700">
                    <Link href={detailHref(app.id)}>{app.applicationNumber}</Link>
                  </td>
                  <td className="py-2 pr-4">{app.applicant?.fullName || '—'}</td>
                  <td className="py-2 pr-4">{app.applicationType?.name || '—'}</td>
                  <td className="py-2 pr-4">{app.priority}</td>
                  <td className="py-2 pr-4">
                    <span className={`rounded-full px-2 py-1 text-xs ${statusBadgeClasses(app.status)}`}>
                      {STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="py-2 pr-4">
                    {app.deadlineAt ? new Date(app.deadlineAt).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No applications match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {total > pageSize && (
            <div className="mt-4 flex items-center justify-between text-sm">
              <Button
                type="button"
                variant="secondary"
                disabled={page <= 1}
                onClick={() => runSearch(page - 1)}
              >
                Previous
              </Button>
              <span className="text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="secondary"
                disabled={page >= totalPages}
                onClick={() => runSearch(page + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
