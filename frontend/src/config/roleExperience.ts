import {
  BarChart3,
  Bell,
  Bot,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FileText,
  FolderKanban,
  History,
  Home,
  Key,
  Layers,
  LayoutDashboard,
  ListChecks,
  LucideIcon,
  ShieldCheck,
  User,
  UserCog,
  Users,
  WalletCards,
  MessageSquareText,
  PlugZap,
  Smartphone,
  Workflow,
} from 'lucide-react';
import { PERMISSIONS } from '@/utils/permissions';

export type WorkspaceRole = 'admin' | 'hr' | 'payroll' | 'departmentHead' | 'manager' | 'employee' | 'user';

export interface NavigationItem {
  icon: LucideIcon;
  label: string;
  path: string;
  permission?: string;
  roles?: WorkspaceRole[];
}

export interface RoleAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  permission?: string;
  status?: 'ready' | 'soon';
}

export interface RoleProfile {
  role: WorkspaceRole;
  label: string;
  badge: string;
  headline: string;
  description: string;
  toneClass: string;
  statCards: Array<{
    label: string;
    value: string;
    hint: string;
    icon: LucideIcon;
  }>;
  focusAreas: string[];
  actions: RoleAction[];
}

const roleAliases: Record<WorkspaceRole, string[]> = {
  admin: ['ADMIN', 'SUPER_ADMIN'],
  hr: ['HR_MANAGER', 'HR', 'HR_ADMIN'],
  payroll: ['PAYROLL_OFFICER', 'PAYROLL', 'PAYROLL_ADMIN'],
  departmentHead: ['DEPARTMENT_HEAD', 'HEAD_OF_DEPARTMENT', 'TRUONG_PHONG', 'TRUONGPHONG'],
  manager: ['MANAGER', 'QUAN_LY', 'TEAM_LEAD', 'LEAD'],
  employee: ['EMPLOYEE', 'NHAN_VIEN', 'STAFF'],
  user: ['USER', 'PORTAL_USER', 'NORMAL_USER', 'GUEST_USER'],
};

const rolePriority: WorkspaceRole[] = ['admin', 'payroll', 'hr', 'departmentHead', 'manager', 'employee', 'user'];

export const resolveWorkspaceRole = (roles: string[] = []): WorkspaceRole => {
  const normalizedRoles = roles.map((role) => role.trim().toUpperCase());
  const matchedRole = rolePriority.find((role) =>
    roleAliases[role].some((alias) => normalizedRoles.includes(alias))
  );

  return matchedRole ?? 'user';
};

