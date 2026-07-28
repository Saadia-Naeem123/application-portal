'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { AxiosError } from 'axios';
import { Search, Plus, Upload, GraduationCap } from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
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
import { Department, User } from '@/types';

const IMPORT_COLUMNS: CsvColumn[] = [
  { key: 'fullName', label: 'Full Name', required: true, example: 'Dr. Jane Doe' },
  { key: 'email', label: 'Email', required: true, example: 'jane.doe@university.edu' },
  { key: 'department', label: 'Department', example: 'Computer Science' },
  { key: 'employeeId', label: 'Employee ID', example: 'EMP-1042' },
  { key: 'phoneNumber', label: 'Phone Number', example: '+1 555 0100' },
];

const EMPTY_FORM = { fullName: '', email: '', department: '', phoneNumber: '', employeeId: '' };

// Administrator Portal — Supervisor Management. Reuses the same user
// records/endpoints as User Management, scoped to ACADEMIC_SUPERVISOR —
// students automatically see the updated list during registration since
// /users/supervisors (the registration dropdown) reads the same isActiveSupervisor flag.
export default function SupervisorManagementPage() {
  const { toast } = useToast();
  const [supervisors, setSupervisors] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [deptSelections, setDeptSelections] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/users', { params: { role: 'ACADEMIC_SUPERVISOR', pageSize: 200 } }),
      api.get('/departments'),
    ])
      .then(([supRes, deptRes]) => {
        setSupervisors(supRes.data.data.users);
        setDepartments(deptRes.data.data.departments);
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load supervisors' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return supervisors.filter((s) => {
      if (search && !`${s.fullName} ${s.email}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'active' && !s.isActiveSupervisor) return false;
      if (statusFilter === 'inactive' && s.isActiveSupervisor) return false;
      return true;
    });
  }, [supervisors, search, statusFilter]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const res = await api.post('/users', { ...form, role: 'ACADEMIC_SUPERVISOR', isActiveSupervisor: true });
      toast({
        variant: 'success',
        title: 'Supervisor added',
        description: `Temporary password: ${res.data.data.temporaryPassword}`,
      });
      setForm(EMPTY_FORM);
      setShowCreate(false);
      load();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast({ variant: 'error', title: 'Failed to add supervisor', description: axiosErr.response?.data?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleImportRow = async (row: Record<string, string>) => {
    if (!row.fullName) throw new Error('Full Name is required.');
    if (!row.email) throw new Error('Email is required.');

    // Same call the manual "Add Supervisor" form makes — one record at a time.
    await api.post('/users', {
      fullName: row.fullName,
      email: row.email,
      role: 'ACADEMIC_SUPERVISOR',
      isActiveSupervisor: true,
      department: row.department || undefined,
      employeeId: row.employeeId || undefined,
      phoneNumber: row.phoneNumber || undefined,
    });
  };

  const handleToggleActive = async (s: User) => {
    try {
      await api.patch(`/users/${s.id}/supervisor-flag`, { isActiveSupervisor: !s.isActiveSupervisor });
      toast({ variant: 'success', title: s.isActiveSupervisor ? 'Supervisor deactivated' : 'Supervisor activated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to update supervisor status' });
    }
  };

  const handleAssignDepartment = async (id: string) => {
    const department = deptSelections[id];
    if (!department) return;
    try {
      await api.patch(`/users/${id}`, { department });
      toast({ variant: 'success', title: 'Department assigned' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to assign department' });
    }
  };

  const handleRemove = async (id: string) => {
    if (!confirm('Remove this supervisor? Their account will be deactivated.')) return;
    try {
      await api.delete(`/users/${id}`);
      toast({ variant: 'success', title: 'Supervisor removed' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to remove supervisor' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', supervisors: 'Supervisor Management' }} />

        <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Supervisor Management</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Students automatically see the updated supervisor list during registration.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Button variant="outline" leftIcon={<Upload />} onClick={() => setShowImport(true)}>
              Import CSV
            </Button>
            <Button leftIcon={<Plus />} onClick={() => setShowCreate(true)}>
              Add Supervisor
            </Button>
          </div>
        </div>

        <Card padded={false} className="mb-4">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Input
              containerClassName="mb-0 w-64"
              placeholder="Search name or email…"
              leftIcon={<Search />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select containerClassName="mb-0 w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </div>
        </Card>

        <Card padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={5} columns={5} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={<GraduationCap className="h-5 w-5" />}
                      title="No supervisors match these filters"
                      action={
                        <Button size="sm" leftIcon={<Plus />} onClick={() => setShowCreate(true)}>
                          Add Supervisor
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={s.fullName} size="sm" />
                        <Link href={`/admin/users/${s.id}`} className="font-medium text-neutral-900 hover:text-primary-700 hover:underline">
                          {s.fullName}
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-neutral-600">{s.email}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          containerClassName="mb-0 w-40"
                          value={deptSelections[s.id] ?? s.department ?? ''}
                          onChange={(e) => setDeptSelections({ ...deptSelections, [s.id]: e.target.value })}
                        >
                          <option value="">—</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.name}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => handleAssignDepartment(s.id)}>
                          Save
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.isActiveSupervisor ? 'success' : 'neutral'} dot>
                        {s.isActiveSupervisor ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleToggleActive(s)}>
                          {s.isActiveSupervisor ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleRemove(s.id)}>
                          Remove
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Add Supervisor"
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} loading={busy} disabled={!form.fullName || !form.email}>
              Create Supervisor
            </Button>
          </>
        }
      >
        <div className="grid gap-1 sm:grid-cols-2">
          <Input label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Select label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
          <Input label="Employee ID" value={form.employeeId} onChange={(e) => setForm({ ...form, employeeId: e.target.value })} />
          <Input label="Phone Number" value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} />
        </div>
      </Modal>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Supervisors"
        description="Each row is created exactly like using Add Supervisor, one at a time."
        columns={IMPORT_COLUMNS}
        onImportRow={handleImportRow}
        onComplete={load}
      />
    </ProtectedRoute>
  );
}
