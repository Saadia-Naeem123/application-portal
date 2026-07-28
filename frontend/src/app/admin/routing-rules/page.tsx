'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Route } from 'lucide-react';
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
import { Department, RoutingRule } from '@/types';

export default function RoutingRulesPage() {
  const { toast } = useToast();
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('/routing-rules'), api.get('/departments')])
      .then(([ruleRes, deptRes]) => {
        setRules(ruleRes.data.data.rules);
        setDepartments(deptRes.data.data.departments);
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load routing rules' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(
    () => rules.filter((r) => !search || r.applicationTypeName.toLowerCase().includes(search.toLowerCase())),
    [rules, search]
  );

  const handleSave = async (rule: RoutingRule) => {
    const departmentId = selections[rule.applicationTypeId];
    if (!departmentId || departmentId === rule.departmentId) return;
    setSavingId(rule.applicationTypeId);
    try {
      await api.patch(`/routing-rules/${rule.applicationTypeId}`, { departmentId });
      toast({ variant: 'success', title: 'Routing updated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to update routing rule' });
    } finally {
      setSavingId(null);
    }
  };

  const handleToggleApproval = async (rule: RoutingRule) => {
    try {
      await api.patch(`/routing-rules/${rule.applicationTypeId}`, {
        requiresSupervisorApproval: !rule.requiresSupervisorApproval,
      });
      toast({ variant: 'success', title: 'Routing updated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to update routing rule' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', 'routing-rules': 'Routing Rules' }} />

        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Routing Rules</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Which department each application type routes to, and whether an Academic Supervisor must approve it
            first. Manage the application types themselves under Application Types.
          </p>
        </div>

        <Card padded={false} className="mb-4">
          <div className="p-4">
            <Input
              containerClassName="mb-0 w-64"
              placeholder="Search application type…"
              leftIcon={<Search />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        <Card padded={false}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application Type</TableHead>
                <TableHead>Routes To</TableHead>
                <TableHead>Supervisor Approval</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonTableRows rows={4} columns={4} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={<Route className="h-5 w-5" />}
                      title="No routing rules match this search"
                      description="Application types are managed on the Application Types page."
                    />
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <TableRow key={r.applicationTypeId}>
                    <TableCell className="font-medium text-neutral-900">{r.applicationTypeName}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Select
                          containerClassName="mb-0 w-44"
                          value={selections[r.applicationTypeId] ?? r.departmentId}
                          onChange={(e) => setSelections({ ...selections, [r.applicationTypeId]: e.target.value })}
                        >
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          loading={savingId === r.applicationTypeId}
                          disabled={
                            !selections[r.applicationTypeId] || selections[r.applicationTypeId] === r.departmentId
                          }
                          onClick={() => handleSave(r)}
                        >
                          Save
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleToggleApproval(r)}>
                        {r.requiresSupervisorApproval ? 'Required' : 'Not required'}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.isActive ? 'success' : 'neutral'} dot>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
