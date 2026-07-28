'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { Search, Plus, Download, Upload, FileType2 } from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Button,
  Input,
  Select,
  Checkbox,
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
  useToast,
} from '@/components/ui';
import type { CsvColumn } from '@/components/ui';
import api from '@/lib/api';
import { ApplicationType, Department, Priority } from '@/types';

const PRIORITIES: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const IMPORT_COLUMNS: CsvColumn[] = [
  { key: 'name', label: 'Name', required: true, example: 'Transcript Request' },
  { key: 'code', label: 'Code', required: true, example: 'STAFF-TRANSCRIPT' },
  { key: 'department', label: 'Department', required: true, example: 'Human Resources' },
  { key: 'slaWorkingHours', label: 'SLA (hrs)', example: '72' },
  { key: 'defaultPriority', label: 'Priority', example: 'MEDIUM' },
  { key: 'requiresSupervisorApproval', label: 'Supervisor Approval', example: 'Yes' },
];

const EMPTY_FORM = {
  name: '',
  code: '',
  description: '',
  departmentId: '',
  requiresSupervisorApproval: true,
  defaultPriority: 'MEDIUM' as Priority,
  slaWorkingHours: 48,
};

function priorityVariant(p: Priority): 'neutral' | 'info' | 'warning' | 'error' {
  if (p === 'URGENT') return 'error';
  if (p === 'HIGH') return 'warning';
  if (p === 'MEDIUM') return 'info';
  return 'neutral';
}

