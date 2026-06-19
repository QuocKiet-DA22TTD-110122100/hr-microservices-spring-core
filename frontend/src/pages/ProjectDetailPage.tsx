import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Edit,
  FolderKanban,
  ListChecks,
  Plus,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { Table, Column } from '@/components/UI/Table';
import { usePermissions } from '@/hooks/usePermissions';
import { Employee } from '@/types/employee';
import { Project, ProjectAssignment, ProjectRole, ProjectStatus } from '@/types/project';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { PERMISSIONS } from '@/utils/permissions';

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn tất',
  ARCHIVED: 'Lưu trữ',
};

const taskStatusLabels: Record<TaskStatus, string> = {
  OPEN: 'Mở',
  IN_PROGRESS: 'Đang làm',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
};

const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Thấp',
  MEDIUM: 'Trung bình',
  HIGH: 'Cao',
  URGENT: 'Khẩn cấp',
};

const projectStatusVariants: Record<ProjectStatus, 'success' | 'warning' | 'info' | 'muted'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'muted',
};

const taskStatusVariants: Record<TaskStatus, 'info' | 'warning' | 'success' | 'muted'> = {
  OPEN: 'info',
  IN_PROGRESS: 'warning',
  COMPLETED: 'success',
  CANCELLED: 'muted',
};

const priorityVariants: Record<TaskPriority, 'muted' | 'info' | 'warning' | 'danger'> = {
  LOW: 'muted',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'danger',
};

