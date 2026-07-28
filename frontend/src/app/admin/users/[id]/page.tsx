'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AxiosError } from 'axios';
import {
  Lock,
  Unlock,
  KeyRound,
  Trash2,
  Mail,
  Phone,
  Building2,
  BadgeCheck,
  ShieldCheck,
} from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Badge,
  Avatar,
  Select,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  useToast,
} from '@/components/ui';
import ActivityTimeline, { TimelineEntry } from '@/components/dashboard/ActivityTimeline';
import api from '@/lib/api';
import { formatDate } from '@/lib/format';
import { User, Role, ROLE_LABELS, AuditLogEntry } from '@/types';

const ROLES: Role[] = ['STUDENT', 'FACULTY', 'STAFF', 'ACADEMIC_SUPERVISOR', 'DEPARTMENT_OFFICER', 'DEAN', 'ADMIN'];

function roleBadgeVariant(role: Role): 'primary' | 'info' | 'warning' | 'neutral' {
  if (role === 'ADMIN') return 'primary';
  if (role === 'DEAN' || role === 'DEPARTMENT_OFFICER') return 'warning';
  if (role === 'ACADEMIC_SUPERVISOR') return 'info';
  return 'neutral';
}

function auditAccent(action: string): TimelineEntry['accent'] {
  if (action.includes('REJECTED') || action.includes('DEACTIVATED') || action.includes('DELETE') || action.includes('LOCKED')) return 'error';
  if (action.includes('APPROVED') || action.includes('ACTIVATED') || action.includes('CREATED')) return 'success';
  if (action.includes('ESCALAT') || action.includes('WARNING')) return 'warning';
  return 'neutral';
}