function toCsv(types: ApplicationType[]): string {
  const headers = ['Name', 'Code', 'Department', 'SLA (hrs)', 'Priority', 'Supervisor Approval', 'Status'];
  const rows = types.map((t) => [
    t.name,
    t.code,
    t.department?.name || '',
    String(t.slaWorkingHours),
    t.defaultPriority,
    t.requiresSupervisorApproval ? 'Required' : 'Not required',
    t.isActive ? 'Active' : 'Inactive',
  ]);
  return [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function ApplicationTypesPage() {
  const { toast } = useToast();
  const [types, setTypes] = useState<ApplicationType[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/application-types', { params: { includeInactive: true } }), api.get('/departments')])
      .then(([typeRes, deptRes]) => {
        setTypes(typeRes.data.data.applicationTypes);
        setDepartments(deptRes.data.data.departments);
        setSelected(new Set());
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load application types' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return types.filter((t) => {
      if (search && !`${t.name} ${t.code}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (departmentFilter && t.departmentId !== departmentFilter) return false;
      if (statusFilter === 'active' && !t.isActive) return false;
      if (statusFilter === 'inactive' && t.isActive) return false;
      return true;
    });
  }, [types, search, departmentFilter, statusFilter]);

  const allSelected = filtered.length > 0 && filtered.every((t) => selected.has(t.id));

  const toggleSelectAll = () => {
    setSelected(allSelected ? new Set() : new Set(filtered.map((t) => t.id)));
  };
  const toggleSelectOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (t: ApplicationType) => {
    setEditingId(t.id);
    setForm({
      name: t.name,
      code: t.code,
      description: '',
      departmentId: t.departmentId,
      requiresSupervisorApproval: t.requiresSupervisorApproval,
      defaultPriority: t.defaultPriority,
      slaWorkingHours: t.slaWorkingHours,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setBusy(true);
    try {
      if (editingId) {
        await api.patch(`/application-types/${editingId}`, form);
        toast({ variant: 'success', title: 'Application type updated' });
      } else {
        await api.post('/application-types', form);
        toast({ variant: 'success', title: 'Application type created' });
      }
      setShowModal(false);
      load();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast({ variant: 'error', title: 'Failed to save', description: axiosErr.response?.data?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleImportRow = async (row: Record<string, string>) => {
    if (!row.name) throw new Error('Name is required.');
    if (!row.code) throw new Error('Code is required.');
    if (!row.department) throw new Error('Department is required.');

    const department = departments.find((d) => d.name.toLowerCase() === row.department.toLowerCase());
    if (!department) throw new Error(`No department matches "${row.department}".`);

    const priority = row.defaultPriority?.toUpperCase();
    if (priority && !PRIORITIES.includes(priority as Priority)) {
      throw new Error(`Priority must be one of ${PRIORITIES.join(', ')}.`);
    }

    const slaWorkingHours = row.slaWorkingHours ? Number(row.slaWorkingHours) : 48;
    if (Number.isNaN(slaWorkingHours)) throw new Error('SLA (hrs) must be a number.');

    const approvalValue = row.requiresSupervisorApproval?.trim().toLowerCase();
    const requiresSupervisorApproval = approvalValue
      ? ['yes', 'y', 'true', '1', 'required'].includes(approvalValue)
      : true;

    // Same call the manual "Add Application Type" form makes — one record at a time.
    await api.post('/application-types', {
      name: row.name,
      code: row.code,
      departmentId: department.id,
      defaultPriority: (priority || 'MEDIUM') as Priority,
      slaWorkingHours,
      requiresSupervisorApproval,
    });
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this application type? It will no longer be selectable for new applications.')) return;
    try {
      await api.delete(`/application-types/${id}`);
      toast({ variant: 'success', title: 'Application type deactivated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to deactivate' });
    }
  };

  const handleBulkDeactivate = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Deactivate ${selected.size} application type(s)?`)) return;
    setBulkBusy(true);
    try {
      await Promise.all(Array.from(selected).map((id) => api.delete(`/application-types/${id}`)));
      toast({ variant: 'success', title: 'Application types deactivated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Bulk deactivation failed' });
    } finally {
      setBulkBusy(false);
    }
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'application-types.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', 'application-types': 'Application Types' }} />

        <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Application Types</h1>
            <p className="mt-1 text-sm text-neutral-500">
              The catalog of request types students and staff can submit, each with its own routing and SLA.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Button variant="outline" leftIcon={<Upload />} onClick={() => setShowImport(true)}>
              Import CSV
            </Button>
            <Button leftIcon={<Plus />} onClick={openCreate}>
              Add Application Type
            </Button>
          </div>
        </div>

        <Card padded={false} className="mb-4">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <Input
              containerClassName="mb-0 w-64"
              placeholder="Search name or code…"
              leftIcon={<Search />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select containerClassName="mb-0 w-52" value={departmentFilter} onChange={(e) => setDepartmentFilter(e.target.value)}>
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
            <Select containerClassName="mb-0 w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">Any status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
            <div className="ml-auto">
              <Button variant="outline" size="sm" leftIcon={<Download />} onClick={handleExport} disabled={filtered.length === 0}>
                Export CSV
              </Button>
            </div>
          </div>

          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-3 border-t border-neutral-100 bg-primary-50/60 px-4 py-3">
              <span className="text-sm font-medium text-primary-800">{selected.size} selected</span>
              <Button size="sm" variant="danger" loading={bulkBusy} onClick={handleBulkDeactivate}>
                Deactivate
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
                  <Checkbox checked={allSelected} onChange={toggleSelectAll} aria-label="Select all" />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>SLA</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Supervisor Approval</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={5} columns={8} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState
                      icon={<FileType2 className="h-5 w-5" />}
                      title="No application types match these filters"
                      description="Try clearing filters, or add a new application type to get started."
                      action={
                        <Button size="sm" leftIcon={<Plus />} onClick={openCreate}>
                          Add Application Type
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Checkbox checked={selected.has(t.id)} onChange={() => toggleSelectOne(t.id)} aria-label={`Select ${t.name}`} />
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-neutral-900">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.code}</div>
                    </TableCell>
                    <TableCell className="text-neutral-600">{t.department?.name || '—'}</TableCell>
                    <TableCell className="text-neutral-600">{t.slaWorkingHours}h</TableCell>
                    <TableCell>
                      <Badge variant={priorityVariant(t.defaultPriority)}>{t.defaultPriority}</Badge>
                    </TableCell>
                    <TableCell className="text-neutral-600">{t.requiresSupervisorApproval ? 'Required' : '—'}</TableCell>
                    <TableCell>
                      <Badge variant={t.isActive ? 'success' : 'neutral'} dot>
                        {t.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(t)}>
                          Edit
                        </Button>
                        {t.isActive && (
                          <Button variant="danger" size="sm" onClick={() => handleDeactivate(t.id)}>
                            Deactivate
                          </Button>
                        )}
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
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Application Type' : 'New Application Type'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={busy} disabled={!form.name || !form.code || !form.departmentId}>
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </>
        }
      >
        <div className="grid gap-1 sm:grid-cols-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Fee Issue, Transcript, Hostel, Scholarship, Leave"
          />
          <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Select label="Routes to Department" value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select
            label="Default Priority"
            value={form.defaultPriority}
            onChange={(e) => setForm({ ...form, defaultPriority: e.target.value as Priority })}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Select>
          <Input
            label="SLA (working hours)"
            type="number"
            value={form.slaWorkingHours}
            onChange={(e) => setForm({ ...form, slaWorkingHours: Number(e.target.value) })}
          />
          <div className="pt-7">
            <Checkbox
              label="Requires Academic Supervisor approval first"
              checked={form.requiresSupervisorApproval}
              onChange={(e) => setForm({ ...form, requiresSupervisorApproval: e.target.checked })}
            />
          </div>
        </div>
      </Modal>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Application Types"
        description="Each row is created exactly like using Add Application Type, one at a time. Department must match an existing department name exactly."
        columns={IMPORT_COLUMNS}
        onImportRow={handleImportRow}
        onComplete={load}
      />
    </ProtectedRoute>
  );
}
