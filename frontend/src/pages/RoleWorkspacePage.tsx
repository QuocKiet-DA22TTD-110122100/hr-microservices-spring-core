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
  ShieldAlert,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { WorkspaceActionPanel } from '@/components/Workspace/WorkspaceActionPanel';
import { WorkspaceMetricCards } from '@/components/Workspace/WorkspaceMetricCards';
import { WorkspaceStatusFilters, WorkspaceFilter } from '@/components/Workspace/WorkspaceStatusFilters';
import { WorkspaceStatusList } from '@/components/Workspace/WorkspaceStatusList';
import { WorkspaceDefinition, WorkspaceItem } from '@/components/Workspace/types';
import { resolveWorkspaceRole } from '@/config/roleExperience';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

const workspaceDefinitions: Record<string, WorkspaceDefinition> = {
  'account-security': {
    title: 'Tài khoản và bảo mật',
    subtitle: 'Theo dõi hồ sơ tài khoản, hạn mật khẩu và phạm vi quyền truy cập cá nhân.',
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
        description: 'Đổi mật khẩu định kỳ để giảm rủi ro truy cập trái phép.',
        owner: 'Tôi',
        meta: 'Bảo mật',
        status: 'pending',
        priority: 'medium',
        due: 'Theo chính sách',
        nextStep: 'Mở màn hình đổi mật khẩu và dùng mật khẩu mạnh.',
      },
      {
        title: 'Quyền truy cập hiện tại',
        description: 'Đối chiếu role trong token với các mục đang hiển thị ở sidebar.',
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
        description: '08:05 - 17:32, đã đủ công, có tăng ca 30 phút.',
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
        meta: 'Chờ quản lý xác nhận',
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
    processNotes: ['Nhân viên dùng để theo dõi công cá nhân.', 'Quản lý có thể xem để hỗ trợ phê duyệt.', 'Ngoại lệ cần ghi chú trước khi khóa kỳ công.'],
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
        meta: 'Đã hoàn tất',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Không cần xử lý thêm.',
      },
    ],
    processNotes: ['Nhân viên tạo đơn nghỉ.', 'Quản lý duyệt bước đầu.', 'Trưởng phòng và HR theo dõi các trường hợp ảnh hưởng vận hành.'],
  },
  'personal-tasks': {
    title: 'Task cá nhân',
    subtitle: 'Theo dõi task được giao, deadline, mức ưu tiên và trạng thái thực hiện.',
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
        due: 'Thứ sáu',
        nextStep: 'Xác nhận đã đọc sau khi hoàn tất.',
      },
    ],
    processNotes: ['Task cá nhân chỉ tập trung vào việc được giao cho người đăng nhập.', 'Task blocked nên được ưu tiên trong queue.', 'Dữ liệu hiện là mock UI, sẵn sàng nối API task-service.'],
  },
  'timesheet-approval': {
    title: 'Duyệt timesheet',
    subtitle: 'Xác nhận bảng công, ghi chú ngoại lệ và giờ làm của nhân viên trong nhóm.',
    icon: ClipboardCheck,
    allowedRoles: ['manager', 'departmentHead', 'hr', 'admin'],
    primaryAction: 'Duyệt mục đã chọn',
    secondaryAction: 'Lọc ngoại lệ',
    metrics: [
      { label: 'Chờ duyệt', value: '12', hint: 'Bảng công trong tuần' },
      { label: 'Ngoại lệ', value: '3', hint: 'Thiếu check-out hoặc OT' },
      { label: 'Đã xử lý', value: '28', hint: 'Trong kỳ công hiện tại' },
    ],
    items: [
      {
        title: 'Nguyễn Minh An',
        description: 'Thiếu check-out ngày 03/06, có ghi chú từ nhân viên.',
        owner: 'Quản lý nhóm',
        meta: 'Ngoại lệ',
        status: 'pending',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Xác nhận ghi chú và duyệt hoặc trả lại.',
      },
      {
        title: 'Trần Bảo Ngọc',
        description: 'OT 2 giờ cần xác nhận trước khi khóa kỳ công.',
        owner: 'Quản lý nhóm',
        meta: 'Tăng ca',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Đối chiếu task phát sinh và duyệt OT.',
      },
      {
        title: 'Lê Ngọc Hân',
        description: 'Bảng công đầy đủ, không có ngoại lệ.',
        owner: 'Quản lý nhóm',
        meta: 'Sẵn sàng',
        status: 'approved',
        priority: 'normal',
        due: 'Đã duyệt',
        nextStep: 'Không cần xử lý thêm.',
      },
    ],
    processNotes: ['Ưu tiên xử lý ngoại lệ trước khi khóa kỳ công.', 'Manager duyệt phạm vi nhóm.', 'HR theo dõi để chuẩn bị payroll.'],
  },
  'team-tasks': {
    title: 'Task nhóm',
    subtitle: 'Theo dõi tiến độ, rủi ro và phân công của các tác vụ trong nhóm.',
    icon: Briefcase,
    allowedRoles: ['manager', 'departmentHead', 'admin'],
    primaryAction: 'Điều phối task',
    secondaryAction: 'Xem board',
    metrics: [
      { label: 'Đang mở', value: '18', hint: 'Tác vụ thuộc nhóm' },
      { label: 'Quá hạn', value: '2', hint: 'Cần xử lý ngay' },
      { label: 'Bị chặn', value: '1', hint: 'Đang chờ hỗ trợ' },
    ],
    items: [
      {
        title: 'Tích hợp API nhân viên',
        description: 'Hoàn thiện mapping dữ liệu hồ sơ nhân sự sang dashboard quản lý.',
        owner: 'Backend',
        meta: 'Sprint 12',
        status: 'inProgress',
        priority: 'high',
        due: 'Thứ sáu',
        nextStep: 'Chốt payload schema và cập nhật tiến độ với tech lead.',
        progress: 65,
        assignee: { name: 'Trần Thị B', initial: 'B', color: 'bg-emerald-600' },
      },
      {
        title: 'Chuẩn hóa form nghỉ phép',
        description: 'Giao diện đã có mock data, cần nối API leave-service và xử lý validation.',
        owner: 'Frontend',
        meta: 'UI/API',
        status: 'pending',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Tạo contract API và kiểm thử happy path trước khi demo.',
        assignee: { name: 'Nguyễn Văn A', initial: 'A', color: 'bg-blue-600' },
      },
      {
        title: 'Kiểm thử phân quyền hệ thống',
        description: 'Kiểm tra route guard và API middleware cho các role: Manager, HR và Admin.',
        owner: 'QA',
        meta: 'Security',
        status: 'blocked',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Bổ sung tài khoản seed cho từng role và chạy test suite API.',
        assignee: { name: 'Lê Văn C', initial: 'C', color: 'bg-amber-600' },
      },
    ],
    processNotes: [
      'Manager điều phối và theo dõi tiến độ từng tác vụ trong nhóm.',
      'Tác vụ bị chặn (blocked) cần xác định owner và unblock ngay.',
      'Khi nối API thật, dữ liệu sẽ đến từ task-service.',
    ],
  },
  approvals: {
    title: 'Phê duyệt cấp phòng',
    subtitle: 'Gom yêu cầu nghỉ phép, điều chuyển và phân bổ nhân sự cần trưởng phòng quyết định.',
    icon: ShieldAlert,
    allowedRoles: ['departmentHead', 'admin'],
    primaryAction: 'Phê duyệt',
    secondaryAction: 'Chuyển xử lý',
    metrics: [
      { label: 'Chờ duyệt', value: '7', hint: 'Cấp phòng' },
      { label: 'Điều chuyển', value: '2', hint: 'Cần xác nhận nhân sự' },
      { label: 'Rủi ro SLA', value: '3', hint: 'Gần quá hạn' },
    ],
    items: [
      {
        title: 'Điều chuyển nhân sự',
        description: 'Đề xuất điều chuyển 1 nhân viên từ HRIS sang Payroll trong 2 tháng.',
        owner: 'Trưởng phòng',
        meta: 'Điều chuyển',
        status: 'pending',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Xem tác động nhân sự và quyết định phê duyệt.',
      },
      {
        title: 'Nghỉ dài ngày',
        description: 'Nhân viên xin nghỉ 5 ngày, quản lý trực tiếp đã đồng ý.',
        owner: 'Trưởng phòng',
        meta: 'Nghỉ phép',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Đối chiếu kế hoạch thay thế nhân sự.',
      },
      {
        title: 'Bổ sung nhân sự dự án',
        description: 'Đề nghị thêm 2 nhân sự cho dự án tích hợp API nội bộ.',
        owner: 'Trưởng phòng',
        meta: 'Chờ ngân sách',
        status: 'blocked',
        priority: 'high',
        due: 'Tuần này',
        nextStep: 'Chuyển HR/PMO làm rõ ngân sách.',
      },
    ],
    processNotes: ['Trưởng phòng quyết định các thay đổi ảnh hưởng vận hành.', 'Các phê duyệt phải có lý do rõ.', 'HR và PMO nhận phần việc tiếp theo sau phê duyệt.'],
  },
  'department-reports': {
    title: 'Báo cáo phòng ban',
    subtitle: 'Theo dõi headcount, KPI, rủi ro tải việc và các chỉ số vận hành.',
    icon: BarChart3,
    allowedRoles: ['departmentHead', 'admin'],
    primaryAction: 'Xuất báo cáo',
    secondaryAction: 'Lọc phòng ban',
    metrics: [
      { label: 'Headcount', value: '46', hint: 'Nhân sự đang hoạt động' },
      { label: 'KPI', value: '88%', hint: 'Mức hoàn thành tháng' },
      { label: 'Rủi ro tải việc', value: '2 nhóm', hint: 'Cần điều phối' },
    ],
    items: [
      {
        title: 'Tổng quan nhân sự tháng 06',
        description: 'Headcount ổn định, 3 vị trí đang tuyển bổ sung.',
        owner: 'Trưởng phòng',
        meta: 'Nhân sự',
        status: 'approved',
        priority: 'normal',
        due: 'Tháng này',
        nextStep: 'Chia sẻ báo cáo cho ban điều hành.',
      },
      {
        title: 'Utilization Backend',
        description: 'Tải việc vượt 90% trong 2 tuần liên tiếp.',
        owner: 'Trưởng phòng',
        meta: 'Rủi ro',
        status: 'blocked',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Điều chỉnh phân bổ hoặc bổ sung hỗ trợ.',
      },
      {
        title: 'KPI chất lượng',
        description: 'Tỷ lệ task hoàn thành đúng hạn đạt 88%.',
        owner: 'Trưởng phòng',
        meta: 'KPI',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Rà soát task quá hạn và nguyên nhân.',
      },
    ],
    processNotes: ['Báo cáo dùng cho điều hành phòng ban.', 'Chỉ số rủi ro cần hành động cụ thể.', 'Khi nối API, dữ liệu lấy từ HR và task-service.'],
  },
  'hr-records': {
    title: 'Hồ sơ nhân sự',
    subtitle: 'Theo dõi dữ liệu nhân viên, trạng thái hồ sơ và các cập nhật cần HR xử lý.',
    icon: Users,
    allowedRoles: ['hr', 'admin'],
    primaryAction: 'Mở hồ sơ',
    secondaryAction: 'Lọc thiếu dữ liệu',
    metrics: [
      { label: 'Đủ dữ liệu', value: '94%', hint: 'Hồ sơ đạt chuẩn' },
      { label: 'Thiếu thông tin', value: '11', hint: 'Cần bổ sung trước payroll' },
      { label: 'Cập nhật mới', value: '6', hint: 'Trong tuần hiện tại' },
    ],
    items: [
      {
        title: 'Bổ sung mã số thuế',
        description: '5 nhân viên thiếu mã số thuế hoặc thông tin phụ thuộc.',
        owner: 'HR',
        meta: 'Hồ sơ',
        status: 'pending',
        priority: 'high',
        due: 'Trước payroll',
        nextStep: 'Liên hệ nhân viên thiếu thông tin và cập nhật hồ sơ.',
      },
      {
        title: 'Cập nhật chức danh',
        description: '3 nhân viên thay đổi chức danh sau kỳ review.',
        owner: 'HR',
        meta: 'Vòng đời nhân viên',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Đồng bộ chức danh sang HRIS.',
      },
      {
        title: 'Rà soát trạng thái làm việc',
        description: 'Đối chiếu danh sách active với hợp đồng còn hiệu lực.',
        owner: 'HR',
        meta: 'Compliance',
        status: 'approved',
        priority: 'normal',
        due: 'Hàng tháng',
        nextStep: 'Lưu báo cáo kiểm tra.',
      },
    ],
    processNotes: ['HR chịu trách nhiệm độ chính xác hồ sơ.', 'Dữ liệu thiếu cần xử lý trước payroll.', 'Các thay đổi nhân sự nên có dấu vết audit.'],
  },
  benefits: {
    title: 'Phúc lợi',
    subtitle: 'Theo dõi lương, bảo hiểm, phụ cấp và chính sách phúc lợi của nhân viên.',
    icon: WalletCards,
    allowedRoles: ['hr', 'admin'],
    primaryAction: 'Cập nhật phúc lợi',
    secondaryAction: 'Xuất danh sách',
    metrics: [
      { label: 'Chờ rà soát', value: '11', hint: 'Thiếu bảo hiểm hoặc phụ cấp' },
      { label: 'Đã cập nhật', value: '6', hint: 'Trong tuần hiện tại' },
      { label: 'Sẵn sàng payroll', value: '92%', hint: 'Hồ sơ đủ dữ liệu' },
    ],
    items: [
      {
        title: 'Thiếu thông tin bảo hiểm',
        description: '11 hồ sơ cần bổ sung trước kỳ payroll.',
        owner: 'HR',
        meta: 'BHXH',
        status: 'pending',
        priority: 'high',
        due: 'Trước payroll',
        nextStep: 'Liên hệ nhân viên thiếu thông tin và cập nhật hồ sơ.',
      },
      {
        title: 'Phụ cấp dự án',
        description: '6 nhân viên được thêm phụ cấp dự án theo quyết định mới.',
        owner: 'HR',
        meta: 'Phụ cấp',
        status: 'inProgress',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Xác nhận quyết định và cập nhật phụ cấp.',
      },
      {
        title: 'Chính sách nghỉ lễ',
        description: 'Thông tin phúc lợi đã cập nhật cho kỳ nghỉ sắp tới.',
        owner: 'HR',
        meta: 'Chính sách',
        status: 'approved',
        priority: 'normal',
        due: 'Hoàn tất',
        nextStep: 'Thông báo cho nhân viên.',
      },
    ],
    processNotes: ['Phúc lợi liên quan trực tiếp đến payroll.', 'Dữ liệu phải được kiểm tra trước kỳ lương.', 'Mọi cập nhật nên có nguồn quyết định rõ ràng.'],
  },
  audit: {
    title: 'Audit và phân quyền',
    subtitle: 'Theo dõi thay đổi tài khoản, role và các sự kiện nhạy cảm.',
    icon: FileText,
    allowedRoles: ['admin'],
    primaryAction: 'Xem audit',
    secondaryAction: 'Xuất log',
    metrics: [
      { label: 'Sự kiện tuần này', value: '9', hint: 'Thay đổi quyền' },
      { label: 'Role hệ thống', value: '6', hint: 'Đang sử dụng' },
      { label: 'Tài khoản nhạy cảm', value: '4', hint: 'Cần rà soát định kỳ' },
    ],
    items: [
      {
        title: 'Thay đổi role HR',
        description: 'Một tài khoản được cấp quyền HR_MANAGER.',
        owner: 'Admin',
        meta: 'Role',
        status: 'inProgress',
        priority: 'high',
        due: 'Hôm nay',
        nextStep: 'Xác minh người phê duyệt và lý do thay đổi.',
      },
      {
        title: 'Tài khoản bị khóa',
        description: 'Một tài khoản bị khóa sau nhiều lần đăng nhập thất bại.',
        owner: 'Hệ thống',
        meta: 'Security',
        status: 'approved',
        priority: 'medium',
        due: 'Đã xử lý',
        nextStep: 'Theo dõi nếu có yêu cầu mở khóa.',
      },
      {
        title: 'Rà soát quyền admin',
        description: 'Kiểm tra tài khoản quyền cao theo lịch định kỳ.',
        owner: 'Admin',
        meta: 'Compliance',
        status: 'pending',
        priority: 'medium',
        due: 'Tuần này',
        nextStep: 'Đối chiếu danh sách tài khoản quyền cao.',
      },
    ],
    processNotes: ['Admin chịu trách nhiệm kiểm soát quyền cao.', 'Audit cần có lý do và người phê duyệt.', 'Khi nối API, dữ liệu lấy từ auth-service.'],
  },
};

