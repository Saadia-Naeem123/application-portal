import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  Bell,
  CalendarDays,
  UserCircle,
  HelpCircle,
  ClipboardCheck,
  History,
  Users,
  BarChart3,
  Inbox,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Search,
  Building2,
  UserCog,
  ListTree,
  Route,
  CalendarClock,
  ScrollText,
  Settings,
  Award,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types';

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

const STUDENT_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications/new', label: 'New Application', icon: FilePlus2 },
  { href: '/applications', label: 'My Applications', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/profile', label: 'Profile', icon: UserCircle },
  { href: '/help', label: 'Help & Support', icon: HelpCircle },
];

const FACULTY_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications/new', label: 'New Application', icon: FilePlus2 },
  { href: '/applications', label: 'My Applications', icon: FileText },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

// Same layout as the Faculty portal per the Staff portal spec.
const STAFF_LINKS: NavLink[] = FACULTY_LINKS;

const SUPERVISOR_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reviews', label: 'Pending Reviews', icon: ClipboardCheck },
  { href: '/reviews/history', label: 'Reviewed Applications', icon: History },
  { href: '/students', label: 'Students', icon: Users },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const DEPARTMENT_OFFICER_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/department/pending', label: 'Pending Department Requests', icon: Inbox },
  { href: '/department/approved', label: 'Approved Applications', icon: CheckCircle2 },
  { href: '/department/rejected', label: 'Rejected Applications', icon: XCircle },
  { href: '/department/escalated', label: 'Escalated Applications', icon: ArrowUpRight },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const DEAN_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dean/escalated', label: 'Escalated Applications', icon: ArrowUpRight },
  { href: '/dean/performance', label: 'Department Performance', icon: Award },
  { href: '/analytics', label: 'Reports', icon: BarChart3 },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const DEFAULT_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const ADMIN_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'User Management', icon: UserCog },
  { href: '/admin/departments', label: 'Department Management', icon: Building2 },
  { href: '/admin/supervisors', label: 'Supervisor Management', icon: Users },
  { href: '/admin/application-types', label: 'Application Types', icon: ListTree },
  { href: '/admin/routing-rules', label: 'Routing Rules', icon: Route },
  { href: '/admin/holidays', label: 'Holiday Calendar', icon: CalendarClock },
  { href: '/search', label: 'Applications', icon: Search },
  { href: '/analytics', label: 'Reports & Analytics', icon: BarChart3 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/admin/audit-logs', label: 'Audit Logs', icon: ScrollText },
  { href: '/admin/settings', label: 'System Settings', icon: Settings },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const LINKS_BY_ROLE: Record<Role, NavLink[]> = {
  STUDENT: STUDENT_LINKS,
  FACULTY: FACULTY_LINKS,
  STAFF: STAFF_LINKS,
  ACADEMIC_SUPERVISOR: SUPERVISOR_LINKS,
  DEPARTMENT_OFFICER: DEPARTMENT_OFFICER_LINKS,
  DEAN: DEAN_LINKS,
  ADMIN: ADMIN_LINKS,
};

export function getNavLinksForRole(role?: Role): NavLink[] {
  if (!role) return DEFAULT_LINKS;
  return LINKS_BY_ROLE[role] || DEFAULT_LINKS;
}
