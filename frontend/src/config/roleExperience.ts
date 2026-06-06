import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  FolderKanban,
  Home,
  Key,
  Layers,
  ListChecks,
  LucideIcon,
  ShieldCheck,
  User,
  UserCog,
  Users,
  WalletCards,
} from 'lucide-react';
import { PERMISSIONS } from '@/utils/permissions';

export type WorkspaceRole = 'admin' | 'hr' | 'departmentHead' | 'manager' | 'employee' | 'user';

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
  departmentHead: ['DEPARTMENT_HEAD', 'HEAD_OF_DEPARTMENT', 'TRUONG_PHONG', 'TRUONGPHONG'],
  manager: ['MANAGER', 'QUAN_LY', 'TEAM_LEAD', 'LEAD'],
  employee: ['EMPLOYEE', 'NHAN_VIEN', 'STAFF'],
  user: ['USER', 'PORTAL_USER', 'NORMAL_USER', 'GUEST_USER'],
};

const rolePriority: WorkspaceRole[] = ['admin', 'hr', 'departmentHead', 'manager', 'employee', 'user'];

export const resolveWorkspaceRole = (roles: string[] = []): WorkspaceRole => {
  const normalizedRoles = roles.map((role) => role.trim().toUpperCase());
  const matchedRole = rolePriority.find((role) =>
    roleAliases[role].some((alias) => normalizedRoles.includes(alias))
  );

  return matchedRole ?? 'user';
};

export const workspaceNavigation: NavigationItem[] = [
  { icon: Home, label: 'Trang chủ', path: '/' },
  {
    icon: Layers,
    label: 'Tổ chức',
    path: '/organizations',
    permission: PERMISSIONS.ORGANIZATION_VIEW,
    roles: ['admin', 'hr', 'departmentHead'],
  },
  {
    icon: Users,
    label: 'Nhân viên',
    path: '/employees',
    permission: PERMISSIONS.EMPLOYEE_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager'],
  },
  {
    icon: Building2,
    label: 'Phòng ban',
    path: '/departments',
    permission: PERMISSIONS.DEPARTMENT_VIEW,
    roles: ['admin', 'hr', 'departmentHead', 'manager'],
  },
  {
    icon: FolderKanban,
    label: 'Dự án',
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
    label: 'Tài khoản',
    path: '/users',
    permission: PERMISSIONS.USER_VIEW,
    roles: ['admin', 'hr'],
  },
  {
    icon: Key,
    label: 'Vai trò',
    path: '/roles',
    permission: PERMISSIONS.ROLE_VIEW,
    roles: ['admin'],
  },
  {
    icon: ShieldCheck,
    label: 'Tài khoản của tôi',
    path: '/workspace/account-security',
    roles: ['user'],
  },
  {
    icon: Clock3,
    label: 'Chấm công',
    path: '/workspace/timekeeping',
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    icon: CalendarCheck,
    label: 'Nghỉ phép',
    path: '/workspace/leave',
    roles: ['employee', 'manager', 'departmentHead'],
  },
  {
    icon: Briefcase,
    label: 'Task cá nhân',
    path: '/workspace/personal-tasks',
    roles: ['employee'],
  },
  {
    icon: ClipboardCheck,
    label: 'Duyệt timesheet',
    path: '/workspace/timesheet-approval',
    roles: ['manager', 'departmentHead'],
  },
  {
    icon: Briefcase,
    label: 'Task nhóm',
    path: '/workspace/team-tasks',
    roles: ['manager', 'departmentHead'],
  },
  {
    icon: FileCheck2,
    label: 'Phê duyệt phòng ban',
    path: '/workspace/department-approvals',
    roles: ['departmentHead'],
  },
  {
    icon: BarChart3,
    label: 'Báo cáo phòng ban',
    path: '/workspace/department-reports',
    roles: ['departmentHead'],
  },
  {
    icon: WalletCards,
    label: 'Phúc lợi',
    path: '/workspace/benefits',
    roles: ['hr'],
  },
];