export default function UserDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [busy, setBusy] = useState(false);

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logsPage, setLogsPage] = useState(1);
  const [logsTotal, setLogsTotal] = useState(0);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get(`/users/${id}`)
      .then((res) => setUser(res.data.data.user))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setLogsLoading(true);
    api
      .get('/audit-logs', { params: { actorId: id, page: logsPage, pageSize: 15 } })
      .then((res) => {
        setLogs((prev) => (logsPage === 1 ? res.data.data.logs : [...prev, ...res.data.data.logs]));
        setLogsTotal(res.data.data.total);
      })
      .catch(() => {})
      .finally(() => setLogsLoading(false));
  }, [id, logsPage]);

  const handleRoleChange = async (role: Role) => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await api.patch(`/users/${user.id}/role`, { role });
      setUser(res.data.data.user);
      toast({ variant: 'success', title: 'Role updated', description: `Now ${ROLE_LABELS[role]}.` });
    } catch {
      toast({ variant: 'error', title: 'Failed to update role' });
    } finally {
      setBusy(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await api.patch(`/users/${user.id}/status`, { isActive: !user.isActive });
      setUser(res.data.data.user);
      toast({
        variant: 'success',
        title: user.isActive ? 'Account locked' : 'Account activated',
      });
    } catch {
      toast({ variant: 'error', title: 'Failed to update account status' });
    } finally {
      setBusy(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await api.post(`/users/${user.id}/reset-password`);
      toast({
        variant: 'success',
        title: 'Password reset & emailed',
        description: `Fallback temporary password: ${res.data.data.temporaryPassword}`,
      });
    } catch {
      toast({ variant: 'error', title: 'Failed to reset password' });
    } finally {
      setBusy(false);
    }
  };

  const handleSupervisorToggle = async (isActiveSupervisor: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await api.patch(`/users/${user.id}/supervisor-flag`, { isActiveSupervisor });
      setUser(res.data.data.user);
      toast({ variant: 'success', title: isActiveSupervisor ? 'Supervisor activated' : 'Supervisor deactivated' });
    } catch {
      toast({ variant: 'error', title: 'Failed to update supervisor status' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeptHeadToggle = async (isDepartmentHead: boolean) => {
    if (!user) return;
    setBusy(true);
    try {
      const res = await api.patch(`/users/${user.id}/department-head-flag`, { isDepartmentHead });
      setUser(res.data.data.user);
      toast({ variant: 'success', title: isDepartmentHead ? 'Marked as Department Head' : 'Department Head flag removed' });
    } catch {
      toast({ variant: 'error', title: 'Failed to update Department Head flag' });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!confirm(`Remove ${user.fullName}? Their account will be deactivated.`)) return;
    setBusy(true);
    try {
      await api.delete(`/users/${user.id}`);
      toast({ variant: 'success', title: 'User removed' });
      router.push('/admin/users');
    } catch {
      toast({ variant: 'error', title: 'Failed to remove user' });
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </ProtectedRoute>
    );
  }

  if (notFound || !user) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-4xl px-4 py-8">
          <p className="text-sm text-error-600">User not found, or you do not have access.</p>
          <Button variant="link" className="mt-3" onClick={() => router.push('/admin/users')}>
            ← Back to User Management
          </Button>
        </div>
      </ProtectedRoute>
    );
  }

  const timelineEntries: TimelineEntry[] = logs.map((l) => ({
    id: l.id,
    title: (
      <span>
        <span className="font-medium text-neutral-800">{l.action.replace(/_/g, ' ')}</span>
        {l.details ? <span className="text-neutral-500"> — {l.details}</span> : null}
      </span>
    ),
    timestamp: l.createdAt,
    accent: auditAccent(l.action),
  }));

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', users: 'User Management', [id]: user.fullName }} />

        <Card className="mt-3 mb-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <Avatar name={user.fullName} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-semibold text-neutral-900">{user.fullName}</h1>
                  <Badge variant={roleBadgeVariant(user.role)}>{ROLE_LABELS[user.role]}</Badge>
                  <Badge variant={user.isActive ? 'success' : 'neutral'} dot>
                    {user.isActive ? 'Active' : 'Locked'}
                  </Badge>
                  {user.isEmailVerified && (
                    <Badge variant="info">
                      <BadgeCheck className="h-3 w-3" /> Verified
                    </Badge>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5" /> {user.email}
                  </span>
                  {user.phoneNumber && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5" /> {user.phoneNumber}
                    </span>
                  )}
                  {user.department && (
                    <span className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" /> {user.department}
                    </span>
                  )}
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">Joined {formatDate(user.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={user.isActive ? <Lock /> : <Unlock />}
                loading={busy}
                onClick={handleToggleStatus}
              >
                {user.isActive ? 'Lock Account' : 'Activate Account'}
              </Button>
              <Button variant="outline" size="sm" leftIcon={<KeyRound />} loading={busy} onClick={handleResetPassword}>
                Reset Password
              </Button>
              <Button variant="danger" size="sm" leftIcon={<Trash2 />} loading={busy} onClick={handleDelete}>
                Remove
              </Button>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Profile Details</CardTitle>
                </CardHeader>
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-neutral-400">Program</dt>
                    <dd className="text-neutral-800">{user.program || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Semester</dt>
                    <dd className="text-neutral-800">{user.semester ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Registration #</dt>
                    <dd className="text-neutral-800">{user.registrationNumber || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-400">Employee ID</dt>
                    <dd className="text-neutral-800">{user.employeeId || '—'}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-neutral-400">Academic Supervisor</dt>
                    <dd className="text-neutral-800">{user.supervisor?.fullName || '—'}</dd>
                  </div>
                </dl>
              </Card>

              <Card>
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Role & Permissions</CardTitle>
                  <CardDescription>Change this user&apos;s role or special flags.</CardDescription>
                </CardHeader>
                <div className="space-y-4">
                  <Select
                    label="Role"
                    value={user.role}
                    disabled={busy}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>

                  {user.role === 'ACADEMIC_SUPERVISOR' && (
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-2.5">
                      <div>
                        <p className="text-sm font-medium text-neutral-800">Active Supervisor</p>
                        <p className="text-xs text-neutral-500">Can receive new student assignments.</p>
                      </div>
                      <Switch
                        checked={user.isActiveSupervisor}
                        disabled={busy}
                        onChange={(e) => handleSupervisorToggle(e.target.checked)}
                      />
                    </div>
                  )}

                  {user.role === 'DEPARTMENT_OFFICER' && (
                    <div className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-neutral-400" />
                        <div>
                          <p className="text-sm font-medium text-neutral-800">Department Head</p>
                          <p className="text-xs text-neutral-500">Authorized reviewer for escalations.</p>
                        </div>
                      </div>
                      <Switch
                        checked={user.isDepartmentHead}
                        disabled={busy}
                        onChange={(e) => handleDeptHeadToggle(e.target.checked)}
                      />
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Activity History</CardTitle>
                <CardDescription>Every logged action taken by this user across the system.</CardDescription>
              </CardHeader>
              <ActivityTimeline entries={timelineEntries} loading={logsLoading && logsPage === 1} emptyLabel="No activity recorded yet." />
              {!logsLoading && logs.length < logsTotal && (
                <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => setLogsPage((p) => p + 1)}>
                    Load more
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
