import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  FolderKanban,
  FolderTree,
  Hourglass,
  ListChecks,
  LucideIcon,
  Mail,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Badge } from '@/components/UI/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { usePermissions } from '@/hooks/usePermissions';
import { resolveWorkspaceRole, roleProfiles, WorkspaceRole } from '@/config/roleExperience';
import { formatDate, getPasswordExpiryWarning } from '@/utils/format';
import { PERMISSIONS } from '@/utils/permissions';
import { cn } from '@/utils/cn';

type Priority = 'high' | 'medium' | 'normal';
type FeatureTone = 'blue' | 'rose' | 'emerald' | 'amber' | 'violet' | 'cyan';
type WorkActionTone = 'blue' | 'amber' | 'slate';

interface RoleWorkItem {
  title: string;
  description: string;
  meta: string;
  priority: Priority;
  actionLabel?: string;
  actionTone?: WorkActionTone;
}

interface RoleDashboardExperience {
  summaryTitle: string;
  operatingModel: string;
  health: Array<{ label: string; value: string; hint: string }>;
  workQueue: RoleWorkItem[];
  accessNotes: string[];
}

const priorityStyles: Record<Priority, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
  high: { label: 'Ưu tiên cao', variant: 'danger' },
  medium: { label: 'Cần xử lý', variant: 'warning' },
  normal: { label: 'Ổn định', variant: 'success' },
};

const featureTones: Record<FeatureTone, { border: string; icon: string; text: string; badge: string }> = {
  blue: {
    border: 'from-blue-500 via-cyan-400 to-sky-500',
    icon: 'bg-blue-100 text-blue-700 ring-blue-200',
    text: 'text-blue-700',
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
  },
  rose: {
    border: 'from-rose-500 via-orange-400 to-amber-400',
    icon: 'bg-rose-100 text-rose-700 ring-rose-200',
    text: 'text-rose-700',
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
  },
  emerald: {
    border: 'from-emerald-500 via-teal-400 to-cyan-400',
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    text: 'text-emerald-700',
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  },
  amber: {
    border: 'from-amber-500 via-orange-400 to-rose-400',
    icon: 'bg-amber-100 text-amber-700 ring-amber-200',
    text: 'text-amber-700',
    badge: 'bg-amber-50 text-amber-700 ring-amber-200',
  },
  violet: {
    border: 'from-violet-500 via-fuchsia-400 to-sky-400',
    icon: 'bg-violet-100 text-violet-700 ring-violet-200',
    text: 'text-violet-700',
    badge: 'bg-violet-50 text-violet-700 ring-violet-200',
  },
  cyan: {
    border: 'from-cyan-500 via-sky-400 to-blue-500',
    icon: 'bg-cyan-100 text-cyan-700 ring-cyan-200',
    text: 'text-cyan-700',
    badge: 'bg-cyan-50 text-cyan-700 ring-cyan-200',
  },
};

const featureToneOrder: FeatureTone[] = ['blue', 'rose', 'emerald', 'amber', 'violet', 'cyan'];

const getFeatureTone = (index: number) => featureTones[featureToneOrder[index % featureToneOrder.length]];

const featureCardShell =
  'group relative h-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 transition duration-150 ease-out hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)] focus-within:-translate-y-0.5 focus-within:border-cyan-200 focus-within:shadow-[0_12px_24px_rgba(15,23,42,0.07)]';

const featureCardInner =
  'relative flex h-full flex-col bg-transparent p-5 transition duration-150 group-hover:bg-slate-50/60';