const roleLabels: Record<ProjectRole, string> = {
  MEMBER: 'Thành viên',
  DEVELOPER: 'Developer',
  QA: 'QA',
  MANAGER: 'Manager',
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '--');

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canUpdateProject = can(PERMISSIONS.PROJECT_UPDATE);
  const canManageMembers = can(PERMISSIONS.PROJECT_MEMBER_MANAGE);
  const canCreateTask = can(PERMISSIONS.TASK_CREATE);
  const projectId = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectAssignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberEmployeeId, setMemberEmployeeId] = useState('');
  const [memberRole, setMemberRole] = useState<ProjectRole>('MEMBER');
  const [savingMember, setSavingMember] = useState(false);

  const loadProject = useCallback(async () => {
    if (!Number.isFinite(projectId)) {
      setError('Mã dự án không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [projectData, memberData, taskData, employeeResponse] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getAssignments(projectId),
        taskApi.getByProject(projectId),
        employeeApi.getAll({ page: 0, size: 100 }).catch(() => null),
      ]);

      setProject(projectData);
      setMembers(memberData);
      setTasks(taskData);
      setEmployees(employeeResponse?.data.content || []);
    } catch {
      setError('Không thể tải chi tiết dự án. Vui lòng kiểm tra gateway và project-service.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadProject();
  }, [loadProject]);

  const stats = useMemo(() => {
    const activeMembers = members.filter((member) => member.active).length;
    const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
    const openTasks = tasks.filter((task) => task.status !== 'COMPLETED' && task.status !== 'CANCELLED').length;

    return [
      {
        label: 'Thành viên active',
        value: activeMembers.toString(),
        hint: `${members.length} phân công trong dự án`,
        icon: Users,
        tone: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Task đang mở',
        value: openTasks.toString(),
        hint: 'Cần theo dõi tiến độ',
        icon: ListChecks,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Task hoàn tất',
        value: completedTasks.toString(),
        hint: `${tasks.length} task tổng cộng`,
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Cập nhật gần nhất',
        value: formatDate(project?.updatedAt || project?.createdAt),
        hint: 'Theo dữ liệu Project API',
        icon: CalendarClock,
        tone: 'bg-slate-100 text-slate-700',
      },
    ];
  }, [members, project?.createdAt, project?.updatedAt, tasks]);

  const employeeById = useMemo(() => {
    return new Map(employees.map((employee) => [employee.id, employee]));
  }, [employees]);

  const handleAddMember = async () => {
    if (!canManageMembers) {
      setError('Tai khoan hien tai khong co quyen phan cong thanh vien du an.');
      return;
    }

    const employeeId = Number(memberEmployeeId);
    if (!employeeId) return;

    setSavingMember(true);
    setError(null);

    try {
      await projectApi.addAssignment(projectId, { employeeId, role: memberRole });
      setMemberEmployeeId('');
      await loadProject();
    } catch {
      setError('Không thể thêm thành viên. Nhân viên có thể đã thuộc dự án hoặc ID không tồn tại.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (assignment: ProjectAssignment) => {
    if (!canManageMembers) {
      setError('Tai khoan hien tai khong co quyen go thanh vien khoi du an.');
      return;
    }

    if (!window.confirm(`Gỡ nhân viên ${assignment.employeeId} khỏi dự án?`)) return;

    try {
      await projectApi.removeAssignment(projectId, assignment.employeeId);
      await loadProject();
    } catch {
      setError('Không thể gỡ thành viên khỏi dự án.');
    }
  };

  const memberColumns: Column<ProjectAssignment>[] = [
    {
      key: 'employeeId',
      title: 'Nhân viên',
      sortable: true,
      render: (value) => {
        const employee = employeeById.get(Number(value));

        return (
          <div>
            <p className="font-medium text-slate-900">{employee?.name || `Employee #${value}`}</p>
            <p className="text-xs text-slate-500">#{value}{employee?.position ? ` - ${employee.position}` : ''}</p>
          </div>
        );
      },
    },
    {
      key: 'role',
      title: 'Vai trò',
      render: (value) => <Badge variant="info">{roleLabels[value]}</Badge>,
    },
    {
      key: 'active',
      title: 'Trạng thái',
      render: (value) => <Badge variant={value ? 'success' : 'muted'}>{value ? 'Đang tham gia' : 'Không hoạt động'}</Badge>,
    },
    { key: 'assignedAt', title: 'Ngày tham gia', render: (value) => formatDateTime(value) },
    {
      key: 'id',
      title: 'Thao tác',
      render: (_value, record) =>
        canManageMembers ? (
          <Button type="button" variant="danger" size="sm" onClick={() => void handleRemoveMember(record)}>
            <Trash2 size={14} />
            Gỡ
          </Button>
        ) : (
          <span className="text-sm text-slate-500">Chỉ xem</span>
        ),
    },
  ];

  const taskColumns: Column<Task>[] = [
    {
      key: 'title',
      title: 'Task',
      render: (value, record) => (
        <button type="button" className="text-left font-medium text-cyan-700 hover:text-cyan-900" onClick={() => navigate(`/tasks/${record.id}`)}>
          {value}
        </button>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (value) => <Badge variant={taskStatusVariants[value]}>{taskStatusLabels[value]}</Badge>,
    },
    {
      key: 'priority',
      title: 'Ưu tiên',
      render: (value) => <Badge variant={priorityVariants[value]}>{priorityLabels[value]}</Badge>,
    },
    { key: 'assigneeId', title: 'Phụ trách', render: (value) => <span>#{value}</span> },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={FolderKanban}
          title={project?.name || 'Chi tiết dự án'}
          description="Theo dõi thông tin dự án, phân công thành viên và task liên quan."
          actions={
            project && (
              <>
                <Link to="/projects">
                  <Button variant="outline">Quay lại</Button>
                </Link>
                {canUpdateProject && (
                  <Link to={`/projects/edit/${project.id}`}>
                    <Button>
                      <Edit size={16} />
                      Sửa dự án
                    </Button>
                  </Link>
                )}
              </>
            )
          }
        />

        {error && (
          <Card className="border-rose-200">
            <EmptyState icon={AlertCircle} title="Có lỗi xảy ra" description={error} action={<Button onClick={loadProject}>Thử lại</Button>} />
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent>
              <div className="h-32 animate-pulse rounded-md bg-slate-100" />
            </CardContent>
          </Card>
        )}

        {!loading && !project && !error && (
          <Card>
            <EmptyState title="Không tìm thấy dự án" description="Dự án không tồn tại hoặc đã bị xóa." />
          </Card>
        )}

        {!loading && project && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-slate-900">{stat.value}</p>
                      <p className="mt-2 text-sm text-slate-500">{stat.hint}</p>
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${stat.tone}`}>
                      <stat.icon size={22} />
                    </div>
                  </div>
                </Card>
              ))}
            </section>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Thông tin chính</CardTitle>
                      <CardDescription>Trạng thái, lead và mô tả dự án.</CardDescription>
                    </div>
                    <Badge variant={projectStatusVariants[project.status]}>{statusLabels[project.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Lead</dt>
                      <dd className="mt-2 text-sm font-medium text-slate-900">#{project.leadId}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt>
                      <dd className="mt-2 text-sm text-slate-700">{formatDateTime(project.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Cập nhật</dt>
                      <dd className="mt-2 text-sm text-slate-700">{formatDateTime(project.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Project ID</dt>
                      <dd className="mt-2 text-sm text-slate-700">#{project.id}</dd>
                    </div>
                  </dl>
                  <p className="mt-5 whitespace-pre-line text-sm leading-6 text-slate-600">{project.description || 'Chưa có mô tả dự án.'}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Thao tác nhanh</CardTitle>
                  <CardDescription>Các luồng thường dùng trong quản lý dự án.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {canCreateTask && (
                    <Link to={`/tasks/add?projectId=${project.id}`} className="block">
                      <Button className="w-full justify-start" variant="outline">
                        <Plus size={16} />
                        Tạo task cho dự án
                      </Button>
                    </Link>
                  )}
                  {canUpdateProject && (
                    <Link to={`/projects/edit/${project.id}`} className="block">
                      <Button className="w-full justify-start" variant="outline">
                        <Edit size={16} />
                        Cập nhật dự án
                      </Button>
                    </Link>
                  )}
                  {!canCreateTask && !canUpdateProject && (
                    <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">Tài khoản hiện tại chỉ có quyền xem dự án.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Thành viên dự án</CardTitle>
                <CardDescription>Thêm, xem và gỡ thành viên theo Project Assignment API.</CardDescription>
              </CardHeader>
              {canManageMembers && (
                <CardContent className="border-b border-slate-200">
                  <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                    <Input
                      label={employees.length > 0 ? undefined : 'Employee ID'}
                      type="number"
                      list="member-employee-options"
                      min={1}
                      value={memberEmployeeId}
                      onChange={(event) => setMemberEmployeeId(event.target.value)}
                      placeholder="Ví dụ: 1"
                    />
                    <datalist id="member-employee-options">
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} #{employee.id}{employee.position ? ` - ${employee.position}` : ''}
                        </option>
                      ))}
                    </datalist>
                    <div>
                      <label htmlFor="member-role" className="mb-1 block text-sm font-medium text-slate-700">
                        Vai trò
                      </label>
                      <select
                        id="member-role"
                        value={memberRole}
                        onChange={(event) => setMemberRole(event.target.value as ProjectRole)}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        {Object.entries(roleLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button type="button" isLoading={savingMember} onClick={() => void handleAddMember()} disabled={!memberEmployeeId.trim()}>
                        <UserPlus size={16} />
                        Thêm
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}
              <Table columns={memberColumns} data={members} />
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <CardTitle>Task của dự án</CardTitle>
                    <CardDescription>Danh sách task lấy từ Task API theo project ID.</CardDescription>
                  </div>
                  {canCreateTask && (
                    <Link to={`/tasks/add?projectId=${project.id}`}>
                      <Button variant="outline" size="sm">
                        <Plus size={14} />
                        Tạo task
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <Table columns={taskColumns} data={tasks} />
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};