export const workspaceNavigation: NavigationItem[] = [
  { icon: Home, label: 'Trang chu', path: '/' },
  {
    icon: LayoutDashboard,
    label: 'My Dashboard',
    path: '/work',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: ListChecks,
    label: 'My Tasks',
    path: '/work/my-tasks',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    icon: FolderKanban,
    label: 'Project Board',
    path: '/work/board',
    permission: PERMISSIONS.PROJECT_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: ClipboardCheck,
    label: 'Task Management',
    path: '/work/manage',
    permission: PERMISSIONS.TASK_CREATE,
    roles: ['manager', 'admin'],
  },
  {
    icon: FileCheck2,
    label: 'Approvals',
    path: '/work/approvals',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    icon: Bell,
    label: 'Notifications',
    path: '/work/notifications',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: MessageSquareText,
    label: 'Discussions',
    path: '/work/discussions',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: FileText,
    label: 'Files',
    path: '/work/files',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: History,
    label: 'Activity Log',
    path: '/work/activity',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: User,
    label: 'Profile Settings',
    path: '/work/settings',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: BarChart3,
    label: 'Analytics',
    path: '/work/analytics',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    icon: CalendarCheck,
    label: 'Timeline',
    path: '/work/timeline',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    icon: Bot,
    label: 'AI Suggestions',
    path: '/work/ai',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    icon: Workflow,
    label: 'Automation',
    path: '/work/automation',
    permission: PERMISSIONS.TASK_UPDATE,
    roles: ['manager', 'admin'],
  },
  {
    icon: PlugZap,
    label: 'Integrations',
    path: '/work/integrations',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['manager', 'departmentHead', 'admin'],
  },
  {
    icon: Smartphone,
    label: 'I18n & Mobile',
    path: '/work/mobile',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['employee', 'manager', 'departmentHead', 'admin'],
  },
  {
    icon: UserCog,
    label: 'Identity & Access',
    path: '/work/admin',
    permission: PERMISSIONS.USER_VIEW,
    roles: ['admin'],
  },
  {
    icon: Layers,
    label: 'To chuc',
    path: '/organizations',
    permission: PERMISSIONS.ORGANIZATION_VIEW,
    roles: ['admin', 'hr', 'departmentHead'],
  },
  {
    icon: Users,
    label: 'Nhan vien',
    path: '/employees',
    permission: PERMISSIONS.EMPLOYEE_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager'],
  },
  {
    icon: Building2,
    label: 'Phong ban',
    path: '/departments',
    permission: PERMISSIONS.DEPARTMENT_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager'],
  },
  {
    icon: WalletCards,
    label: 'Bang luong',
    path: '/payroll',
    permission: PERMISSIONS.PAYROLL_VIEW,
    roles: ['admin', 'payroll', 'hr'],
  },
  {
    icon: FileText,
    label: 'Tai lieu phong ban',
    path: '/documents',
  },
  {
    icon: FolderKanban,
    label: 'Du an',
    path: '/projects',
    permission: PERMISSIONS.PROJECT_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager', 'employee'],
  },
  {
    icon: ListChecks,
    label: 'Task',
    path: '/tasks',
    permission: PERMISSIONS.TASK_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager', 'employee'],
  },
  {
    icon: UserCog,
    label: 'Tai khoan',
    path: '/users',
    permission: PERMISSIONS.USER_VIEW,
    roles: ['admin', 'hr'],
  },
  {
    icon: Key,
    label: 'Vai tro',
    path: '/roles',
    permission: PERMISSIONS.ROLE_VIEW,
    roles: ['admin'],
  },
  {
    icon: ShieldCheck,
    label: 'Tai khoan cua toi',
    path: '/workspace/account-security',
    roles: ['user'],
  },
  {
    icon: Clock3,
    label: 'Cham cong',
    path: '/workspace/timekeeping',
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    icon: CalendarCheck,
    label: 'Nghi phep',
    path: '/workspace/leave',
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    icon: Briefcase,
    label: 'Task ca nhan',
    path: '/workspace/personal-tasks',
    roles: ['employee'],
  },
  {
    icon: ClipboardCheck,
    label: 'Duyet timesheet',
    path: '/workspace/timesheet-approval',
    roles: ['manager', 'departmentHead'],
  },
  {
    icon: Briefcase,
    label: 'Task nhom',
    path: '/workspace/team-tasks',
    roles: ['manager', 'departmentHead'],
  },
  {
    icon: FileCheck2,
    label: 'Phe duyet phong ban',
    path: '/workspace/approvals',
    roles: ['departmentHead'],
  },
  {
    icon: BarChart3,
    label: 'Bao cao phong ban',
    path: '/workspace/department-reports',
    roles: ['departmentHead'],
  },
  {
    icon: Users,
    label: 'Ho so nhan su',
    path: '/workspace/hr-records',
    roles: ['hr'],
  },
  {
    icon: WalletCards,
    label: 'Phuc loi',
    path: '/workspace/benefits',
    roles: ['hr'],
  },
];