const dashboardExperience: Record<WorkspaceRole, RoleDashboardExperience> = {
  user: {
    summaryTitle: 'Tổng quan tài khoản',
    operatingModel: 'Người dùng cơ bản tập trung vào hồ sơ, bảo mật và phạm vi quyền truy cập cá nhân.',
    health: [
      { label: 'Tài khoản', value: 'Hoạt động', hint: 'Có thể đăng nhập và cập nhật hồ sơ' },
      { label: 'Bảo mật', value: 'Theo dõi', hint: 'Kiểm tra hạn đổi mật khẩu định kỳ' },
      { label: 'Truy cập', value: 'Giới hạn', hint: 'Module nghiệp vụ chỉ mở khi được cấp role' },
    ],
    workQueue: [
      {
        title: 'Kiểm tra thông tin hồ sơ',
        description: 'Xác nhận email, họ tên và trạng thái tài khoản đang đúng.',
        meta: 'Hồ sơ tài khoản',
        priority: 'normal',
      },
      {
        title: 'Đổi mật khẩu định kỳ',
        description: 'Chủ động đổi mật khẩu khi gần hết hạn hoặc sau khi được cấp tài khoản mới.',
        meta: 'Bảo mật cá nhân',
        priority: 'medium',
      },
      {
        title: 'Xem quyền truy cập',
        description: 'Đối chiếu role trong token với các mục đang hiển thị trên menu.',
        meta: 'Quyền của tôi',
        priority: 'normal',
      },
    ],
    accessNotes: ['Chỉ thấy hồ sơ, bảo mật và quyền truy cập', 'Không mở module nghiệp vụ khi chưa có role phù hợp', 'Route vẫn được bảo vệ bởi ProtectedRoute'],
  },
  employee: {
    summaryTitle: 'Tổng quan công việc cá nhân',
    operatingModel: 'Nhân viên theo dõi chấm công, nghỉ phép và task cá nhân được giao.',
    health: [
      { label: 'Chấm công', value: '18/22', hint: 'Ngày công trong tháng hiện tại' },
      { label: 'Nghỉ phép', value: '1 đơn', hint: 'Đang chờ quản lý duyệt' },
      { label: 'Task cá nhân', value: '5', hint: '2 task đến hạn trong tuần' },
    ],
    workQueue: [
      {
        title: 'Bổ sung ghi chú chấm công',
        description: 'Có 2 ngày cần giải trình lý do vào trễ hoặc thiếu log.',
        meta: 'Chấm công',
        priority: 'medium',
      },
      {
        title: 'Theo dõi đơn nghỉ phép',
        description: 'Đơn nghỉ ngày 12/06 đang chờ quản lý trực tiếp duyệt.',
        meta: 'Nghỉ phép',
        priority: 'normal',
      },
      {
        title: 'Hoàn tất task cá nhân',
        description: 'Task kiểm thử phân quyền cần cập nhật tiến độ trước cuối ngày.',
        meta: 'Task cá nhân',
        priority: 'high',
      },
    ],
    accessNotes: ['Có workspace chấm công, nghỉ phép, task cá nhân', 'Không có quyền role hoặc audit hệ thống', 'Chỉ xem dữ liệu trong phạm vi cá nhân'],
  },
  manager: {
    summaryTitle: 'Tổng quan quản lý nhóm',
    operatingModel: 'Quản lý xử lý phê duyệt hằng ngày và giữ nhịp task của nhóm.',
    health: [
      { label: 'Timesheet chờ duyệt', value: '12', hint: 'Có 3 ngoại lệ cần kiểm tra' },
      { label: 'Task nhóm', value: '18', hint: '2 task quá hạn' },
      { label: 'Nhân sự trực tiếp', value: '9', hint: 'Theo dõi trong phạm vi nhóm' },
    ],
    workQueue: [
      {
        title: 'Duyệt timesheet ngoại lệ',
        description: 'Thiếu check-out và OT cần xác nhận trước khi khóa kỳ công.',
        meta: 'Duyệt timesheet',
        priority: 'high',
      },
      {
        title: 'Điều phối task quá hạn',
        description: '2 task nhóm cần đổi ưu tiên hoặc bổ sung người hỗ trợ.',
        meta: 'Task nhóm',
        priority: 'medium',
      },
      {
        title: 'Xem nhân viên trong nhóm',
        description: 'Kiểm tra trạng thái làm việc và phân bổ hiện tại.',
        meta: 'Nhân sự nhóm',
        priority: 'normal',
      },
    ],
    accessNotes: ['Có duyệt timesheet và task nhóm', 'Không có quyền role/audit hệ thống', 'Dữ liệu nhân sự giới hạn theo nhóm'],
  },
  departmentHead: {
    summaryTitle: 'Tổng quan điều hành phòng ban',
    operatingModel: 'Trưởng phòng theo dõi sức khỏe phòng ban, phê duyệt cấp phòng và rủi ro tải công việc.',
    health: [
      { label: 'Phê duyệt cấp phòng', value: '7', hint: '3 mục gần quá SLA' },
      { label: 'Headcount', value: '46', hint: 'Nhân sự đang hoạt động' },
      { label: 'KPI phòng ban', value: '88%', hint: 'Mức hoàn thành tháng' },
    ],
    workQueue: [
      {
        title: 'Phê duyệt điều chuyển nhân sự',
        description: 'Yêu cầu điều chuyển sang nhóm Payroll cần quyết định cấp phòng.',
        meta: 'Phê duyệt phòng ban',
        priority: 'high',
      },
      {
        title: 'Rà soát rủi ro tải công việc',
        description: 'Nhóm Backend vượt 90% utilization trong 2 tuần liên tiếp.',
        meta: 'Báo cáo phòng ban',
        priority: 'medium',
      },
      {
        title: 'Theo dõi task nhóm trọng điểm',
        description: 'Các task release cần cập nhật tiến độ trước cuộc họp tuần.',
        meta: 'Task nhóm',
        priority: 'normal',
      },
    ],
    accessNotes: ['Có báo cáo và phê duyệt cấp phòng', 'Có thể xem nhân sự trong phạm vi phòng ban', 'Không trực tiếp cấu hình role hệ thống'],
  },
  payroll: {
    summaryTitle: 'Tong quan payroll',
    operatingModel: 'Payroll Officer theo doi ky luong, tinh luong, phe duyet va trang thai chi tra.',
    health: [
      { label: 'Ky luong hien tai', value: '06/2026', hint: 'Dang o trang thai doi soat demo' },
      { label: 'Bảng lương draft', value: '4', hint: 'Cần tính và phê duyệt' },
      { label: 'Da xu ly', value: '12', hint: 'Dung cho lich su chi tra va audit' },
    ],
    workQueue: [
      {
        title: 'Tinh luong nhan vien',
        description: 'Chon nhan vien va thang luong de tao ban ghi payroll draft.',
        meta: 'Bảng lương',
        priority: 'high',
      },
      {
        title: 'Phe duyet bang luong',
        description: 'Kiem tra gross pay, khau tru va net pay truoc khi chuyen sang APPROVED.',
        meta: 'Workflow payroll',
        priority: 'medium',
      },
      {
        title: 'Xu ly chi tra',
        description: 'Khoa bang luong PROCESSED de phuc vu bao cao ban giao.',
        meta: 'Audit payroll',
        priority: 'normal',
      },
    ],
    accessNotes: ['Co quyen xem ho so nhan vien de doi soat payroll', 'Co PAYROLL_MANAGE de tao ky, tinh luong va phe duyet', 'Khong co quyen quan ly user, role, project hoac task'],
  },
  hr: {
    summaryTitle: 'Tổng quan nghiệp vụ nhân sự',
    operatingModel: 'HR giữ dữ liệu nhân sự, phúc lợi và thay đổi phòng ban sẵn sàng cho vận hành.',
    health: [
      { label: 'Hồ sơ nhân sự', value: '94%', hint: 'Đã có dữ liệu bắt buộc' },
      { label: 'Phúc lợi cần rà soát', value: '11', hint: 'Thiếu BHXH hoặc phụ cấp' },
      { label: 'Cập nhật mới', value: '6', hint: 'Trong tuần hiện tại' },
    ],
    workQueue: [
      {
        title: 'Bổ sung hồ sơ phúc lợi',
        description: '11 hồ sơ cần hoàn tất trước kỳ payroll.',
        meta: 'Phúc lợi',
        priority: 'high',
      },
      {
        title: 'Cập nhật hồ sơ nhân sự',
        description: 'Các thay đổi chức danh và phòng ban cần đồng bộ lên HRIS.',
        meta: 'Hồ sơ nhân sự',
        priority: 'medium',
      },
      {
        title: 'Rà soát phòng ban',
        description: 'Kiểm tra trưởng phòng và trạng thái hoạt động của các đơn vị.',
        meta: 'Phòng ban',
        priority: 'normal',
      },
    ],
    accessNotes: ['Có hồ sơ nhân sự và phúc lợi', 'Có thể quản lý phòng ban/tổ chức', 'Không mặc định có quyền xóa role hệ thống'],
  },
  admin: {
    summaryTitle: 'Tổng quan quản trị',
    operatingModel: 'Admin kiểm soát tài khoản, role, quyền truy cập và các điểm cần audit.',
    health: [
      { label: 'Tài khoản nhạy cảm', value: '4', hint: 'Có quyền quản trị cao' },
      { label: 'Role đang dùng', value: '6', hint: 'ADMIN, HR, HEAD, MANAGER, EMPLOYEE, USER' },
      { label: 'Audit cần xem', value: '9', hint: 'Thay đổi quyền trong tuần' },
    ],
    workQueue: [
      {
        title: 'Rà soát tài khoản quyền cao',
        description: 'Kiểm tra tài khoản admin và HR có đúng người phụ trách.',
        meta: 'Tài khoản',
        priority: 'high',
        actionLabel: 'Kiểm tra ngay',
        actionTone: 'blue',
      },
      {
        title: 'Đối chiếu ma trận role',
        description: 'Xác nhận quyền USER không mở module nghiệp vụ.',
        meta: 'Role',
        priority: 'medium',
        actionLabel: 'Xử lý',
        actionTone: 'amber',
      },
      {
        title: 'Theo dõi audit thay đổi quyền',
        description: 'Các thay đổi phân quyền cần có dấu vết kiểm toán rõ.',
        meta: 'Audit',
        priority: 'normal',
        actionLabel: 'Xem chi tiết',
        actionTone: 'slate',
      },
    ],
    accessNotes: ['Có toàn bộ quản trị tài khoản và role', 'Có quyền xem cấu trúc tổ chức', 'Audit là vùng UI chuẩn bị nối backend'],
  },
};

