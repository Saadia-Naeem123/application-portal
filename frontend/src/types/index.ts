export type Role =
  | 'STUDENT'
  | 'FACULTY'
  | 'STAFF'
  | 'ACADEMIC_SUPERVISOR'
  | 'DEPARTMENT_OFFICER'
  | 'DEAN'
  | 'ADMIN';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  registrationNumber?: string | null;
  employeeId?: string | null;
  department?: string | null;
  program?: string | null;
  semester?: number | null;
  phoneNumber?: string | null;
  supervisorId?: string | null;
  supervisor?: { id: string; fullName: string; email: string } | null;
  isActiveSupervisor: boolean;
  isDepartmentHead: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export interface Supervisor {
  id: string;
  fullName: string;
  department?: string | null;
}

// --- Academic Supervisor Portal (Students tab) ---

export interface StudentSummary {
  id: string;
  fullName: string;
  email: string;
  registrationNumber?: string | null;
  department?: string | null;
  program?: string | null;
  semester?: number | null;
  phoneNumber?: string | null;
  isActive: boolean;
  createdAt: string;
  applicationsCount: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: { field?: string; message: string }[];
}

// --- Phase 8: Search, Tracking & Analytics ---

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_SUPERVISOR_REVIEW'
  | 'UNDER_DEPARTMENT_REVIEW'
  | 'AWAITING_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'ESCALATED'
  | 'CLOSED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ApplicationSummary {
  id: string;
  applicationNumber: string;
  subject: string;
  priority: Priority;
  status: ApplicationStatus;
  submittedAt: string | null;
  deadlineAt: string | null;
  createdAt: string;
  applicant?: { id: string; fullName: string; email: string; department?: string | null } | null;
  applicationType?: { id: string; name: string } | null;
  department?: { id: string; name: string } | null;
  supervisor?: { id: string; fullName: string } | null;
  assignedOfficer?: { id: string; fullName: string; role: Role } | null;
}

