import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  CalendarCheck,
  ClipboardCheck,
  Clock3,
  FileText,
  Plus,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { WorkspaceActionPanel } from '@/components/Workspace/WorkspaceActionPanel';
import { WorkspaceMetricCards } from '@/components/Workspace/WorkspaceMetricCards';
import { WorkspaceStatusFilters, WorkspaceFilter } from '@/components/Workspace/WorkspaceStatusFilters';
import { WorkspaceStatusList } from '@/components/Workspace/WorkspaceStatusList';
import { WorkspaceDefinition, WorkspaceItem } from '@/components/Workspace/types';
import { useAuthStore } from '@/store/authStore';
import { resolveWorkspaceRole } from '@/config/roleExperience';

const workspaceDefinitions: Record<string, WorkspaceDefinition> = {
  'account-security': {
    title: 'Tài khoản và bảo mật',
    subtitle: 'Theo dõi hồ sơ tài khoản, h?n mật khẩu và phạm vi quyền truy cập cá nhân.',
    icon: ShieldCheck,
    allowedRoles: ['user', 'employee', 'manager', 'departmentHead', 'hr', 'admin'],
    primaryAction: 'Đổi mật khẩu',
    secondaryAction: 'Xem hồ sơ',
    metrics: [
      { label: 'Trạng thái', value: 'Hoạt động', hint: 'Tài khoản có thể đăng nhập' },
      { label: 'Bảo mật', value: 'Theo dõi', hint: 'Kiểm tra hạn đổi mật khẩu' },
      { label: 'Quyền', value: 'Theo role', hint: 'Menu được lọc theo quyền hiện tại' },
    ],
    items: [
      {
        title: 'Thông tin tài khoản',
        description: 'Xác nhận họ tên, email và username đang đúng.',
        owner: 'Tôi',
        meta: 'Hồ sơ',
        status: 'approved',
        priority: 'normal',
        due: 'Luôn bật',
        nextStep: 'Mở hồ sơ để kiểm tra thông tin liên hệ.',
      },
      {
        title: 'Mật khẩu đăng nhập',
        description: 'Đổi mật khẩu định kỳ để giờm rủi ro truy cập trái phép.',
        owner: 'Tôi',
        meta: 'Bảo mật',
        status: 'pending',
        priority: 'medium',
        due: 'Theo chính sách',
        nextStep: 'Mở màn hình đổi mật khẩu và dùng mật khẩu mạnh.',
      },
      {
        title: 'Quyền truy cập hiện tại',
        description: 'Đối chiếu role trong token với các mục đang hiển thị ? sidebar.',
        owner: 'Hệ thống',
        meta: 'RBAC',
        status: 'inProgress',
        priority: 'normal',
        due: 'Khi role thay đổi',
        nextStep: 'Liên hệ admin nếu thiếu quyền cần thiết cho công việc.',
      },
    ],
    processNotes: ['USER không có quyền nghiệp vụ mặc định.', 'Sidebar và dashboard đều lọc theo role.', 'Backend route vẫn cần kiểm tra RBAC khi nối API.'],
  },
  timekeeping: {
    title: 'Chấm công',
    subtitle: 'Theo dõi giờ vào, giờ ra, ngày công và ghi chú cá nhân.',
    icon: Clock3,
    allowedRoles: ['employee', 'manager', 'departmentHead', 'hr', 'admin'],
    primaryAction: 'Ghi nhận hôm nay',
    secondaryAction: 'Xuất bảng công',
    metrics: [
      { label: 'Ngày công', value: '18/22', hint: 'Trong tháng hiện tại' },
      { label: 'Giờ làm', value: '144h', hint: 'Đã ghi nhận' },
      { label: 'Cần bổ sung', value: '2', hint: 'Ngày thiếu ghi chú' },
    ],
    items: [
      {
        title: 'Thứ hai, 01/06',
        description: '08:05 - 17:32, đã công, có tăng ca 30 phút.',
        owner: 'Tôi',
        meta: 'Phòng Kỹ thuật',
        status: 'approved',
        priority: 'normal',
        due: 'Đã khóa',
        nextStep: 'Không cần xử lý thêm.',
      },
      {
        title: 'Thứ ba, 02/06',
        description: '08:18 - 17:10, cần bổ sung lý do vào trễ.',
        owner: 'Tôi',
        meta: 'Ch? quản lý xác nhận',
        status: 'pending',
        priority: 'medium',
        due: 'Hôm nay',
        nextStep: 'Bổ sung ghi chú để quản lý duyệt.',
      },
      {
        title: 'Thứ tư, 03/06',
        description: 'Remote buổi sáng, onsite buổi chiều.',
        owner: 'Tôi',
        meta: 'Đã gửi ghi chú',
        status: 'inProgress',
        priority: 'normal',
        due: 'Tuần này',
        nextStep: 'Theo dõi trạng thái xác nhận.',
      },
    ],
    processNotes: ['Chấm công cá nhân dùng cho nhân viên.', 'Quản lý/trưởng phòng có thể xem để hỗ trợ phê duyệt.', 'Các ngoại lệ cần ghi chú trước khi khóa kỳ công.'],
  },
  leave: {
    title: 'Nghỉ phép',
    subtitle: 'Tạo yêu cầu nghỉ phép và theo dõi trạng thái phê duyệt.',
    icon: CalendarCheck,
    allowedRoles: ['employee', 'manager', 'departmentHead', 'hr', 'admin'],
    primaryAction: 'Tạo đơn nghỉ',
    secondaryAction: 'Xem lịch nghỉ',
    metrics: [
      { label: 'Phép còn lại', value: '9 ngày', hint: 'Năm hiện tại' },
      { label: 'Đang chờ', value: '1 đơn', hint: 'Chờ quản lý duyệt' },
      { label: 'Đã duyệt', value: '4 đơn', hint: 'Từ đầu năm' },
    ],
    items: [
      {
        title: 'Nghỉ phép năm',
        description: 'Nghỉ ngày 12/06 để giải quyết việc cá nhân.',
        owner: 'Tôi',
        meta: 'Gửi hôm nay',
        status: 'pending',
        priority: 'medium',
        due: 'Trước 12/06',
        nextStep: 'Chờ quản lý trực tiếp duyệt.',
      },
      {
        title: 'Nghỉ ốm',
        description: 'Nghỉ 0.5 ngày, đã đính kèm xác nhận y tế.',
        owner: 'Tôi',
        meta: 'Đã duyệt',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Lưu hồ sơ nghỉ phép.',
      },
      {
        title: 'Nghỉ bù',
        description: 'Dùng 1 ngày nghỉ bù từ đợt hỗ trợ triển khai.',
        owner: 'Tôi',
        meta: 'đã hoàn tất',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Không cần xử lý thêm.',
      },
    ],
    processNotes: ['Nhân viên tạo đơn nghỉ.', 'Quản lý duyệt bước đầu.', 'Trưởng phòng/HR theo dõi các trường hợp ?nh hưởng vận hành.'],
  },
  'personal-tasks': {
    title: 'Task cá nhân',
    subtitle: 'Theo dõi task được giao, deadline, mục ưu tiên và trạng thái thực hiện.',
    icon: Briefcase,
    allowedRoles: ['employee', 'manager', 'departmentHead', 'admin'],
    primaryAction: 'Cập nhật tiến độ',
    secondaryAction: 'Lọc task',
    metrics: [
      { label: 'Đang làm', value: '5', hint: 'Task của tôi' },
      { label: 'Đến hạn', value: '2', hint: 'Trong tuần hiện tại' },
      { label: 'Hoàn tất', value: '14', hint: 'Trong sprint' },
    ],
    items: [
      {
        title: 'Kiểm thử phân quyền',
        description: 'Xác nhận sidebar, dashboard và route hoạt động đúng theo role.',
        owner: 'Tôi',
        meta: 'Ưu tiên cao',
        status: 'blocked',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Bổ sung checklist test và cập nhật trạng thái.',
      },
      {
        title: 'Cập nhật hồ sơ cá nhân',
        description: 'Bổ sung số điện thoại và địa chỉ liên hệ hiện tại.',
        owner: 'Tôi',
        meta: 'HRIS',
        status: 'pending',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Mở hồ sơ và cập nhật thông tin thiếu.',
      },
      {
        title: 'Review tài liệu onboarding',
        description: 'Đọc lại quy trình nghỉ phép và chấm công mới.',
        owner: 'Tôi',
        meta: 'Nội bộ',
        status: 'inProgress',
        priority: 'normal',
        due: 'Thồ sơu',
        nextStep: 'Xác nhận để đểc sau khi hoàn tất.',
      },
    ],
    processNotes: ['Task cá nhân chỉ tập trung vào việc được giao cho người đăng nhập.', 'Các task blocked nên n?m đểu queue.', 'Dữ liệu hiện là mock UI chỉ nối API task-service.'],
  },
  'timesheet-approval': {
    title: 'Duyệt timesheet',
    subtitle: 'Xác nhận bạng công, ghi chú ngoại lệ và giờ làm của nhân viên trong nhóm.',
    icon: ClipboardCheck,
    allowedRoles: ['manager', 'departmentHead', 'hr', 'admin'],
    primaryAction: 'Duyệt mục đã chọn',
    secondaryAction: 'Lọc ngoại lệ',
    metrics: [
      { label: 'Chờ duyệt', value: '12', hint: 'Bảng công trong tuần' },
      { label: 'Ngoại lệ', value: '3', hint: 'Vào trễ hoặc thiếu log' },
      { label: 'đã xử lý', value: '28', hint: 'Trong kỳ hiện tại' },
    ],
    items: [
      {
        title: 'Nguyễn Minh Anh',
        description: 'Thiếu check-out ngày 03/06, có ghi chú từ nhân viên.',
        owner: 'Nhóm Backend',
        meta: 'Cần quản lý xác nhận',
        status: 'pending',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Kiểm tra ghi chú và duyệt/hoàn trả.',
      },
      {
        title: 'Trần Quốc Bảo',
        description: 'Têng ca 2 giờ cho đãt release module payroll.',
        owner: 'Nhóm Backend',
        meta: 'Chờ duyệt OT',
        status: 'inProgress',
        priority: 'medium',
        due: 'Ngày mai',
        nextStep: 'Đối chiếu kế hoạch release trước khi duyệt OT.',
      },
      {
        title: 'Lê Ngọc Hân',
        description: 'Bảng công tuần đã đủ log và khớp lịch làm việc.',
        owner: 'Nhóm QA',
        meta: 'Có thể duyệt nhanh',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Không cần xử lý thêm.',
      },
    ],
    processNotes: ['Manager duyệt timesheet nhóm trực tiếp.', 'Trưởng phòng có thể theo dõi các ngoại lệ cấp phòng.', 'HR/Admin dùng để giám sát dữ liệu trước kỳ công.'],
  },
  'team-tasks': {
    title: 'Task nhóm',
    subtitle: 'Tạo task, Đặt ưu tiên, theo dõi tải công việc và trạng thái thực hiện của nhóm.',
    icon: Briefcase,
    allowedRoles: ['manager', 'departmentHead', 'admin'],
    primaryAction: 'Tạo task',
    secondaryAction: 'Xem tải công việc',
    metrics: [
      { label: 'Đang làm', value: '18', hint: 'Task trong nhóm' },
      { label: 'Quá h?n', value: '2', hint: 'Cần can thiệp' },
      { label: 'Hoàn tất', value: '41', hint: 'Trong sprint' },
    ],
    items: [
      {
        title: 'Tích hợp API nhân viên',
        description: 'Hoàn thiện mapping dữ liệu hồ sơ nhân sự sang dashboard.',
        owner: 'Nguyễn Minh Anh',
        meta: 'Ưu tiên cao',
        status: 'inProgress',
        priority: 'high',
        due: 'Thứ năm',
        nextStep: 'Theo dõi tiến độ và unblock API nếu cần.',
      },
      {
        title: 'Kiểm thử phân quyền',
        description: 'Xác nhận các route HR, Manager, Department Head.',
        owner: 'Lê Ngọc Hân',
        meta: 'Đến hạn hôm nay',
        status: 'blocked',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Điều phối người hỗ trợ test RBAC.',
      },
      {
        title: 'Tối ưu bảng phòng ban',
        description: 'Bổ sung filter theo công ty thành viên và trạng thái hoạt động.',
        owner: 'Trần Quốc Bảo',
        meta: 'Đang review',
        status: 'pending',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Chờ review UI trước khi merge.',
      },
    ],
    processNotes: ['Manager dùng để Điều phối team hằng ngày.', 'Trưởng phòng xem các task trợng điểm và rủi ro.', 'Nên ưu tiên task blocked/quá hạn trước.'],
  },
  tasks: {
    title: 'Task nhóm',
    subtitle: 'Workspace cũ được giữ tương thích và dùng cùng dữ liệu task nhóm.',
    icon: Briefcase,
    allowedRoles: ['manager', 'departmentHead', 'admin'],
    primaryAction: 'Tạo task',
    secondaryAction: 'Xem tải công việc',
    metrics: [
      { label: 'Đang làm', value: '18', hint: 'Task trong nhóm' },
      { label: 'Quá h?n', value: '2', hint: 'Cần can thiệp' },
      { label: 'Hoàn tất', value: '41', hint: 'Trong sprint' },
    ],
    items: [],
    processNotes: ['Workspace này tương thích với đường dẫn cũ.', 'Nên dùng /workspace/team-tasks cho UI mới.', 'Dữ liệu sẽ được đồng bộ khi nối API.'],
  },
  'department-approvals': {
    title: 'Phê duyệt phòng ban',
    subtitle: 'Gom các yêu cầu nghỉ phép, Điều chuyển và phân bổ nhân sự cần trưởng phòng quyết định.',
    icon: FileText,
    allowedRoles: ['departmentHead', 'hr', 'admin'],
    primaryAction: 'Phê duyệt',
    secondaryAction: 'Chuyển HR',
    metrics: [
      { label: 'Chờ duyệt', value: '7', hint: 'Yêu cầu cấp phòng' },
      { label: 'Điều chuyển', value: '2', hint: 'Cần xác nhận nhân sự' },
      { label: 'SLA', value: '92%', hint: 'Duyệt đúng hạn' },
    ],
    items: [
      {
        title: 'Điều chuyển sang nhóm Payroll',
        description: 'để xu?t Điều chuyển 1 nhân viên từ HRIS sang Payroll trong 2 tháng.',
        owner: 'HR Operations',
        meta: 'Cần trưởng phòng duyệt',
        status: 'pending',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Xem tác đếng nhân sự và quyết định phê duyệt.',
      },
      {
        title: 'Nghỉ phép dài ngày',
        description: 'Nhân viên xin ngh? 5 ngày, quản lý trực tiếp đã đãng ?.',
        owner: 'Nhóm Mobile',
        meta: 'Ảnh hưởng lịch release',
        status: 'inProgress',
        priority: 'medium',
        due: 'Ngày mai',
        nextStep: 'Đối chiếu kế hoạch thay thế nhân sự.',
      },
      {
        title: 'Bổ sung nhân sự dự án',
        description: 'để ngh? thêm 2 nhân sự cho dự án tách hợp API nội bộ.',
        owner: 'Project Office',
        meta: 'Chờ xác nhận ngân sách',
        status: 'blocked',
        priority: 'high',
        due: 'Tuần này',
        nextStep: 'Chuyển HR/PMO làm rõ ngân sách.',
      },
    ],
    processNotes: ['Trưởng phòng quyết định các yêu cầu cấp phòng.', 'HR/Admin có thể xem để phối hợp vận hành.', 'Các mục ?nh hđếng release cần ưu tiên cao.'],
  },
  'department-reports': {
    title: 'Báo cáo phòng ban',
    subtitle: 'Từng hợp KPI, headcount, tải công việc và trạng thái vận hành của phòng ban.',
    icon: BarChart3,
    allowedRoles: ['departmentHead', 'hr', 'admin'],
    primaryAction: 'Tạo báo cáo',
    secondaryAction: 'Xuất PDF',
    metrics: [
      { label: 'Headcount', value: '46', hint: 'Nhân sự đang hoạt động' },
      { label: 'Utilization', value: '81%', hint: 'Tải công việc trung bình' },
      { label: 'KPI', value: '88%', hint: 'Mục hoàn thành tháng' },
    ],
    items: [
      {
        title: 'Từng quan nhân sự tháng 06',
        description: 'Headcount têng 4%, tỷ lệ nghỉ phép trong ngđãng ?n đãnh.',
        owner: 'Trưởng phòng',
        meta: 'Cập nhật hôm nay',
        status: 'approved',
        priority: 'normal',
        due: 'đã cập nhật',
        nextStep: 'Dùng làm dữ liệu họp tuần.',
      },
      {
        title: 'Rủi ro tải công việc',
        description: 'Nhóm Backend vượt 90% utilization trong 2 tuần liên tiếp.',
        owner: 'Delivery Manager',
        meta: 'Cần điều phối',
        status: 'blocked',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Điều chỉnh phân bổ hoặc bổ sung h? trợ.',
      },
      {
        title: 'Kế hoạch tuyển bổ sung',
        description: 'để xu?t 3 vị trí cho qu? tải d?a trên pipeline dự án.',
        owner: 'HR Business Partner',
        meta: 'Đang chuẩn bị',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Chuyển HR xác nhận kế hoạch tuyển.',
      },
    ],
    processNotes: ['Báo cáo phục vụ trưởng phòng và HR.', 'Rủi ro tải công việc cần gắn với action c? thể.', 'Khi nối API nên l?y tế hr-service/project-service.'],
  },
  benefits: {
    title: 'Hồ sơ phúc lợi',
    subtitle: 'Theo dõi lương, bảo hiểm, phụ cấp và chính sách phúc lợi của nhân viên.',
    icon: WalletCards,
    allowedRoles: ['hr', 'admin'],
    primaryAction: 'Cập nhật hồ sơ',
    secondaryAction: 'Kiểm tra thiếu sót',
    metrics: [
      { label: 'Hồ sơ đã', value: '94%', hint: 'đã có dữ liệu phúc lợi' },
      { label: 'Cần rà soát', value: '11', hint: 'Thiếu mã bảo hiểm hoặc phụ cấp' },
      { label: 'Cập nhật mới', value: '6', hint: 'Trong tuần' },
    ],
    items: [
      {
        title: 'Rà soát bảo hiểm xã hội',
        description: '11 hồ sơ cần bổ sung mã BHXH trước kỳ payroll.',
        owner: 'HR Payroll',
        meta: 'Ưu tiên cao',
        status: 'pending',
        priority: 'high',
        due: 'Trước kỳ lương',
        nextStep: 'Liên hệ nhân viên thiếu thông tin và cập nhật hồ sơ.',
      },
      {
        title: 'Cập nhật phụ cấp dự án',
        description: '6 nhân viên được thêm phụ cấp dự án theo quyết định mới.',
        owner: 'HR Operations',
        meta: 'Đang xử lý',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Đối chiếu quyết định và đồng bộ payroll.',
      },
      {
        title: 'Đối soát dữ liệu phúc lợi',
        description: 'Dữ liệu benefit tháng trước đã khớp payroll.',
        owner: 'Payroll Team',
        meta: 'đã hoàn tất',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Lưu kết quả đối soát.',
      },
    ],
    processNotes: ['HR chịu trách nhiệm dữ liệu phúc lợi.', 'Admin có thể truy cập để hỗ trợ cấu hình/vận hành.', 'Các thiếu sót nên xử lý trước kỳ payroll.'],
  },
};

