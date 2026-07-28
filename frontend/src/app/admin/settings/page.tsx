'use client';

import { useEffect, useState } from 'react';
import { AxiosError } from 'axios';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Breadcrumbs from '@/components/layout/Breadcrumbs';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  Button,
  Input,
  Select,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  useToast,
} from '@/components/ui';
import api from '@/lib/api';
import { SystemSettings } from '@/types';

export default function SystemSettingsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [savedSettings, setSavedSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/settings')
      .then((res) => {
        setSettings(res.data.data.settings);
        setSavedSettings(res.data.data.settings);
      })
      .catch(() => setLoadError('Unable to load system settings right now.'))
      .finally(() => setLoading(false));
  }, []);

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  const isDirty = settings && savedSettings && JSON.stringify(settings) !== JSON.stringify(savedSettings);

  const handleSave = async () => {
    if (!settings) return;
    setBusy(true);
    try {
      const res = await api.patch('/settings', settings);
      setSettings(res.data.data.settings);
      setSavedSettings(res.data.data.settings);
      toast({ variant: 'success', title: 'Settings saved' });
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      toast({ variant: 'error', title: 'Failed to save settings', description: axiosErr.response?.data?.message });
    } finally {
      setBusy(false);
    }
  };

  const handleDiscard = () => setSettings(savedSettings);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl space-y-4 px-4 py-8">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </ProtectedRoute>
    );
  }

  if (!settings) {
    return (
      <ProtectedRoute>
        <div className="mx-auto max-w-3xl px-4 py-8 text-sm text-error-600">{loadError || 'Unable to load settings.'}</div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
        <Breadcrumbs overrides={{ admin: 'Administration', settings: 'System Settings' }} />

        <div className="mt-3 mb-6">
          <h1 className="text-2xl font-semibold text-neutral-900">System Settings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Configure system-wide behavior for the deadline and reminder engine, uploads, and security.
          </p>
        </div>

        <Tabs defaultValue="deadlines">
          <TabsList>
            <TabsTrigger value="deadlines">Deadlines & Reminders</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="security">Security & Backups</TabsTrigger>
          </TabsList>

          <TabsContent value="deadlines">
            <Card className="mb-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Reminders & Escalation</CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Reminder thresholds (hours, comma-separated)"
                  value={settings.reminderThresholdHours.join(', ')}
                  onChange={(e) =>
                    update(
                      'reminderThresholdHours',
                      e.target.value
                        .split(',')
                        .map((v) => Number(v.trim()))
                        .filter((n) => Number.isFinite(n) && n > 0)
                    )
                  }
                />
                <Input
                  label="Final warning margin (hours before deadline)"
                  type="number"
                  value={settings.finalWarningMarginHours}
                  onChange={(e) => update('finalWarningMarginHours', Number(e.target.value))}
                />
              </div>
            </Card>

            <Card>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Working Hours</CardTitle>
                <CardDescription>
                  Displayed for reference. The deadline engine currently counts every hour of a working day (see the
                  Holiday Calendar for which days count as working days).
                </CardDescription>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Working day start hour (0–23)"
                  type="number"
                  value={settings.workingDayStartHour}
                  onChange={(e) => update('workingDayStartHour', Number(e.target.value))}
                />
                <Input
                  label="Working day end hour (0–23)"
                  type="number"
                  value={settings.workingDayEndHour}
                  onChange={(e) => update('workingDayEndHour', Number(e.target.value))}
                />
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="general">
            <Card className="mb-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>University Information</CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="University name"
                  value={settings.universityName}
                  onChange={(e) => update('universityName', e.target.value)}
                />
                <Input
                  label="Contact email"
                  type="email"
                  value={settings.universityContactEmail}
                  onChange={(e) => update('universityContactEmail', e.target.value)}
                />
                <Input
                  label="Support phone"
                  value={settings.supportPhone}
                  onChange={(e) => update('supportPhone', e.target.value)}
                />
              </div>
            </Card>

            <Card>
              <CardHeader className="px-0 pt-0">
                <CardTitle>File Uploads</CardTitle>
              </CardHeader>
              <Input
                label="Max upload size (MB)"
                type="number"
                value={settings.maxUploadSizeMb}
                onChange={(e) => update('maxUploadSizeMb', Number(e.target.value))}
              />
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="mb-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Minimum password length"
                  type="number"
                  value={settings.passwordMinLength}
                  onChange={(e) => update('passwordMinLength', Number(e.target.value))}
                />
                <Input
                  label="Session timeout (minutes)"
                  type="number"
                  value={settings.sessionTimeoutMinutes}
                  onChange={(e) => update('sessionTimeoutMinutes', Number(e.target.value))}
                />
              </div>
            </Card>

            <Card>
              <CardHeader className="px-0 pt-0">
                <CardTitle>Backups</CardTitle>
              </CardHeader>
              <div className="grid gap-4 sm:grid-cols-2">
                <Select label="Backup frequency" value={settings.backupFrequency} onChange={(e) => update('backupFrequency', e.target.value)}>
                  <option value="HOURLY">Hourly</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                </Select>
                <Input
                  label="Retention (days)"
                  type="number"
                  value={settings.backupRetentionDays}
                  onChange={(e) => update('backupRetentionDays', Number(e.target.value))}
                />
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {isDirty && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-4 py-3">
            <p className="text-sm text-neutral-600">You have unsaved changes.</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={handleDiscard} disabled={busy}>
                Discard
              </Button>
              <Button onClick={handleSave} loading={busy}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
