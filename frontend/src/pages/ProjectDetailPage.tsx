import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Edit, FolderKanban, Plus, Trash2, Users } from 'lucide-react';
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
import { Project, ProjectAssignment, ProjectRole, ProjectStatus } from '@/types/project';
import { Task, TaskPriority, TaskStatus } from '@/types/task';

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

const roleLabels: Record<ProjectRole, string> = {
  MEMBER: 'Member',
  DEVELOPER: 'Developer',
  QA: 'QA',
  MANAGER: 'Manager',
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '--');

export const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = Number(id);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<ProjectAssignment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memberEmployeeId, setMemberEmployeeId] = useState('');
  const [memberRole, setMemberRole] = useState<ProjectRole>('MEMBER');
  const [savingMember, setSavingMember] = useState(false);

  const loadProject = async () => {
    if (!Number.isFinite(projectId)) {
      setError('Mã dự án không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [projectData, memberData, taskData] = await Promise.all([
        projectApi.getById(projectId),
        projectApi.getAssignments(projectId),
        taskApi.getByProject(projectId),
      ]);

      setProject(projectData);
      setMembers(memberData);
      setTasks(taskData);
    } catch {
      setError('Không thể tải chi tiết dự án hoặc danh sách thành viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId]);

  const handleAddMember = async () => {
    const employeeId = Number(memberEmployeeId);
    if (!employeeId) return;

    setSavingMember(true);
    setError(null);

    try {
      await projectApi.addAssignment(projectId, { employeeId, role: memberRole });
      setMemberEmployeeId('');
      await loadProject();
    } catch {
      setError('Không thể thêm thành viên. Có thể nhân viên đã thuộc dự án hoặc ID không tồn tại.');
    } finally {
      setSavingMember(false);
    }
  };

  const handleRemoveMember = async (assignment: ProjectAssignment) => {
    if (!window.confirm(`Gỡ nhân viên ${assignment.employeeId} khỏi dự án?`)) return;

    try {
      await projectApi.removeAssignment(projectId, assignment.employeeId);
      await loadProject();
    } catch {
      setError('Không thể gỡ thành viên khỏi dự án.');
    }
  };

  const memberColumns: Column<ProjectAssignment>[] = [
    { key: 'employeeId', title: 'Employee ID', sortable: true },
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
    { key: 'assignedAt', title: 'Ngày tham gia', render: (value) => formatDate(value) },
    {
      key: 'id',
      title: 'Thao tác',
      render: (_value, record) => (
        <Button type="button" variant="danger" size="sm" onClick={() => void handleRemoveMember(record)}>
          <Trash2 size={14} />
          Gỡ
        </Button>
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
    { key: 'priority', title: 'Ưu tiên', render: (value) => <Badge variant="warning">{priorityLabels[value]}</Badge> },
    { key: 'assigneeId', title: 'Assignee ID' },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={FolderKanban}
          title={project?.name || 'Chi tiết dự án'}
          description="Thông tin dự án, thành viên và task liên quan."
          actions={
            project && (
              <>
                <Link to="/projects">
                  <Button variant="outline">Quay lại</Button>
                </Link>
                <Link to={`/projects/edit/${project.id}`}>
                  <Button>
                    <Edit size={16} />
                    Sửa dự án
                  </Button>
                </Link>
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
              <div className="h-24 animate-pulse rounded bg-slate-100" />
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
            <Card>
              <CardHeader>
                <CardTitle>Thông tin chính</CardTitle>
                <CardDescription>Contract hiện tại của Project API.</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt>
                    <dd className="mt-2">
                      <Badge variant={projectStatusVariants[project.status]}>{statusLabels[project.status]}</Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Lead ID</dt>
                    <dd className="mt-2 text-sm font-medium text-slate-900">{project.leadId}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatDate(project.createdAt)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Cập nhật</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatDate(project.updatedAt)}</dd>
                  </div>
                </dl>
                <p className="mt-5 text-sm leading-6 text-slate-600">{project.description || 'Chưa có mô tả dự án.'}</p>
              </CardContent>
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Thành viên dự án</CardTitle>
                <CardDescription>Thêm, xem và gỡ thành viên theo contract Project Assignment API.</CardDescription>
              </CardHeader>
              <CardContent className="border-b border-slate-200">
                <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
                  <Input
                    label="Employee ID"
                    type="number"
                    min={1}
                    value={memberEmployeeId}
                    onChange={(event) => setMemberEmployeeId(event.target.value)}
                    placeholder="Ví dụ: 1"
                  />
                  <div>
                    <label htmlFor="member-role" className="mb-1 block text-sm font-medium text-slate-700">
                      Vai trò
                    </label>
                    <select
                      id="member-role"
                      value={memberRole}
                      onChange={(event) => setMemberRole(event.target.value as ProjectRole)}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {Object.entries(roleLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" isLoading={savingMember} onClick={() => void handleAddMember()}>
                      <Users size={16} />
                      Thêm
                    </Button>
                  </div>
                </div>
              </CardContent>
              <Table columns={memberColumns} data={members} />
            </Card>

            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Task của dự án</CardTitle>
                <CardDescription>Danh sách task lấy từ Task API theo project ID.</CardDescription>
              </CardHeader>
              <Table columns={taskColumns} data={tasks} />
              <CardContent>
                <Link to={`/tasks/add?projectId=${project.id}`}>
                  <Button variant="outline">
                    <Plus size={16} />
                    Tạo task cho dự án
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};