export const roleProfiles: Record<WorkspaceRole, RoleProfile> = {
  admin: {
    role: 'admin',
    label: 'Quan tri he thong',
    badge: 'ADMIN',
    headline: 'Bang dieu phoi quan tri he thong',
    description: 'Tap trung vao tai khoan, vai tro, quyen truy cap va cac diem can kiem toan.',
    toneClass: 'from-slate-950 via-cyan-900 to-emerald-700',
    statCards: [
      { label: 'Tai khoan', value: 'Quan tri', hint: 'Tao, khoa va cap quyen nguoi dung', icon: UserCog },
      { label: 'Vai tro', value: 'RBAC', hint: 'Role, permission va pham vi truy cap', icon: Key },
      { label: 'Audit', value: 'Theo doi', hint: 'Dau vet thay doi nhay cam', icon: ShieldCheck },
    ],
    focusAreas: ['Tai khoan co quyen cao', 'Role va permission', 'Audit va cau hinh he thong'],
    actions: [
      {
        title: 'Quan ly tai khoan',
        description: 'Tao, khoa, mo khoa va cap nhat vai tro nguoi dung.',
        icon: UserCog,
        href: '/users',
        permission: PERMISSIONS.USER_VIEW,
        status: 'ready',
      },
      {
        title: 'Quan ly vai tro',
        description: 'Kiem soat role va quyen truy cap tung module.',
        icon: Key,
        href: '/roles',
        permission: PERMISSIONS.ROLE_VIEW,
        status: 'ready',
      },
      {
        title: 'Audit va phan quyen',
        description: 'Theo doi thay doi tai khoan, role va su kien nhay cam.',
        icon: ShieldCheck,
        href: '/workspace/audit',
        status: 'ready',
      },
    ],
  },
  hr: {
    role: 'hr',
    label: 'Nhan su',
    badge: 'HR',
    headline: 'Khong gian nghiep vu nhan su',
    description: 'Tap trung vao ho so nhan su, phong ban, vong doi nhan vien va phuc loi.',
    toneClass: 'from-cyan-900 via-teal-800 to-emerald-700',
    statCards: [
      { label: 'Ho so nhan su', value: 'HRIS', hint: 'Thong tin nhan vien va trang thai lam viec', icon: Users },
      { label: 'Phuc loi', value: 'Benefit', hint: 'Bao hiem, phu cap va du lieu payroll', icon: WalletCards },
      { label: 'Lifecycle', value: 'Van hanh', hint: 'Onboard, transfer, offboard', icon: FileCheck2 },
    ],
    focusAreas: ['Ho so nhan su chinh xac', 'Du lieu phuc loi truoc ky luong', 'Dieu phoi thay doi phong ban'],
    actions: [
      {
        title: 'Ho so nhan su',
        description: 'Tra cuu, them moi va cap nhat ho so nhan vien.',
        icon: Users,
        href: '/workspace/hr-records',
        status: 'ready',
      },
      {
        title: 'Quan ly phong ban',
        description: 'Theo doi phong ban, truong phong va tinh trang nhan su.',
        icon: Building2,
        href: '/departments',
        permission: PERMISSIONS.DEPARTMENT_VIEW,
        status: 'ready',
      },
      {
        title: 'Ho so phuc loi',
        description: 'Ra soat bao hiem, phu cap va du lieu phuc loi.',
        icon: WalletCards,
        href: '/workspace/benefits',
        status: 'ready',
      },
    ],
  },
  payroll: {
    role: 'payroll',
    label: 'Payroll',
    badge: 'PAYROLL_OFFICER',
    headline: 'Khong gian bang luong',
    description: 'Tap trung vao ky luong, tinh luong, phe duyet va lich su chi tra theo dung pham vi payroll.',
    toneClass: 'from-slate-950 via-indigo-900 to-cyan-700',
    statCards: [
      { label: 'Bang luong', value: 'Payroll', hint: 'Tinh va doi soat luong theo thang', icon: WalletCards },
      { label: 'Workflow', value: 'Duyet', hint: 'Draft, approved va processed', icon: ClipboardCheck },
      { label: 'Audit', value: 'Khoa so', hint: 'Du lieu processed dung cho ban giao', icon: ShieldCheck },
    ],
    focusAreas: ['Ky luong dang xu ly', 'Bang luong can phe duyet', 'Lich su chi tra va audit'],
    actions: [
      {
        title: 'Quan ly bang luong',
        description: 'Tao ky, tinh luong, phe duyet va xu ly chi tra.',
        icon: WalletCards,
        href: '/payroll',
        permission: PERMISSIONS.PAYROLL_VIEW,
        status: 'ready',
      },
      {
        title: 'Ho so nhan vien',
        description: 'Xem thong tin nhan vien de doi soat payroll.',
        icon: Users,
        href: '/employees',
        permission: PERMISSIONS.EMPLOYEE_VIEW,
        status: 'ready',
      },
      {
        title: 'Bao cao payroll',
        description: 'Theo doi cac ky luong da xu ly.',
        icon: ClipboardCheck,
        href: '/payroll',
        permission: PERMISSIONS.PAYROLL_VIEW,
        status: 'ready',
      },
    ],
  },
  departmentHead: {
    role: 'departmentHead',
    label: 'Truong phong',
    badge: 'DEPARTMENT_HEAD',
    headline: 'Bang dieu hanh phong ban',
    description: 'Theo doi bao cao phong ban, phe duyet cap phong va cac rui ro van hanh.',
    toneClass: 'from-sky-900 via-blue-800 to-emerald-700',
    statCards: [
      { label: 'Bao cao', value: 'Phong ban', hint: 'KPI, headcount va tai cong viec', icon: BarChart3 },
      { label: 'Phe duyet', value: 'Cap phong', hint: 'Nghi phep, phan bo, dieu chuyen', icon: ClipboardCheck },
      { label: 'Nhan su', value: 'Pham vi', hint: 'Nhan vien va quan ly truc thuoc', icon: Users },
    ],
    focusAreas: ['Bao cao phong ban', 'Phe duyet cap phong', 'Rui ro tai cong viec'],
    actions: [
      {
        title: 'Phe duyet phong ban',
        description: 'Gom yeu cau nghi phep, dieu chuyen va phan bo nhan su.',
        icon: ClipboardCheck,
        href: '/workspace/approvals',
        status: 'ready',
      },
      {
        title: 'Bao cao phong ban',
        description: 'Tong hop KPI, headcount va tinh trang van hanh.',
        icon: BarChart3,
        href: '/workspace/department-reports',
        status: 'ready',
      },
      {
        title: 'Task nhom',
        description: 'Theo doi task nhom va cac dau viec can can thiep.',
        icon: Briefcase,
        href: '/workspace/team-tasks',
        status: 'ready',
      },
    ],
  },
  manager: {
    role: 'manager',
    label: 'Quan ly',
    badge: 'MANAGER',
    headline: 'Khong gian quan ly nhom',
    description: 'Tap trung duyet timesheet, dieu phoi task nhom va theo doi tien do hang ngay.',
    toneClass: 'from-stone-900 via-slate-800 to-teal-700',
    statCards: [
      { label: 'Timesheet', value: 'Duyet', hint: 'Ngoai le cham cong trong nhom', icon: Clock3 },
      { label: 'Task nhom', value: 'Dieu phoi', hint: 'Uu tien, deadline va tai cong viec', icon: Briefcase },
      { label: 'Nhan su', value: 'Truc tiep', hint: 'Danh sach nhan vien phu trach', icon: Users },
    ],
    focusAreas: ['Duyet timesheet', 'Task nhom', 'Tien do va ngoai le trong ngay'],
    actions: [
      {
        title: 'Duyet timesheet',
        description: 'Xac nhan bang cong, OT va cac ngoai le can quan ly xu ly.',
        icon: Clock3,
        href: '/workspace/timesheet-approval',
        status: 'ready',
      },
      {
        title: 'Task nhom',
        description: 'Theo doi giao viec, uu tien va trang thai thuc hien.',
        icon: Briefcase,
        href: '/workspace/team-tasks',
        status: 'ready',
      },
      {
        title: 'Nhan vien trong nhom',
        description: 'Xem ho so nhan vien trong pham vi quan ly.',
        icon: Users,
        href: '/employees',
        permission: PERMISSIONS.EMPLOYEE_VIEW,
        status: 'ready',
      },
    ],
  },
  employee: {
    role: 'employee',
    label: 'Nhan vien',
    badge: 'EMPLOYEE',
    headline: 'Khong gian lam viec ca nhan',
    description: 'Theo doi cham cong, nghi phep va task ca nhan duoc giao.',
    toneClass: 'from-zinc-950 via-slate-800 to-cyan-800',
    statCards: [
      { label: 'Cham cong', value: 'Timesheet', hint: 'Ngay cong, gio lam va ghi chu', icon: Clock3 },
      { label: 'Nghi phep', value: 'Yeu cau', hint: 'Tao don va xem trang thai duyet', icon: CalendarCheck },
      { label: 'Task ca nhan', value: 'Cua toi', hint: 'Viec dang lam va deadline gan', icon: Briefcase },
    ],
    focusAreas: ['Cham cong hom nay', 'Don nghi phep', 'Task ca nhan can hoan tat'],
    actions: [
      {
        title: 'Cham cong',
        description: 'Theo doi ngay cong, gio lam va cac ghi chu can bo sung.',
        icon: Clock3,
        href: '/workspace/timekeeping',
        status: 'ready',
      },
      {
        title: 'Nghi phep',
        description: 'Tao yeu cau nghi phep va theo doi trang thai phe duyet.',
        icon: CalendarCheck,
        href: '/workspace/leave',
        status: 'ready',
      },
      {
        title: 'Task ca nhan',
        description: 'Xem task duoc giao, deadline va muc uu tien.',
        icon: Briefcase,
        href: '/workspace/personal-tasks',
        status: 'ready',
      },
    ],
  },
  user: {
    role: 'user',
    label: 'Nguoi dung',
    badge: 'USER',
    headline: 'Khong gian tai khoan ca nhan',
    description: 'Danh cho tai khoan, bao mat va quyen truy cap duoc cap.',
    toneClass: 'from-slate-950 via-zinc-800 to-cyan-800',
    statCards: [
      { label: 'Tai khoan', value: 'Ca nhan', hint: 'Thong tin dang nhap va lien he', icon: User },
      { label: 'Bao mat', value: 'Mat khau', hint: 'Doi mat khau va han bao mat', icon: Key },
      { label: 'Quyen truy cap', value: 'Gioi han', hint: 'Chi mo cac khu vuc duoc cap quyen', icon: ShieldCheck },
    ],
    focusAreas: ['Thong tin tai khoan', 'Bao mat ca nhan', 'Quyen truy cap hien tai'],
    actions: [
      {
        title: 'Ho so tai khoan',
        description: 'Xem thong tin nguoi dung, email, vai tro va trang thai tai khoan.',
        icon: User,
        href: '/profile',
        status: 'ready',
      },
      {
        title: 'Doi mat khau',
        description: 'Cap nhat mat khau de bao ve tai khoan dang nhap.',
        icon: Key,
        href: '/change-password',
        status: 'ready',
      },
      {
        title: 'Quyen truy cap',
        description: 'Xem pham vi quyen hien tai va cac khu vuc co the mo.',
        icon: ShieldCheck,
        href: '/workspace/account-security',
        status: 'ready',
      },
    ],
  },
};
