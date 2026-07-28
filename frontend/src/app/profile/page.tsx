'use client';

import { useState, FormEvent, useEffect } from 'react';
import { AxiosError } from 'axios';
import api from '@/lib/api';
import ProtectedRoute from '@/components/layout/ProtectedRoute';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { Department } from '@/types';

function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const isStudent = user?.role === 'STUDENT';
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setPhoneNumber(user.phoneNumber || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  useEffect(() => {
    if (isStudent) return;
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data.departments))
      .catch(() => {});
  }, [isStudent]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      // Students can only change their phone number here — full name and
      // department are display-only for that role (see StudentAccountInfo).
      const payload = isStudent ? { phoneNumber } : { fullName, phoneNumber, department };
      await api.patch('/users/me', payload);
      await refreshUser();
      setMessage('Profile updated.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 font-medium text-slate-900">My Profile</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={isStudent}
        />
        <Input label="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
        {!isStudent && (
          <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)}>
            <option value="">Select a department…</option>
            {departments.map((d) => (
              <option key={d.id} value={d.name}>
                {d.name}
              </option>
            ))}
          </Select>
        )}
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Save Changes
        </Button>
      </form>
    </Card>
  );
}

// Registration number, department, and program are set by admins — students
// can view but not edit them here. Supervisor/authority is handled below by
// SupervisorForm instead, since that's now self-service.
function StudentAccountInfo() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card>
      <h2 className="mb-4 font-medium text-slate-900">Academic Information</h2>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-slate-400">Registration Number</dt>
          <dd className="text-slate-800">{user.registrationNumber || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Department</dt>
          <dd className="text-slate-800">{user.department || '—'}</dd>
        </div>
        <div>
          <dt className="text-slate-400">Program</dt>
          <dd className="text-slate-800">{user.program || '—'}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-slate-400">
        These fields are managed by the administration and cannot be edited here.
      </p>
    </Card>
  );
}

// Self-service, all roles: pick who reviews your applications by entering
// their registered portal email, instead of it being fixed at registration
// or set only by an admin. Clearing the field removes the current selection.
function SupervisorForm() {
  const { user, refreshUser } = useAuth();
  const [supervisorEmail, setSupervisorEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSupervisorEmail(user?.supervisor?.email || '');
  }, [user?.supervisor?.email]);

  const save = async (emailValue: string) => {
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await api.patch('/users/me/supervisor', { supervisorEmail: emailValue || undefined });
      await refreshUser();
      setSupervisorEmail(emailValue);
      setMessage(emailValue ? 'Reviewing authority updated.' : 'Reviewing authority cleared.');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to update reviewing authority.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save(supervisorEmail);
  };

  return (
    <Card>
      <h2 className="mb-1 font-medium text-slate-900">Supervisor / Reviewing Authority</h2>
      <p className="mb-4 text-xs text-slate-500">
        Enter the university email of the supervisor or other authority you want reviewing your
        applications. They must already have an account on the portal. This applies to applications
        that require that kind of approval — everything else continues to route as before.
      </p>
      <form onSubmit={handleSubmit}>
        <Input
          label="Supervisor / Authority Email"
          type="email"
          placeholder="e.g. supervisor@university.edu"
          value={supervisorEmail}
          onChange={(e) => setSupervisorEmail(e.target.value)}
        />
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" loading={loading}>
            Save
          </Button>
          {user?.supervisor && (
            <Button type="button" variant="secondary" loading={loading} onClick={() => save('')}>
              Clear
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);
    try {
      await api.patch('/users/me/password', { currentPassword, newPassword });
      setMessage('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message: string }>;
      setError(axiosErr.response?.data?.message || 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="mb-4 font-medium text-slate-900">Change Password</h2>
      <form onSubmit={handleSubmit}>
        <Input
          label="Current Password"
          type="password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="New Password"
          type="password"
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        {message && <p className="mb-4 text-sm text-green-600">{message}</p>}
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <Button type="submit" loading={loading}>
          Update Password
        </Button>
      </form>
    </Card>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="mx-auto max-w-3xl px-4 py-10 space-y-6">
        <h1 className="text-2xl font-semibold text-slate-900">Account Settings</h1>
        {user?.role === 'STUDENT' && <StudentAccountInfo />}
        <ProfileForm />
        <SupervisorForm />
        <ChangePasswordForm />
      </div>
    </ProtectedRoute>
  );
}