export interface SearchFilters {
  q?: string;
  applicationNumber?: string;
  applicantName?: string;
  registrationNumber?: string;
  employeeId?: string;
  status?: string;
  priority?: string;
  overdue?: boolean;
  nearDeadline?: boolean;
  submittedFrom?: string;
  submittedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface SearchResult {
  applications: ApplicationSummary[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AnalyticsOverview {
  totals: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    escalated: number;
    closed: number;
    overdue: number;
    nearDeadline: number;
  };
  byStatus: Record<string, number>;
  avgResolutionHours: number;
  topCategories: { applicationType: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export interface DepartmentReportRow {
  departmentId: string;
  departmentName: string;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  overdue: number;
  avgResolutionHours: number;
  escalationCount: number;
}

// --- Dean Portal (Phase 10) ---

export interface DeanOverview {
  totalEscalations: number;
  pendingEscalations: number;
  avgDepartmentResponseHours: number;
  overdueDepartments: number;
}

export interface SupervisorReportRow {
  supervisorId: string;
  supervisorName: string;
  department?: string | null;
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  avgResolutionHours: number;
}

// --- Administrator Portal ---

export interface AdminOverview {
  totalUsers: number;
  students: number;
  faculty: number;
  staff: number;
  supervisors: number;
  departmentCount: number;
  recentActivity: { id: string; occurredAt: string; actorName: string; description: string }[];
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
}

export interface RoutingRule {
  applicationTypeId: string;
  applicationTypeName: string;
  departmentId: string;
  departmentName: string;
  requiresSupervisorApproval: boolean;
  isActive: boolean;
}

export interface WorkingSaturday {
  id: string;
  date: string;
  reason?: string | null;
}

export interface AuditLogEntry {
  id: string;
  category: string;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  actor?: { id: string; fullName: string; email: string; role: Role } | null;
}

export interface SystemSettings {
  reminderThresholdHours: number[];
  finalWarningMarginHours: number;
  workingDayStartHour: number;
  workingDayEndHour: number;
  maxUploadSizeMb: number;
  universityName: string;
  universityContactEmail: string;
  supportPhone: string;
  passwordMinLength: number;
  sessionTimeoutMinutes: number;
  backupFrequency: string;
  backupRetentionDays: number;
}

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_SUPERVISOR_REVIEW: 'Under Supervisor Review',
  UNDER_DEPARTMENT_REVIEW: 'Under Department Review',
  AWAITING_INFO: 'Awaiting Additional Info',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: 'Student',
  FACULTY: 'Faculty Member',
  STAFF: 'Staff Member',
  ACADEMIC_SUPERVISOR: 'Academic Supervisor',
  DEPARTMENT_OFFICER: 'Department Officer',
  DEAN: 'Dean',
  ADMIN: 'Administrator',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

// Tailwind classes for status/priority pills — shared by every application list/detail view.
export const STATUS_BADGE_CLASSES: Record<ApplicationStatus, string> = {
  DRAFT: 'bg-slate-100 text-slate-700',
  SUBMITTED: 'bg-blue-100 text-blue-700',
  UNDER_SUPERVISOR_REVIEW: 'bg-blue-100 text-blue-700',
  UNDER_DEPARTMENT_REVIEW: 'bg-blue-100 text-blue-700',
  AWAITING_INFO: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  ESCALATED: 'bg-orange-100 text-orange-700',
  CLOSED: 'bg-slate-200 text-slate-600',
};

export const PRIORITY_BADGE_CLASSES: Record<Priority, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-50 text-blue-700',
  HIGH: 'bg-amber-100 text-amber-800',
  URGENT: 'bg-red-100 text-red-700',
};

// Statuses a student may still edit/delete/attach documents against, i.e.
// before the application has entered anyone's review queue — mirrors the
// backend's EDITABLE_STATUSES.
export const EDITABLE_STATUSES: ApplicationStatus[] = ['DRAFT'];

// --- Applications module (Phase 4/5, student-facing) ---

export interface ApplicationType {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  department?: { id: string; name: string } | null;
  requiresSupervisorApproval: boolean;
  defaultPriority: Priority;
  slaWorkingHours: number;
  isActive: boolean;
}

export interface ApplicationAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

export interface CommentAttachment extends ApplicationAttachment {}

export interface ApplicationComment {
  id: string;
  message: string;
  author: { id: string; fullName: string; role: Role } | null;
  createdAt: string;
  attachments: CommentAttachment[];
}

export interface Application {
  id: string;
  applicationNumber: string;
  subject: string;
  description: string;
  priority: Priority;
  status: ApplicationStatus;
  currentStage: string | null;
  escalationLevel: number;
  submittedAt: string | null;
  deadlineAt: string | null;
  lastActionAt: string | null;
  closedAt: string | null;
  createdAt: string;
  updatedAt: string;
  applicationType?: ApplicationType | null;
  department?: { id: string; name: string } | null;
  supervisor?: { id: string; fullName: string; email: string } | null;
  assignedOfficer?: { id: string; fullName: string; role: Role } | null;
  attachments: ApplicationAttachment[];
}

export interface ApplicationListResult {
  applications: Application[];
  total: number;
  page: number;
  pageSize: number;
}

export interface HistoryEntry {
  id: string;
  action: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  remarks: string | null;
  actor: { id: string; fullName: string; role: string } | null;
  occurredAt: string;
}

// --- Notifications (Phase 6/7) ---

export interface NotificationItem {
  id: string;
  applicationId: string | null;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  channels?: string[];
  createdAt: string;
}

export interface NotificationListResult {
  notifications: NotificationItem[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

// --- Calendar (Phase 3) ---

export interface Holiday {
  id: string;
  name: string;
  date: string;
  type: 'PUBLIC' | 'UNIVERSITY' | 'SPECIAL';
}

export interface SemesterBreak {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}
