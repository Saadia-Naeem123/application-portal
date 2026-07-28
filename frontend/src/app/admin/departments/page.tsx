'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AxiosError } from 'axios';
import { Search, Plus, Download, Upload, Building2, ChevronDown, ChevronUp } from 'lucide-react';
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
  EmptyState,
  Skeleton,
  useToast,
} from '@/components/ui';
import type { CsvColumn } from '@/components/ui';
import api from '@/lib/api';
import { Department, User } from '@/types';

const EMPTY_FORM = { name: '', code: '', description: '', headUserId: '' };

const IMPORT_COLUMNS: CsvColumn[] = [
  { key: 'name', label: 'Name', required: true, example: 'Computer Science' },
  { key: 'code', label: 'Code', required: true, example: 'CS' },
  { key: 'description', label: 'Description', example: 'Department of Computer Science' },
];

function toCsv(departments: Department[]): string {
  const headers = ['Name', 'Code', 'Description', 'Status'];
  const rows = departments.map((d) => [d.name, d.code, d.description || '', d.isActive ? 'Active' : 'Inactive']);
  return [headers, ...rows].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
}

export default function DepartmentManagementPage() {
  const { toast } = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [officers, setOfficers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/departments', { params: { includeInactive: true } }),
      api.get('/users', { params: { role: 'DEPARTMENT_OFFICER', pageSize: 200 } }),
    ])
      .then(([deptRes, userRes]) => {
        setDepartments(deptRes.data.data.departments);
        setOfficers(userRes.data.data.users);
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load departments' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    return departments.filter((d) => {
      if (search && !`${d.name} ${d.code}`.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter === 'active' && !d.isActive) return false;
      if (statusFilter === 'inactive' && d.isActive) return false;
      return true;
    });
  }, [departments, search, statusFilter]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (dept: Department) => {
    setEditingId(dept.id);
    const currentHead = officers.find((o) => o.department === dept.name && o.isDepartmentHead);
    setForm({ name: dept.name, code: dept.code, description: dept.description || '', headUserId: currentHead?.id || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    setBusy(true);
    const { headUserId, ...departmentFields } = form;
    try {
      let department: Department;
      if (editingId) {
        const res = await api.patch(`/departments/${editingId}`, departmentFields);
        department = res.data.data.department;
        toast({ variant: 'success', title: 'Department updated' });
      } else {
        const res = await api.post('/departments', departmentFields);
        department = res.data.data.department;
        toast({ variant: 'success', title: 'Department created' });
      }

      // Optional HOD assignment: same two calls the Department Officers panel's
      // "Make Head" quick action makes — assign into this department, then
      // flip the isDepartmentHead flag so the workflow engine routes
      // DEPARTMENT_HEAD-stage applications to them.
      if (headUserId) {
        try {
          await api.patch(`/users/${headUserId}`, { department: department.name });
          await api.patch(`/users/${headUserId}/department-head-flag`, { isDepartmentHead: true });
          toast({ variant: 'success', title: 'Head of Department assigned' });
        } catch {
          toast({ variant: 'error', title: 'Department saved, but failed to assign Head of Department' });
        }
      }

      setShowModal(false);
      load();
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast({ variant: 'error', title: 'Failed to save department', description: axiosErr.response?.data?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleImportRow = async (row: Record<string, string>) => {
    if (!row.name) throw new Error('Name is required.');
    if (!row.code) throw new Error('Code is required.');

    // Same call the manual "Create Department" form makes — one record at a time.
    await api.post('/departments', {
      name: row.name,
      code: row.code,
      description: row.description || undefined,
    });
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm('Deactivate this department? Existing applications keep their history.')) return;
    try {
      await api.delete(`/departments/${id}`);
      toast({ variant: 'success', title: 'Department deactivated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to deactivate department' });
    }
  };

  const handleToggleHead = async (officer: User) => {
    try {
      await api.patch(`/users/${officer.id}/department-head-flag`, { isDepartmentHead: !officer.isDepartmentHead });
      toast({
        variant: 'success',
        title: officer.isDepartmentHead ? 'Head of Department flag removed' : 'Marked as Head of Department',
      });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to update Head of Department status' });
    }
  };

  const handleAssignOfficer = async (departmentName: string) => {
    const userId = assignSelections[departmentName];
    if (!userId) return;
    try {
      await api.patch(`/users/${userId}`, { department: departmentName });
      toast({ variant: 'success', title: 'Officer assigned' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to assign officer' });
    }
  };

  const handleExport = () => {
    const csv = toCsv(filtered);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'departments.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', departments: 'Department Management' }} />

        <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900">Department Management</h1>
            <p className="mt-1 text-sm text-neutral-500">Departments applications route to, and the officers assigned to each.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2.5">
            <Button variant="outline" leftIcon={<Upload />} onClick={() => setShowImport(true)}>
              Import CSV
            </Button>
            <Button leftIcon={<Plus />} onClick={openCreate}>
              Create Department
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
        </Card>

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<Building2 className="h-5 w-5" />}
              title="No departments match these filters"
              description="Try clearing filters, or create a new department."
              action={
                <Button size="sm" leftIcon={<Plus />} onClick={openCreate}>
                  Create Department
                </Button>
              }
            />
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((dept) => {
              const deptOfficers = officers.filter((o) => o.department === dept.name);
              const availableToAssign = officers.filter((o) => o.department !== dept.name);
              const isExpanded = expandedId === dept.id;
              return (
                <Card key={dept.id} padded={false}>
                  <div className="flex items-start justify-between gap-4 p-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-medium text-neutral-900">{dept.name}</h2>
                        <span className="text-xs text-neutral-400">({dept.code})</span>
                        <Badge variant={dept.isActive ? 'success' : 'neutral'} dot>
                          {dept.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      {dept.description && <p className="mt-1 text-sm text-neutral-600">{dept.description}</p>}
                      <p className="mt-1 text-xs text-neutral-400">
                        {deptOfficers.length} officer{deptOfficers.length === 1 ? '' : 's'} assigned
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(dept)}>
                        Edit
                      </Button>
                      {dept.isActive && (
                        <Button variant="danger" size="sm" onClick={() => handleDeactivate(dept.id)}>
                          Deactivate
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={isExpanded ? 'Collapse officers' : 'Expand officers'}
                        leftIcon={isExpanded ? <ChevronUp /> : <ChevronDown />}
                        onClick={() => setExpandedId(isExpanded ? null : dept.id)}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-neutral-100 px-5 py-4">
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-500">Department Officers</p>
                      {deptOfficers.length === 0 ? (
                        <p className="mb-3 text-sm text-neutral-500">No officers assigned yet.</p>
                      ) : (
                        <ul className="mb-3 flex flex-wrap gap-2">
                          {deptOfficers.map((o) => (
                            <li
                              key={o.id}
                              className="flex items-center gap-2 rounded-full bg-neutral-100 py-1 pl-3 pr-1.5 text-sm text-neutral-700"
                            >
                              <span>
                                {o.fullName}
                                {o.isDepartmentHead ? (
                                  <Badge variant="info" className="ml-1.5 align-middle">
                                    Head
                                  </Badge>
                                ) : null}
                              </span>
                              <Button variant="ghost" size="sm" onClick={() => handleToggleHead(o)}>
                                {o.isDepartmentHead ? 'Remove Head' : 'Make Head'}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      {availableToAssign.length > 0 && (
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <Select
                              label="Assign an officer"
                              containerClassName="mb-0"
                              value={assignSelections[dept.name] || ''}
                              onChange={(e) => setAssignSelections({ ...assignSelections, [dept.name]: e.target.value })}
                            >
                              <option value="">Select a department officer…</option>
                              {availableToAssign.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.fullName} ({o.email})
                                </option>
                              ))}
                            </Select>
                          </div>
                          <Button variant="secondary" onClick={() => handleAssignOfficer(dept.name)}>
                            Assign
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Department' : 'Create Department'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={busy} disabled={!form.name || !form.code}>
              {editingId ? 'Save Changes' : 'Create'}
            </Button>
          </>
        }
      >
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Select
          label="Head of Department (optional)"
          value={form.headUserId}
          onChange={(e) => setForm({ ...form, headUserId: e.target.value })}
        >
          <option value="">No change</option>
          {officers.map((o) => (
            <option key={o.id} value={o.id}>
              {o.fullName} ({o.email}){o.department && o.department !== form.name ? ` — currently ${o.department}` : ''}
              {o.isDepartmentHead ? ' [Head]' : ''}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-neutral-500">
          Choosing someone here moves them into this department and marks them as its Head, so applications routed
          here escalate to them for approval or rejection at the department-head stage.
        </p>
      </Modal>

      <CsvImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Import Departments"
        description="Each row is created exactly like using Create Department, one at a time."
        columns={IMPORT_COLUMNS}
        onImportRow={handleImportRow}
        onComplete={load}
      />
    </ProtectedRoute>
  );
}