workspaceDefinitions.tasks.items = workspaceDefinitions['team-tasks'].items;

const resolveWorkspace = (slug?: string) => {
  if (!slug) return undefined;
  return workspaceDefinitions[slug];
};

export const RoleWorkspacePage = () => {
  const { slug } = useParams();
  const { user } = useAuthStore();
  const [selectedItemTitle, setSelectedItemTitle] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<WorkspaceFilter>('all');

  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const workspace = resolveWorkspace(slug);

  const canAccess = useMemo(
    () => Boolean(workspace && workspace.allowedRoles.includes(workspaceRole)),
    [workspace, workspaceRole]
  );

  const filteredItems = useMemo(() => {
    if (!workspace) return [];
    if (activeFilter === 'all') return workspace.items;
    return workspace.items.filter((item) => item.status === activeFilter);
  }, [activeFilter, workspace]);

  const selectedItem = useMemo(() => {
    if (!workspace) return undefined;
    return workspace.items.find((item) => item.title === selectedItemTitle) || filteredItems[0];
  }, [filteredItems, selectedItemTitle, workspace]);

  if (!workspace || !canAccess) {
    return (
      <MainLayout>
        <Card className="p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
            <ShieldAlert size={28} />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">Không có quyền truy cập không gian này</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Chức năng này chỉ hiển thị cho đúng nhóm vai trò. H?y quay lỗi dashboard để xem các chức năng phù hợp
            với tài khoản hiện tại.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
          >
            <ArrowLeft size={16} />
            Về dashboard
          </Link>
        </Card>
      </MainLayout>
    );
  }

  const Icon = workspace.icon;

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                <Icon size={24} />
              </div>
              <div className="min-w-0">
                <Link to="/" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-cyan-700">
                  <ArrowLeft size={16} />
                  Dashboard
                </Link>
                <h2 className="text-2xl font-semibold text-slate-900">{workspace.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{workspace.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="secondary">{workspace.secondaryAction}</Button>
              <Button>
                <Plus size={16} />
                {workspace.primaryAction}
              </Button>
            </div>
          </div>
        </section>

        <WorkspaceMetricCards metrics={workspace.metrics} />

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Danh sách xử lý</CardTitle>
                <CardDescription>Dữ liệu mẫu UI, sẵn sàng nối API ở bước sau.</CardDescription>
              </div>
              <WorkspaceStatusFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
            </CardHeader>

            <WorkspaceStatusList
              items={filteredItems}
              selectedItem={selectedItem}
              onSelectItem={(item: WorkspaceItem) => setSelectedItemTitle(item.title)}
            />
          </Card>

          <WorkspaceActionPanel selectedItem={selectedItem} processNotes={workspace.processNotes} />
        </section>
      </div>
    </MainLayout>
  );
};