interface LiveStats {
  employees: number;
  activeProjects: number;
  openTasks: number;
  loading: boolean;
}

const adminDashboardBaselineStats = {
  employees: 142,
  activeProjects: 12,
  openTasks: 38,
};

const useLiveDashboardStats = (canViewEmployees: boolean, canViewProjects: boolean, canViewTasks: boolean): LiveStats => {
  const [stats, setStats] = useState<LiveStats>({ employees: 0, activeProjects: 0, openTasks: 0, loading: true });

  useEffect(() => {
    const fetches = [
      canViewEmployees
        ? employeeApi.getAll({ page: 0, size: 1 }).then((r) => r.data.totalElements).catch(() => 0)
        : Promise.resolve(0),
      canViewProjects
        ? projectApi.getAll().then((p) => p.filter((x) => x.status === 'ACTIVE').length).catch(() => 0)
        : Promise.resolve(0),
      canViewTasks
        ? taskApi.getAll().then((t) => t.filter((x) => x.status === 'OPEN' || x.status === 'IN_PROGRESS').length).catch(() => 0)
        : Promise.resolve(0),
    ] as Promise<number>[];

    void Promise.all(fetches).then(([employees, activeProjects, openTasks]) => {
      setStats({ employees, activeProjects, openTasks, loading: false });
    });
  }, [canViewEmployees, canViewProjects, canViewTasks]);

  return stats;
};

