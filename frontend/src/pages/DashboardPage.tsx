import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  LucideIcon,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Badge } from '@/components/UI/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import { resolveWorkspaceRole, roleProfiles, WorkspaceRole } from '@/config/roleExperience';
import { getPasswordExpiryWarning } from '@/utils/format';

type Priority = 'high' | 'medium' | 'normal';

interface RoleWorkItem {
  title: string;
  description: string;
  meta: string;
  priority: Priority;
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

const dashboardExperience: Record<WorkspaceRole, RoleDashboardExperience> = {
  user: {
    summaryTitle: 'Tổng quan tài khoản',
    operatingModel: 'Tài khoản người dùng chỉ nhìn thấy hồ sơ, bảo mật và phạm vi quyền được cấp.',
    health: [
      { label: 'Tài khoản', value: 'Hoạt động', hint: 'Có thể đăng nhập và cập nhật hồ sơ' },
      { label: 'Bảo mật', value: 'Cần theo dõi', hint: 'Kiểm tra hạn đổi mật khẩu định kỳ' },
      { label: 'Truy cập', value: 'Giới hạn', hint: 'Không mở module nghiệp vụ khi chưa được cấp role' },
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
        description: 'Đối chiếu các role trong token với những mục đang hiển thị trên menu.',
        meta: 'Quyền của tôi',
        priority: 'normal',
      },
    ],
    accessNotes: ['Không có quyền nghiệp vụ mặc định', 'Menu chỉ hiện hồ sơ, bảo mật và quyền truy cập', 'Route vẫn được bảo vệ bởi ProtectedRoute'],
  },
  employee: {
    summaryTitle: 'Từng quan công việc cá nhân',
    operatingModel: 'Nhân viên tập trung hoàn tất chấm công, nghỉ phép và task cá nhân.',
    health: [
      { label: 'Chấm công', value: '18/22', hint: 'Ngày công trong tháng hiện tại' },
      { label: 'Nghỉ phép', value: '1 đơn', hint: 'Đang chờ quản lý duyệt' },
      { label: 'Task cá nhân', value: '5', hint: '2 task đến h?n trong tuần' },
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
    accessNotes: ['Có workspace chấm công, nghỉ phép, task cá nhân', 'Không thểy trang qu?n trợ tài khoản', 'Chỉ xem dữ liệu trong phạm vi cá nhân'],
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
      { label: 'Phê duyệt cấp phòng', value: '7', hint: '3 mục g?n quá SLA' },
      { label: 'Headcount', value: '46', hint: 'Nhân sự đang hoạt động' },
      { label: 'KPI phòng ban', value: '88%', hint: 'Mục hoàn thành tháng' },
    ],
    workQueue: [
      {
        title: 'Phê duyệt Điều chuyển nhân sự',
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
        description: 'Các task release cần cập nhật ti?n để trước cuộc họp tuần.',
        meta: 'Task nhóm',
        priority: 'normal',
      },
    ],
    accessNotes: ['Có báo cáo và phê duyệt cấp phòng', 'Có thể xem nhân sự trong phạm vi phòng ban', 'Không trực tiếp cấu hình role hệ thống'],
  },
  hr: {
    summaryTitle: 'Tổng quan nghiệp vụ nhân sự',
    operatingModel: 'HR giữ dữ liệu nhân sự, phúc lợi và thay đổi phòng ban sẵn sàng cho vận hành.',
    health: [
      { label: 'Hồ sơ nhân sự', value: '94%', hint: 'đã dữ liệu bắt buộc' },
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
        description: 'Các thay Đổi chỉc danh và phòng ban cần đếng b? làn HRIS.',
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
        description: 'Kiểm tra tài khoản admin và HR có cần đúng người phụ trách.',
        meta: 'Tài khoản',
        priority: 'high',
      },
      {
        title: 'Đối chiếu ma trận role',
        description: 'Xác nhận quyền USER không m? module nghi?p v?.',
        meta: 'Role',
        priority: 'medium',
      },
      {
        title: 'Theo dõi audit thay đổi quyền',
        description: 'Các thay Đổi phân quyền cần có dấu vết kiểm toán rõ.',
        meta: 'Audit',
        priority: 'normal',
      },
    ],
    accessNotes: ['Có toàn bộ quản trị tài khoản và role', 'Có quyền xem cấu trúc tổ chức', 'Audit là vùng UI chuẩn bị nối backend'],
  },
};

const ActionCard = ({
  title,
  description,
  icon: Icon,
  href,
  disabled,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  disabled?: boolean;
}) => {
  const content = (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-4 transition hover:border-cyan-300 hover:bg-cyan-50/40">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-700">
          <Icon size={20} />
        </div>
        <Badge variant={disabled ? 'muted' : 'success'}>{disabled ? 'Đang khóa' : 'Sẵn sàng'}</Badge>
      </div>
      <h4 className="font-semibold text-slate-900">{title}</h4>
      <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
        {disabled ? 'Chưa có quyền' : 'Mở chức năng'}
        {!disabled && <ArrowRight size={16} />}
      </div>
    </div>
  );

  if (!href || disabled) {
    return <div>{content}</div>;
  }

  return (
    <Link to={href} className="block">
      {content}
    </Link>
  );
};

export const DashboardPage = () => {
  const { user } = useAuthStore();
  const { can } = usePermissions();
  const [passwordWarning, setPasswordWarning] = useState<string | null>(null);

  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];
  const experience = dashboardExperience[workspaceRole];

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className={`overflow-hidden rounded-lg bg-gradient-to-r ${roleProfile.toneClass} text-white shadow-sm`}>
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_340px] lg:p-8">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-cyan-50 ring-1 ring-white/20">
                <Sparkles size={16} />
                {roleProfile.badge}
              </div>
              <h2 className="text-2xl font-semibold sm:text-3xl">{roleProfile.headline}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/85 sm:text-base">
                Chào mừng trở lại, {user?.fullName || user?.username || 'bạn'}. {roleProfile.description}
              </p>
            </div>

            <div className="rounded-lg border border-white/15 bg-white/10 p-4">
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

        {passwordWarning && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={20} />
              <p className="text-sm text-amber-800">{passwordWarning}</p>
            </div>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {roleProfile.statCards.map((card) => (
            <Card key={card.label} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{card.hint}</p>
                </div>
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                  <card.icon size={22} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {experience.health.map((metric) => (
            <Card key={metric.label} className="p-5">
              <p className="text-sm font-medium text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{metric.value}</p>
              <p className="mt-2 text-sm text-slate-500">{metric.hint}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader>
              <CardTitle>Chức năng theo vai trợ</CardTitle>
              <CardDescription>Chỉ hiển thị những thao tác phù hợp với role và quyền hiện tại.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {visibleActions.map((action) => (
                  <ActionCard
                    key={action.title}
                    title={action.title}
                    description={action.description}
                    icon={action.icon}
                    href={action.href}
                    disabled={action.status === 'soon'}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Việc cần chú ý</CardTitle>
                <CardDescription>Queue mẫu theo đúng vai trợ đăng nhập.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {experience.workQueue.map((item) => {
                  const priority = priorityStyles[item.priority];

                  return (
                    <div key={item.title} className="rounded-lg border border-slate-200 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
                        </div>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                      </div>
                      <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                        <Clock3 size={14} />
                        {item.meta}
                      </div>
                    </div>
                  );
                })}
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
      </div>
    </MainLayout>
  );
};