export const RoleWorkspacePage = () => {
  const { slug = '' } = useParams();
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<WorkspaceFilter>('all');

  const workspace = workspaceDefinitions[slug];
  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const hasAccess = workspace?.allowedRoles.includes(workspaceRole);

  const filteredItems = useMemo(() => {
    if (!workspace) return [];
    if (activeFilter === 'all') return workspace.items;
    return workspace.items.filter((item) => item.status === activeFilter);
  }, [activeFilter, workspace]);

  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const selectedItem = useMemo(() => {
    if (!workspace) return undefined;
    return workspace.items.find((item) => item.title === selectedTitle) || filteredItems[0];
  }, [filteredItems, selectedTitle, workspace]);

  const handleSelectItem = (item: WorkspaceItem) => {
    setSelectedTitle(item.title);
  };

  if (!workspace) {
    return (
      <MainLayout>
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <CardHeader>
            <CardTitle>Không tìm thấy workspace</CardTitle>
            <CardDescription>Đường dẫn hiện tại chưa có cấu hình giao diện.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button type="button">
                <ArrowLeft size={16} />
                Về dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return (
      <MainLayout>
        <Card className="mx-auto max-w-2xl p-8 text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-md bg-rose-50 text-rose-600">
              <ShieldAlert size={28} />
            </div>
            <CardTitle>Bạn chưa có quyền vào workspace này</CardTitle>
            <CardDescription>Vai trò hiện tại không nằm trong phạm vi được phép của trang này.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/">
              <Button type="button">
                <ArrowLeft size={16} />
                Về dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  const Icon = workspace.icon;

  return (
    <MainLayout>
      <div className="space-y-6">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                <Icon size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-cyan-700">Workspace</p>
                <h1 className="mt-1 text-2xl font-semibold text-slate-900">{workspace.title}</h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{workspace.subtitle}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline">
                {workspace.secondaryAction}
              </Button>
              <Button type="button">{workspace.primaryAction}</Button>
            </div>
          </div>
        </section>

        <WorkspaceMetricCards metrics={workspace.metrics} />

        <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-slate-100">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle>Danh sách xử lý</CardTitle>
                  <CardDescription>Lọc theo trạng thái để tập trung vào việc quan trọng.</CardDescription>
                </div>
                <WorkspaceStatusFilters activeFilter={activeFilter} onFilterChange={setActiveFilter} />
              </div>
            </CardHeader>
            <WorkspaceStatusList items={filteredItems} selectedItem={selectedItem} onSelectItem={handleSelectItem} />
          </Card>

          <WorkspaceActionPanel selectedItem={selectedItem} processNotes={workspace.processNotes} />
        </section>
      </div>
    </MainLayout>
  );
};
