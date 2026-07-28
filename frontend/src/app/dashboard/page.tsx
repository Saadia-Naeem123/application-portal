'use client';

import ProtectedRoute from '@/components/layout/ProtectedRoute';
import AppShell from '@/components/layout/AppShell';
import { Card } from '@/components/ui/Card';
import { WelcomeHeader } from '@/components/dashboard';
import StudentDashboard from '@/components/applications/StudentDashboard';
import FacultyDashboard from '@/components/applications/FacultyDashboard';
import StaffDashboard from '@/components/applications/StaffDashboard';
import SupervisorDashboard from '@/components/applications/SupervisorDashboard';
import DepartmentOfficerDashboard from '@/components/applications/DepartmentOfficerDashboard';
import DeanDashboard from '@/components/applications/DeanDashboard';
import AdminDashboard from '@/components/applications/AdminDashboard';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/types';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <ProtectedRoute>
      <AppShell showBreadcrumbs={false}>
        <WelcomeHeader name={user.fullName} roleLabel={ROLE_LABELS[user.role]} />

        {user.role === 'STUDENT' ? (
          <StudentDashboard />
        ) : user.role === 'FACULTY' ? (
          <FacultyDashboard />
        ) : user.role === 'STAFF' ? (
          <StaffDashboard />
        ) : user.role === 'ACADEMIC_SUPERVISOR' ? (
          <SupervisorDashboard />
        ) : user.role === 'DEPARTMENT_OFFICER' ? (
          <DepartmentOfficerDashboard />
        ) : user.role === 'DEAN' ? (
          <DeanDashboard />
        ) : user.role === 'ADMIN' ? (
          <AdminDashboard />
        ) : (
          <Card>
            <h2 className="mb-1 font-medium text-neutral-900">Account status</h2>
            <ul className="space-y-1 text-sm text-neutral-600">
              <li>Email verified: {user.isEmailVerified ? 'Yes' : 'No'}</li>
              <li>Account active: {user.isActive ? 'Yes' : 'No'}</li>
              {user.department && <li>Department: {user.department}</li>}
            </ul>
          </Card>
        )}
      </AppShell>
    </ProtectedRoute>
  );
}
