'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import { Search, Plus, Download, Upload, Lock, Unlock, Trash2, ChevronLeft, ChevronRight, Users as UsersIcon } from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Checkbox,
  Modal,
  CsvImportModal,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SkeletonTableRows,
  EmptyState,
  Avatar,
  useToast,
} from '@/components/ui';
import type { CsvColumn } from '@/components/ui';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { User, Role, Department, ROLE_LABELS } from '@/types';

const ROLES: Role[] = ['STUDENT', 'FACULTY', 'STAFF', 'ACADEMIC_SUPERVISOR', 'DEPARTMENT_OFFICER', 'DEAN', 'ADMIN'];
const PAGE_SIZE = 10;

const EMPTY_FORM = {
  fullName: '',
  email: '',
  role: 'STUDENT' as Role,
  department: '',
  program: '',
  employeeId: '',
  registrationNumber: '',
  phoneNumber: '',
};

const IMPORT_COLUMNS: CsvColumn[] = [
  { key: 'fullName', label: 'Full Name', required: true, example: 'Jane Doe' },
  { key: 'email', label: 'Email', required: true, example: 'jane.doe@university.edu' },
  { key: 'role', label: 'Role', example: 'STUDENT' },
  { key: 'department', label: 'Department', example: 'Computer Science' },
  { key: 'program', label: 'Program', example: 'BSc Computer Science' },
  { key: 'registrationNumber', label: 'Registration Number', example: 'CS-2024-0142' },
  { key: 'employeeId', label: 'Employee ID', example: '' },
  { key: 'phoneNumber', label: 'Phone Number', example: '+1 555 0100' },
];

function roleBadgeVariant(role: Role): 'primary' | 'info' | 'warning' | 'neutral' {
  if (role === 'ADMIN') return 'primary';
  if (role === 'DEAN' || role === 'DEPARTMENT_OFFICER') return 'warning';
  if (role === 'ACADEMIC_SUPERVISOR') return 'info';
  return 'neutral';
}

function toCsv(users: User[]): string {
  const headers = ['Name', 'Email', 'Role', 'Department', 'Status', 'Joined'];
  const rows = users.map((u) => [
    u.fullName,
    u.email,
    ROLE_LABELS[u.role],
    u.department || '',
    u.isActive ? 'Active' : 'Locked',
    formatDate(u.createdAt),
  ]);
  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');
}

