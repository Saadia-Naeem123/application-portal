'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { Search, Plus, Trash2, CalendarDays } from 'lucide-react';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  Button,
  Input,
  Select,
  Badge,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
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
import { formatDate } from '@/lib/format';
import { Holiday, SemesterBreak, WorkingSaturday } from '@/types';

const HOLIDAY_TYPES: Holiday['type'][] = ['PUBLIC', 'UNIVERSITY', 'SPECIAL'];

export default function HolidayCalendarPage() {
  const { toast } = useToast();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [breaks, setBreaks] = useState<SemesterBreak[]>([]);
  const [workingSaturdays, setWorkingSaturdays] = useState<WorkingSaturday[]>([]);
  const [loading, setLoading] = useState(true);

  const [holidaySearch, setHolidaySearch] = useState('');
  const [holidayForm, setHolidayForm] = useState({ name: '', date: '', type: 'UNIVERSITY' as Holiday['type'] });
  const [breakForm, setBreakForm] = useState({ name: '', startDate: '', endDate: '' });
  const [saturdayForm, setSaturdayForm] = useState({ date: '', reason: '' });
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      api.get('/holidays'),
      api.get('/semester-breaks', { params: { includeInactive: true } }),
      api.get('/working-saturdays'),
    ])
      .then(([hRes, bRes, sRes]) => {
        setHolidays(hRes.data.data.holidays);
        setBreaks(bRes.data.data.semesterBreaks);
        setWorkingSaturdays(sRes.data.data.workingSaturdays);
      })
      .catch(() => toast({ variant: 'error', title: 'Unable to load the calendar right now' }))
      .finally(() => setLoading(false));
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const filteredHolidays = useMemo(
    () => holidays.filter((h) => !holidaySearch || h.name.toLowerCase().includes(holidaySearch.toLowerCase())),
    [holidays, holidaySearch]
  );

  const handleAddHoliday = async () => {
    setBusy('holiday');
    try {
      await api.post('/holidays', holidayForm);
      setHolidayForm({ name: '', date: '', type: 'UNIVERSITY' });
      toast({ variant: 'success', title: 'Holiday added' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to add holiday' });
    } finally {
      setBusy('');
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    if (!confirm('Remove this holiday from the calendar?')) return;
    try {
      await api.delete(`/holidays/${id}`);
      toast({ variant: 'success', title: 'Holiday removed' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to remove holiday' });
    }
  };

  const handleAddBreak = async () => {
    setBusy('break');
    try {
      await api.post('/semester-breaks', breakForm);
      setBreakForm({ name: '', startDate: '', endDate: '' });
      toast({ variant: 'success', title: 'Semester break added' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to add semester break' });
    } finally {
      setBusy('');
    }
  };

  const handleToggleBreak = async (b: SemesterBreak) => {
    try {
      await api.patch(`/semester-breaks/${b.id}`, { isActive: !b.isActive });
      toast({ variant: 'success', title: b.isActive ? 'Semester break deactivated' : 'Semester break activated' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to update semester break' });
    }
  };

  const handleAddSaturday = async () => {
    setBusy('saturday');
    try {
      await api.post('/working-saturdays', saturdayForm);
      setSaturdayForm({ date: '', reason: '' });
      toast({ variant: 'success', title: 'Working Saturday added' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to add working Saturday', description: 'Make sure the date is actually a Saturday.' });
    } finally {
      setBusy('');
    }
  };

  const handleDeleteSaturday = async (id: string) => {
    if (!confirm('Remove this working Saturday?')) return;
    try {
      await api.delete(`/working-saturdays/${id}`);
      toast({ variant: 'success', title: 'Working Saturday removed' });
      load();
    } catch {
      toast({ variant: 'error', title: 'Failed to remove working Saturday' });
    }
  };

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Breadcrumbs overrides={{ admin: 'Administration', holidays: 'Holiday Calendar' }} />

        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">Holiday Calendar</h1>
          <p className="mt-1 text-sm text-neutral-500">
            University holidays, semester breaks, and working Saturdays. The deadline engine automatically uses this
            calendar when calculating SLA deadlines.
          </p>
        </div>

        <Tabs defaultValue="holidays">
          <TabsList>
            <TabsTrigger value="holidays">Holidays</TabsTrigger>
            <TabsTrigger value="breaks">Semester Breaks</TabsTrigger>
            <TabsTrigger value="saturdays">Working Saturdays</TabsTrigger>
          </TabsList>

          <TabsContent value="holidays">
            <Card padded={false} className="mb-4">
              <div className="grid gap-3 p-4 sm:grid-cols-4">
                <Input
                  containerClassName="mb-0"
                  label="Name"
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm({ ...holidayForm, name: e.target.value })}
                />
                <Input
                  containerClassName="mb-0"
                  label="Date"
                  type="date"
                  value={holidayForm.date}
                  onChange={(e) => setHolidayForm({ ...holidayForm, date: e.target.value })}
                />
                <Select
                  containerClassName="mb-0"
                  label="Type"
                  value={holidayForm.type}
                  onChange={(e) => setHolidayForm({ ...holidayForm, type: e.target.value as Holiday['type'] })}
                >
                  {HOLIDAY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </Select>
                <div className="flex items-end">
                  <Button
                    leftIcon={<Plus />}
                    onClick={handleAddHoliday}
                    loading={busy === 'holiday'}
                    disabled={!holidayForm.name || !holidayForm.date}
                    fullWidth
                  >
                    Add Holiday
                  </Button>
                </div>
              </div>
              <div className="border-t border-neutral-100 p-4">
                <Input
                  containerClassName="mb-0 w-64"
                  placeholder="Search holidays…"
                  leftIcon={<Search />}
                  value={holidaySearch}
                  onChange={(e) => setHolidaySearch(e.target.value)}
                />
              </div>
            </Card>

            <Card padded={false}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={4} columns={4} />
                  ) : filteredHolidays.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No holidays match this search" />
                      </td>
                    </tr>
                  ) : (
                    filteredHolidays.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium text-neutral-900">{h.name}</TableCell>
                        <TableCell className="text-neutral-600">{formatDate(h.date)}</TableCell>
                        <TableCell>
                          <Badge variant="neutral">{h.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" aria-label="Remove holiday" leftIcon={<Trash2 />} onClick={() => handleDeleteHoliday(h.id)} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="breaks">
            <Card padded={false} className="mb-4">
              <div className="grid gap-3 p-4 sm:grid-cols-4">
                <Input
                  containerClassName="mb-0"
                  label="Name"
                  value={breakForm.name}
                  onChange={(e) => setBreakForm({ ...breakForm, name: e.target.value })}
                />
                <Input
                  containerClassName="mb-0"
                  label="Start Date"
                  type="date"
                  value={breakForm.startDate}
                  onChange={(e) => setBreakForm({ ...breakForm, startDate: e.target.value })}
                />
                <Input
                  containerClassName="mb-0"
                  label="End Date"
                  type="date"
                  value={breakForm.endDate}
                  onChange={(e) => setBreakForm({ ...breakForm, endDate: e.target.value })}
                />
                <div className="flex items-end">
                  <Button
                    leftIcon={<Plus />}
                    onClick={handleAddBreak}
                    loading={busy === 'break'}
                    disabled={!breakForm.name || !breakForm.startDate || !breakForm.endDate}
                    fullWidth
                  >
                    Add Break
                  </Button>
                </div>
              </div>
            </Card>

            <Card padded={false}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={3} columns={4} />
                  ) : breaks.length === 0 ? (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No semester breaks configured yet" />
                      </td>
                    </tr>
                  ) : (
                    breaks.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium text-neutral-900">{b.name}</TableCell>
                        <TableCell className="text-neutral-600">
                          {formatDate(b.startDate)} – {formatDate(b.endDate)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={b.isActive ? 'success' : 'neutral'} dot>
                            {b.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleToggleBreak(b)}>
                            {b.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="saturdays">
            <Card padded={false} className="mb-4">
              <div className="grid gap-3 p-4 sm:grid-cols-3">
                <Input
                  containerClassName="mb-0"
                  label="Date (must be a Saturday)"
                  type="date"
                  value={saturdayForm.date}
                  onChange={(e) => setSaturdayForm({ ...saturdayForm, date: e.target.value })}
                />
                <Input
                  containerClassName="mb-0"
                  label="Reason"
                  value={saturdayForm.reason}
                  onChange={(e) => setSaturdayForm({ ...saturdayForm, reason: e.target.value })}
                />
                <div className="flex items-end">
                  <Button leftIcon={<Plus />} onClick={handleAddSaturday} loading={busy === 'saturday'} disabled={!saturdayForm.date} fullWidth>
                    Add Working Saturday
                  </Button>
                </div>
              </div>
            </Card>

            <Card padded={false}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <SkeletonTableRows rows={2} columns={3} />
                  ) : workingSaturdays.length === 0 ? (
                    <tr>
                      <td colSpan={3}>
                        <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No working Saturdays configured" />
                      </td>
                    </tr>
                  ) : (
                    workingSaturdays.map((w) => (
                      <TableRow key={w.id}>
                        <TableCell className="font-medium text-neutral-900">{formatDate(w.date)}</TableCell>
                        <TableCell className="text-neutral-600">{w.reason || '—'}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" aria-label="Remove working Saturday" leftIcon={<Trash2 />} onClick={() => handleDeleteSaturday(w.id)} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