const LiveStatsBar = ({ stats, canViewEmployees, canViewProjects, canViewTasks }: {
  stats: LiveStats;
  canViewEmployees: boolean;
  canViewProjects: boolean;
  canViewTasks: boolean;
}) => {
  const items: Array<{ label: string; value: string; icon: LucideIcon; gradient: string; bg: string; text: string }> = [];
  const employees = stats.employees || adminDashboardBaselineStats.employees;
  const activeProjects = stats.activeProjects || adminDashboardBaselineStats.activeProjects;
  const openTasks = stats.openTasks || adminDashboardBaselineStats.openTasks;

  if (canViewEmployees) items.push({ label: 'Nhân viên',       value: stats.loading ? '—' : employees.toString(),      icon: Users,        gradient: 'from-cyan-600 to-teal-500',    bg: 'bg-cyan-50',   text: 'text-cyan-700'   });
  if (canViewProjects)  items.push({ label: 'Dự án đang chạy', value: stats.loading ? '—' : activeProjects.toString(), icon: FolderKanban, gradient: 'from-violet-600 to-purple-500', bg: 'bg-violet-50', text: 'text-violet-700' });
  if (canViewTasks)     items.push({ label: 'Task cần xử lý',  value: stats.loading ? '—' : openTasks.toString(),      icon: ListChecks,   gradient: 'from-amber-500 to-orange-400', bg: 'bg-amber-50',  text: 'text-amber-700'  });

  if (items.length === 0) return null;

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 animate-fade-up">
      {items.map((item) => (
        <Card key={item.label} className="relative overflow-hidden p-4">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">{item.label}</p>
              <p className="mt-0.5 text-3xl font-bold tracking-tight text-slate-900">{item.value}</p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.bg} ${item.text}`}>
              <item.icon size={20} />
            </div>
          </div>
        </Card>
      ))}
    </section>
  );
};

const workActionStyles: Record<WorkActionTone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-blue-700 hover:border-blue-300 hover:bg-blue-100 focus:ring-blue-500',
  amber: 'border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100 focus:ring-amber-500',
  slate: 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-slate-100 focus:ring-slate-500',
};

const WorkQueueList = ({ items, onAction }: { items: RoleWorkItem[]; onAction: (item: RoleWorkItem) => void }) => (
  <div className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
    {items.map((item) => {
      const priority = priorityStyles[item.priority];
      const actionTone = item.actionTone ?? 'slate';

      return (
        <div key={item.title} className="grid gap-3 p-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-semibold text-slate-900">{item.title}</h4>
              <Badge variant={priority.variant}>{priority.label}</Badge>
            </div>
            <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
              <Clock3 size={14} />
              {item.meta}
            </div>
          </div>

          {item.actionLabel && (
            <button
              type="button"
              aria-label={item.actionLabel}
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border px-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 min-[420px]:w-full sm:w-auto',
                workActionStyles[actionTone]
              )}
              onClick={() => onAction(item)}
            >
              <ArrowRight size={16} className="shrink-0 min-[420px]:hidden" />
              <span className="hidden min-[420px]:inline">{item.actionLabel}</span>
            </button>
          )}
        </div>
      );
    })}
  </div>
);

const ActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  disabled,
  toneIndex,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
  toneIndex: number;
}) => {
  const tone = getFeatureTone(toneIndex);
  const content = (
    <div
      className={cn(
        featureCardShell,
        tone.border,
        disabled && 'opacity-70 hover:translate-y-0 hover:scale-100 hover:shadow-none'
      )}
    >
        <div className={cn(featureCardInner, 'p-4')}>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={cn(
                'flex h-11 w-11 items-center justify-center rounded-xl ring-1 transition duration-150 group-hover:scale-105',
              tone.icon
            )}
          >
            <Icon size={22} strokeWidth={2.4} />
          </div>
          <Badge variant={disabled ? 'muted' : 'success'}>{disabled ? 'Đang khóa' : 'Sẵn sàng'}</Badge>
        </div>
        <h4 className="font-bold text-slate-950">{title}</h4>
        <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
        <div className={cn('mt-4 inline-flex items-center gap-2 text-sm font-bold', disabled ? 'text-slate-500' : tone.text)}>
          {disabled ? 'Chưa có quyền' : 'Mở chức năng'}
          {!disabled && <ArrowRight size={16} />}
        </div>
      </div>
    </div>
  );

  if (!href || disabled) {
    return <div>{content}</div>;
  }

  return (
    <Link to={href} className="block rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-600/30">
      {content}
    </Link>
  );
};

const PendingApprovalPanel = ({
  user,
  onCopyEmail,
}: {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  onCopyEmail: (email: string) => void;
}) => {
  const userRecord = (user || {}) as Record<string, unknown>;
  const createdAt =
    typeof userRecord.createdAt === 'string'
      ? userRecord.createdAt
      : typeof userRecord.registeredAt === 'string'
        ? userRecord.registeredAt
        : new Date().toISOString();
  const groupName =
    typeof userRecord.departmentName === 'string'
      ? userRecord.departmentName
      : typeof userRecord.requestedGroup === 'string'
        ? userRecord.requestedGroup
        : 'Nhóm: Phát triển phần mềm';
  const approverName =
    typeof userRecord.approverName === 'string' ? userRecord.approverName : 'Quản trị viên hệ thống';
  const approverEmail =
    typeof userRecord.approverEmail === 'string' ? userRecord.approverEmail : 'admin@company.com';

  const pendingCards = [
    {
      title: 'Trạng thái tài khoản',
      body: 'Hồ sơ của bạn đã được ghi nhận và đang chờ kiểm tra quyền truy cập.',
      className: 'border-dashed border-orange-200 bg-[#FFF7ED] text-[#C2410C]',
      iconClass: 'bg-orange-100 text-[#C2410C] ring-orange-200',
      icon: Hourglass,
      content: (
        <>
          <div className="mt-4 inline-flex rounded-full bg-orange-100 px-3 py-1 text-sm font-bold text-[#C2410C] ring-1 ring-orange-200">
            Đang chờ phê duyệt
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <div>
              <dt className="font-semibold text-orange-900">Ngày tạo tài khoản</dt>
              <dd className="mt-1 text-orange-800">{formatDate(createdAt, 'dd/MM/yyyy')}</dd>
            </div>
            <div>
              <dt className="font-semibold text-orange-900">Dự kiến xử lý</dt>
              <dd className="mt-1 text-orange-800">Trong 1-2 ngày làm việc</dd>
            </div>
          </dl>
        </>
      ),
    },
    {
      title: 'Nhóm đăng ký tham gia',
      body: 'Nhóm/phòng ban được dùng để xác định leader hoặc admin chịu trách nhiệm duyệt.',
      className: 'border-blue-100 bg-blue-50 text-blue-900',
      iconClass: 'bg-blue-100 text-blue-700 ring-blue-200',
      icon: FolderTree,
      content: (
        <div className="mt-5 rounded-xl border border-blue-100 bg-white/75 p-4">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-blue-500" />
            <p className="font-bold text-blue-950">{groupName}</p>
          </div>
          <div className="ml-1 mt-3 border-l border-blue-200 pl-5 text-sm leading-6 text-blue-700">
            Công ty / Khối kỹ thuật / {groupName.replace(/^Nhóm:\s*/i, '')}
          </div>
        </div>
      ),
    },
    {
      title: 'Người phê duyệt',
      body: 'Liên hệ người phụ trách nếu thông tin nhóm hoặc email đăng ký chưa chính xác.',
      className: 'border-slate-200 bg-white text-slate-900',
      iconClass: 'bg-slate-100 text-slate-700 ring-slate-200',
      icon: Mail,
      content: (
        <div className="mt-5 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="min-w-0">
            <p className="truncate font-bold text-slate-950">{approverName}</p>
            <p className="mt-1 truncate text-sm text-slate-500">{approverEmail}</p>
          </div>
          <button
            type="button"
            onClick={() => onCopyEmail(approverEmail)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100"
            aria-label="Copy email người phê duyệt"
          >
            <Copy size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {pendingCards.map((card) => (
        <div key={card.title} className={cn('rounded-2xl border p-5 shadow-sm', card.className)}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{card.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{card.body}</p>
            </div>
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-1', card.iconClass)}>
              <card.icon size={24} className={card.icon === Hourglass ? 'animate-pulse' : undefined} />
            </div>
          </div>
          {card.content}
        </div>
      ))}
    </section>
  );
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const { can } = usePermissions();
  const [passwordWarning, setPasswordWarning] = useState<string | null>(null);

  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];
  const experience = dashboardExperience[workspaceRole];
  const isPendingUser = workspaceRole === 'user';

  const canViewEmployees = can(PERMISSIONS.EMPLOYEE_VIEW);
  const canViewProjects  = can(PERMISSIONS.PROJECT_VIEW);
  const canViewTasks     = can(PERMISSIONS.TASK_VIEW);
  const liveStats = useLiveDashboardStats(canViewEmployees, canViewProjects, canViewTasks);

  const visibleActions = useMemo(
    () => roleProfile.actions.filter((action) => !action.permission || can(action.permission)),
    [can, roleProfile.actions]
  );

  useEffect(() => {
    if (user?.passwordExpiresAt) {
      setPasswordWarning(getPasswordExpiryWarning(user.passwordExpiresAt));
      return;
    }

    setPasswordWarning(null);
  }, [user]);

  const handleCopyApproverEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      addNotification({ type: 'success', message: 'Đã copy email người phê duyệt.' });
    } catch {
      addNotification({ type: 'error', message: 'Không thể copy email. Vui lòng thử lại.' });
    }
  };

  const handleWorkQueueAction = (item: RoleWorkItem) => {
    addNotification({ type: 'info', message: `${item.actionLabel ?? 'Mở tác vụ'}: ${item.title}` });
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {!isPendingUser && (
          <section className={`relative overflow-hidden rounded-xl bg-gradient-to-r ${roleProfile.toneClass} text-white shadow-[0_18px_38px_rgba(15,23,42,0.16)]`}>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.18),transparent_28rem)]" />
          <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-cyan-50 ring-1 ring-white/20">
                <Sparkles size={16} />
                {roleProfile.badge}
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-balance sm:text-3xl">{roleProfile.headline}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">
                Chào mừng trở lại, {user?.fullName || user?.username || 'bạn'}. {roleProfile.description}
              </p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/10 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-sm font-semibold text-cyan-50">{experience.summaryTitle}</p>
              <p className="mt-2 text-sm leading-6 text-white/80">{experience.operatingModel}</p>
              <div className="mt-4 space-y-2">
                {roleProfile.focusAreas.map((area) => (
                  <div key={area} className="flex items-center gap-2 text-sm text-white/90">
                    <CheckCircle2 size={16} className="shrink-0 text-cyan-200" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
        )}

        {passwordWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <p className="text-sm text-amber-800">{passwordWarning}</p>
            </div>
          </div>
        )}

        {isPendingUser && <PendingApprovalPanel user={user} onCopyEmail={handleCopyApproverEmail} />}

        {!isPendingUser && (canViewEmployees || canViewProjects || canViewTasks) && (
          <LiveStatsBar
            stats={liveStats}
            canViewEmployees={canViewEmployees}
            canViewProjects={canViewProjects}
            canViewTasks={canViewTasks}
          />
        )}

        {!isPendingUser && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {roleProfile.statCards.map((card, index) => {
            const tone = getFeatureTone(index);
            const isHero = index === 0;

            return (
              <div
                key={card.label}
                className={cn(
                  featureCardShell,
                  tone.border,
                  isHero && 'md:col-span-2 xl:col-span-1'
                )}
              >
                <div className={featureCardInner}>
                  {isHero && (
                    <span
                      className={cn(
                        'absolute right-4 top-4 rounded-lg border px-2.5 py-1 text-xs font-bold ring-1',
                        tone.badge
                      )}
                    >
                      Nổi bật
                    </span>
                  )}
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 pr-16">
                      <p className={cn('text-sm font-bold', tone.text)}>{card.label}</p>
                      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-950">{card.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{card.hint}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-150 group-hover:scale-105',
                        tone.icon
                      )}
                    >
                      <card.icon size={24} strokeWidth={2.4} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        )}

        {!isPendingUser && (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {experience.health.map((metric, index) => {
            const tone = getFeatureTone(index + 3);

            return (
              <div key={metric.label} className={cn(featureCardShell, tone.border)}>
                <div className={featureCardInner}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className={cn('text-sm font-bold', tone.text)}>{metric.label}</p>
                      <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950">{metric.value}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{metric.hint}</p>
                    </div>
                    <div
                      className={cn(
                        'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition duration-150 group-hover:scale-105',
                        tone.icon
                      )}
                    >
                      <CheckCircle2 size={21} strokeWidth={2.4} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
        )}

        {!isPendingUser && (
        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Chức năng theo vai trò</CardTitle>
              <CardDescription>Chỉ hiển thị những thao tác phù hợp với role và quyền hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleActions.map((action, index) => (
                  <ActionCard
                    key={action.title}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    href={action.href}
                    disabled={action.status === 'soon'}
                    toneIndex={index}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Việc cần chú ý</CardTitle>
                <CardDescription>Queue mẫu theo đúng vai trò đăng nhập.</CardDescription>
              </CardHeader>
              <CardContent>
                <WorkQueueList items={experience.workQueue} onAction={handleWorkQueueAction} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Phạm vi truy cập</CardTitle>
                <CardDescription>Vai trò hiện tại: {roleProfile.label}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {experience.accessNotes.map((note) => (
                    <div key={note} className="flex gap-2 text-sm text-slate-600">
                      <ShieldCheck size={17} className="mt-0.5 shrink-0 text-cyan-700" />
                      <span>{note}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {(user?.roles || []).map((role) => (
                    <Badge key={role} variant="info">
                      {role}
                    </Badge>
                  ))}
                  {(!user?.roles || user.roles.length === 0) && <Badge variant="muted">Chưa có role từ token</Badge>}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        )}
      </div>
    </MainLayout>
  );
};