export default function UserManagementPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('/users', {
        params: {
          role: roleFilter || undefined,
          status: statusFilter || undefined,
          search: debouncedSearch || undefined,
          sortBy,
          sortDir,
          page,
          pageSize: PAGE_SIZE,
        },
      })
      .then((res) => {
        setUsers(res.data.data.users);
        setTotal(res.data.data.total);
        setSelected(new Set());
      })
      .catch(() => setErrorBanner('Unable to load users right now.'))
      .finally(() => setLoading(false));
  }, [roleFilter, statusFilter, debouncedSearch, sortBy, sortDir, page]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data.departments))
      .catch(() => {});
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const allOnPageSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
  };

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = async () => {
    setBusy(true);
    setErrorBanner('');
    try {
      const res = await api.post('/users', form);
      toast({
        variant: 'success',
        title: 'User created',
        description: `Credentials emailed to ${form.email}. Temporary password: ${res.data.data.temporaryPassword}`,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast({ variant: 'error', title: 'Failed to create user', description: axiosErr.response?.data?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleImportRow = async (row: Record<string, string>) => {
    if (!row.fullName) throw new Error('Full Name is required.');
    if (!row.email) throw new Error('Email is required.');

    const roleValue = (row.role || 'STUDENT').toUpperCase().replace(/\s+/g, '_') as Role;
    if (!ROLES.includes(roleValue)) {
      throw new Error(`Unknown role "${row.role}". Use one of: ${ROLES.join(', ')}.`);
    }

    // Same call the manual "Add User" form makes — one record at a time.
    await api.post('/users', {
      fullName: row.fullName,
      email: row.email,
      role: roleValue,
      department: row.department || undefined,
      program: row.program || undefined,
      employeeId: row.employeeId || undefined,
      registrationNumber: row.registrationNumber || undefined,
      phoneNumber: row.phoneNumber || undefined,
    });
  };

  const handleBulkStatus = async (isActive: boolean) => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    try {
      await api.patch('/users/bulk-status', { ids: Array.from(selected), isActive });
      toast({
        variant: 'success',
        title: isActive ? 'Users activated' : 'Users locked',
        description: `${selected.size} account(s) updated.`,
      });
      load();
    } catch {
      toast({ variant: 'error', title: 'Bulk update failed' });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Remove ${selected.size} user(s)? Their accounts will be deactivated.`)) return;
    setBulkBusy(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.delete(`/users/${id}`)));
      toast({ variant: 'success', title: 'Users removed', description: `${selected.size} account(s) deactivated.` });
      load();
    } catch {
      toast({ variant: 'error', title: 'Bulk removal failed' });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = () => {
    const csv = toCsv(users);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-page-${page}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = useMemo(
    () => [roleFilter, statusFilter, debouncedSearch].filter(Boolean).length,
    [roleFilter, statusFilter, debouncedSearch]
  );

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', users: 'User Management' }} />

        <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">User Management</h1>
            <p className="mt-1 text-sm text-neutral-500">
              {total} user{total === 1 ? '' : 's'} across every role in the system.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Button variant="outline" leftIcon={<Upload />} onClick={() => setShowImport(true)}>
              Import CSV
            </Button>
            <Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>
              Add User
            </Button>
          </div>
        </div>

        {errorBanner && (
          <Card className="mb-4 border-error-200 bg-error-50">
            <p className="text-sm text-error-700">{errorBanner}</p>
          </Card>
        )}

        <Card padded={false} className="mb-4">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Input
              containerClassName="mb-0 w-64"
              placeholder="Search name, email, ID…"
              leftIcon={<Search />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              containerClassName="mb-0 w-44"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All roles</option>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
            <Select
              containerClassName="mb-0 w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
            </Select>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch('');
                  setRoleFilter('');
                  setStatusFilter('');
                }}
              >
                Clear filters
              </Button>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm" leftIcon={<Download />} onClick={handleExport} disabled={users.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 bg-primary-50/60 px-4 py-3">
              <span className="text-sm font-medium text-primary-800">{selected.size} selected</span>
              <Button size="sm" variant="outline" leftIcon={<Unlock />} loading={bulkBusy} onClick={() => handleBulkStatus(true)}>
                Activate
              </Button>
              <Button size="sm" variant="outline" leftIcon={<Lock />} loading={bulkBusy} onClick={() => handleBulkStatus(false)}>
                Lock
              </Button>
              <Button size="sm" variant="danger" leftIcon={<Trash2 />} loading={bulkBusy} onClick={handleBulkDelete}>
                Remove
              </Button>
              <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setSelected(new Set())}>
                Clear selection
              </Button>
            </div>
          )}
        </Card>

        <Card padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allOnPageSelected} onChange={toggleSelectAll} aria-label="Select all users on this page" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('fullName')}>
                  Name {sortBy === 'fullName' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('email')}>
                  Email {sortBy === 'email' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('role')}>
                  Role {sortBy === 'role' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="cursor-pointer select-none" onClick={() => toggleSort('createdAt')}>
                  Joined {sortBy === 'createdAt' && (sortDir === 'asc' ? '↑' : '↓')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={PAGE_SIZE} columns={7} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <EmptyState
                      icon={<UsersIcon className="h-5 w-5" />}
                      title="No users match these filters"
                      description="Try clearing filters or search terms to see more results."
                    />
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id} className="cursor-pointer" onClick={() => router.push(`/admin/users/${u.id}`)}>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selected.has(u.id)} onChange={() => toggleSelectOne(u.id)} aria-label={`Select ${u.fullName}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.fullName} size="sm" />
                        <div>
                          <Link
                            href={`/admin/users/${u.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-neutral-900 hover:text-primary-700 hover:underline"
                          >
                            {u.fullName}
                          </Link>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-600">{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={roleBadgeVariant(u.role)}>{ROLE_LABELS[u.role]}</Badge>
                    </TableCell>
                    <TableCell className="text-neutral-600">{u.department || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={u.isActive ? 'success' : 'neutral'} dot>
                        {u.isActive ? 'Active' : 'Locked'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-neutral-500">{formatDate(u.createdAt)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!loading && users.length > 0 && (
            <div className="flex items-center justify-between border-t border-neutral-100 px-4 py-3">
              <p className="text-xs text-neutral-500">
                Page {page} of {totalPages} · {total} total
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft />}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  rightIcon={<ChevronRight />}
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add User"
        description="Create an account for any role. Credentials are emailed automatically."
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={busy} disabled={!form.fullName || !form.email}>
              Create User
            </Button>
          </>
        }
      >
        <div className="grid gap-1 sm:grid-cols-2">
          <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select
            label="Department"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
          >
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
          <Input label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
          {form.role === 'STUDENT' ? (
            <Input
              label="Registration Number"
              value={form.registrationNumber}
              onChange={(e) => setForm({ ...form, registrationNumber: e.target.value })}
            />
          ) : (
            <Input
              label="Employee ID"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
            />
          )}
        </div>
      </Modal>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Users"
        description="Each row is created exactly like using Add User, one at a time."
        columns={IMPORT_COLUMNS}
        onImportRow={handleImportRow}
        onComplete={load}
      />
    </ProtectedRoute>
  );
}