export const roleProfiles: Record<WorkspaceRole, RoleProfile> = {
  admin: {
    role: 'admin',
    label: 'Quản trị hệ thống',
    badge: 'ADMIN',
    headline: 'Bảng điều phối quản trị hệ thống',
    description: 'Tập trung vào tài khoản, vai trò, quyền truy cập và các điểm cần kiểm toán.',
    toneClass: 'from-slate-950 via-cyan-900 to-emerald-700',
    statCards: [
      { label: 'Tài khoản', value: 'Quản trị', hint: 'Tạo, khóa và cấp quyền người dùng', icon: UserCog },
      { label: 'Vai trò', value: 'RBAC', hint: 'Role, permission và phạm vi truy cập', icon: Key },
      { label: 'Audit', value: 'Theo dõi', hint: 'Dấu vết thay đổi nhạy cảm', icon: ShieldCheck },
    ],
    focusAreas: ['Tài khoản có quyền cao', 'Role và permission', 'Audit và cấu hình hệ thống'],
    actions: [
      {
        title: 'Quản lý tài khoản',
        description: 'Tạo, khóa, mở khóa và cập nhật vai trò người dùng.',
        icon: UserCog,
        href: '/users',
        permission: PERMISSIONS.USER_VIEW,
        status: 'ready',
      },
      {
        title: 'Quản lý vai trò',
        description: 'Kiểm soát role và quyền truy cập từng module.',
        icon: Key,
        href: '/roles',
        permission: PERMISSIONS.ROLE_VIEW,
        status: 'ready',
      },
      {
        title: 'Cấu trúc tổ chức',
        description: 'Quản lý công ty, phòng ban và đơn vị trực thuộc.',
        icon: Layers,
        href: '/organizations',
        permission: PERMISSIONS.ORGANIZATION_VIEW,
        status: 'ready',
      },
    ],
  },
  hr: {
    role: 'hr',
    label: 'Nhân sự',
    badge: 'HR',
    headline: 'Không gian nghiệp vụ nhân sự',
    description: 'Tập trung vào hồ sơ nhân sự, phòng ban, vòng đời nhân viên và phúc lợi.',
    toneClass: 'from-cyan-900 via-teal-800 to-emerald-700',
    statCards: [
      { label: 'Hồ sơ nhân sự', value: 'HRIS', hint: 'Thông tin nhân viên và trạng thái làm việc', icon: Users },
      { label: 'Phúc lợi', value: 'Benefit', hint: 'Bảo hiểm, phụ cấp và dữ liệu payroll', icon: WalletCards },
      { label: 'Lifecycle', value: 'Vận hành', hint: 'Onboard, transfer, offboard', icon: FileCheck2 },
    ],
    focusAreas: ['Hồ sơ nhân sự chính xác', 'Dữ liệu phúc lợi để trước kỳ lương', 'Điều phối thay Đổi phòng ban'],
    actions: [
      {
        title: 'Hồ sơ nhân sự',
        description: 'Tra cứu, thêm mới và cập nhật hồ sơ nhân viên.',
        icon: Users,
        href: '/employees',
        permission: PERMISSIONS.EMPLOYEE_VIEW,
        status: 'ready',
      },
      {
        title: 'Quản lý phòng ban',
        description: 'Theo dõi phòng ban, trưởng phòng và tình trạng nhân sự.',
        icon: Building2,
        href: '/departments',
        permission: PERMISSIONS.DEPARTMENT_VIEW,
        status: 'ready',
      },
      {
        title: 'Hồ sơ phúc lợi',
        description: 'Rà soát bảo hiểm, phụ cấp và dữ liệu phúc lợi.',
        icon: WalletCards,
        href: '/workspace/benefits',
        status: 'ready',
      },
    ],
  },
  departmentHead: {
    role: 'departmentHead',
    label: 'Trưởng phòng',
    badge: 'DEPARTMENT_HEAD',
    headline: 'Bảng điều hành phòng ban',
    description: 'Theo dõi báo cáo phòng ban, phê duyệt cấp phòng và các rủi ro vận hành.',
    toneClass: 'from-sky-900 via-blue-800 to-emerald-700',
    statCards: [
      { label: 'Báo cáo', value: 'Phòng ban', hint: 'KPI, headcount và tải công việc', icon: BarChart3 },
      { label: 'Phê duyệt', value: 'Cấp phòng', hint: 'Nghỉ phép, phân bổ, Điều chuyển', icon: ClipboardCheck },
      { label: 'Nhân sự', value: 'Phạm vi', hint: 'Nhân viên và quản lý trực thuộc', icon: Users },
    ],
    focusAreas: ['Báo cáo phòng ban', 'Phê duyệt cấp phòng', 'Rủi ro tải công việc'],
    actions: [
      {
        title: 'Phê duyệt phòng ban',
        description: 'Gom các yêu cầu nghỉ phép, Điều chuyển và phân bổ nhân sự.',
        icon: ClipboardCheck,
        href: '/workspace/department-approvals',
        status: 'ready',
      },
      {
        title: 'Báo cáo phòng ban',
        description: 'Tổng hợp KPI, headcount và tình trạng vận hành.',
        icon: BarChart3,
        href: '/workspace/department-reports',
        status: 'ready',
      },
      {
        title: 'Task nhóm',
        description: 'Theo dõi task nhóm và các đểu việc cần can thiệp.',
        icon: Briefcase,
        href: '/workspace/team-tasks',
        status: 'ready',
      },
    ],
  },
  manager: {
    role: 'manager',
    label: 'Quản lý',
    badge: 'MANAGER',
    headline: 'Không gian quản lý nhóm',
    description: 'Tập trung duyệt timesheet, điều phối task nhóm và theo dõi tiến độ hằng ngày.',
    toneClass: 'from-stone-900 via-slate-800 to-teal-700',
    statCards: [
      { label: 'Timesheet', value: 'Duyệt', hint: 'Ngoại lệ chấm công trong nhóm', icon: Clock3 },
      { label: 'Task nhóm', value: 'Điều phối', hint: 'Ưu tiên, deadline và tải công việc', icon: Briefcase },
      { label: 'Nhân sự', value: 'Trực tiếp', hint: 'Danh sách nhân viên phụ trách', icon: Users },
    ],
    focusAreas: ['Duyệt timesheet', 'Task nhóm', 'Tiến độ và ngoại lệ trong ngày'],
    actions: [
      {
        title: 'Duyệt timesheet',
        description: 'Xác nhận bạng công, OT và các ngoại lệ cần quản lý xử lý.',
        icon: Clock3,
        href: '/workspace/timesheet-approval',
        status: 'ready',
      },
      {
        title: 'Task nhóm',
        description: 'Theo dõi giao việc, ưu tiên và trạng thái thực hiện.',
        icon: Briefcase,
        href: '/workspace/team-tasks',
        status: 'ready',
      },
      {
        title: 'Nhân viên trong nhóm',
        description: 'Xem hồ sơ nhân viên trong phạm vi quản lý.',
        icon: Users,
        href: '/employees',
        permission: PERMISSIONS.EMPLOYEE_VIEW,
        status: 'ready',
      },
    ],
  },
  employee: {
    role: 'employee',
    label: 'Nhân viên',
    badge: 'EMPLOYEE',
    headline: 'Không gian làm việc cá nhân',
    description: 'Theo dõi chấm công, nghỉ phép và task cá nhân được giao.',
    toneClass: 'from-zinc-950 via-slate-800 to-cyan-800',
    statCards: [
      { label: 'Chấm công', value: 'Timesheet', hint: 'Ngày công, giờ làm và ghi chú', icon: Clock3 },
      { label: 'Nghỉ phép', value: 'Yêu cầu', hint: 'Tạo đơn và xem trạng thái duyệt', icon: CalendarCheck },
      { label: 'Task cá nhân', value: 'Của tôi', hint: 'Việc đang làm và deadline gần', icon: Briefcase },
    ],
    focusAreas: ['Chấm công hôm nay', 'Đơn nghỉ phép', 'Task cá nhân cần hoàn tất'],
    actions: [
      {
        title: 'Chấm công',
        description: 'Theo dõi ngày công, giờ làm và các ghi chú cần bổ sung.',
        icon: Clock3,
        href: '/workspace/timekeeping',
        status: 'ready',
      },
      {
        title: 'Nghỉ phép',
        description: 'Tạo yêu cầu nghỉ phép và theo dõi trạng thái phê duyệt.',
        icon: CalendarCheck,
        href: '/workspace/leave',
        status: 'ready',
      },
      {
        title: 'Task cá nhân',
        description: 'Xem task được giao, deadline và mức ưu tiên.',
        icon: Briefcase,
        href: '/workspace/personal-tasks',
        status: 'ready',
      },
    ],
  },
  user: {
    role: 'user',
    label: 'Người dùng',
    badge: 'USER',
    headline: 'Không gian tài khoản cá nhân',
    description: 'Dành cho tài khoản, bảo mật và quyền truy cập được cấp.',
    toneClass: 'from-slate-950 via-zinc-800 to-cyan-800',
    statCards: [
      { label: 'Tài khoản', value: 'Cá nhân', hint: 'Thông tin đăng nhập và liên hệ', icon: User },
      { label: 'Bảo mật', value: 'Mật khẩu', hint: 'Đổi mật khẩu và hạn bảo mật', icon: Key },
      { label: 'Quyền truy cập', value: 'Giời h?n', hint: 'Ch? m? các khu vực được cấp quyền', icon: ShieldCheck },
    ],
    focusAreas: ['Thông tin tài khoản', 'Bảo mật cá nhân', 'Quyền truy cập hiện tại'],
    actions: [
      {
        title: 'Hồ sơ tài khoản',
        description: 'Xem tháng tin người dùng, email, vai trò và trạng thái tài khoản.',
        icon: User,
        href: '/profile',
        status: 'ready',
      },
      {
        title: 'Đổi mật khẩu',
        description: 'Cập nhật mật khẩu đã b?o v? tài khoản đăng nhập.',
        icon: Key,
        href: '/change-password',
        status: 'ready',
      },
      {
        title: 'Quyền truy cập',
        description: 'Xem phạm vi quyền hiện tại và các khu vực có thể mở.',
        icon: ShieldCheck,
        href: '/workspace/account-security',
        status: 'ready',
      },
    ],
  },
};
