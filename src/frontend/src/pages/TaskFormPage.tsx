import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ListChecks, Save } from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { Employee } from '@/types/employee';
import { Project } from '@/types/project';
import { TaskPriority, TaskRequest, TaskStatus } from '@/types/task';

const statusLabels: Record<TaskStatus, string> = {
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

export const TaskFormPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const taskId = id ? Number(id) : null;
  const isEditing = taskId !== null;
  const initialProjectId = Number(searchParams.get('projectId')) || 1;
  const [form, setForm] = useState<TaskRequest>({
    title: '',
    description: '',
    status: 'OPEN',
    priority: 'MEDIUM',
    assigneeId: 1,
    projectId: initialProjectId,
  });
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [referenceError, setReferenceError] = useState<string | null>(null);

  useEffect(() => {
    const loadReferences = async () => {
      try {
        const [employeeResponse, projectResponse] = await Promise.all([
          employeeApi.getAll({ page: 0, size: 100 }),
          projectApi.getAll(),
        ]);

        setEmployees(employeeResponse.data.content);
        setProjects(projectResponse);
      } catch {
        setReferenceError('Chua tai duoc du lieu nhan vien/du an. Co the nhap ID thu cong de tiep tuc.');
      }
    };

    void loadReferences();
  }, []);

  useEffect(() => {
    if (!taskId) return;

    const loadTask = async () => {
      setLoading(true);
      setError(null);

      try {
        const task = await taskApi.getById(taskId);
        setForm({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          projectId: task.projectId,
        });
      } catch {
        setError('Không thể tải dữ liệu task để chỉnh sửa.');
      } finally {
        setLoading(false);
      }
    };

    void loadTask();
  }, [taskId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextFieldErrors: Record<string, string> = {};
    const normalizedTitle = form.title.trim();
    const normalizedProjectId = Number(form.projectId);
    const normalizedAssigneeId = Number(form.assigneeId);

    if (!normalizedTitle) {
      nextFieldErrors.title = 'Tieu de task la bat buoc.';
    }

    if (!Number.isFinite(normalizedProjectId) || normalizedProjectId < 1) {
      nextFieldErrors.projectId = 'Vui lòng chọn dự án hợp lệ.';
    }

    if (!Number.isFinite(normalizedAssigneeId) || normalizedAssigneeId < 1) {
      nextFieldErrors.assigneeId = 'Vui lòng chọn người phụ trách hợp lệ.';
    }

    setFieldErrors(nextFieldErrors);
    if (Object.keys(nextFieldErrors).length > 0) return;

    setSaving(true);
    setError(null);

    try {
      const payload: TaskRequest = {
        ...form,
        title: normalizedTitle,
        description: form.description?.trim() || null,
        assigneeId: normalizedAssigneeId,
        projectId: normalizedProjectId,
      };

      const saved = taskId ? await taskApi.update(taskId, payload) : await taskApi.create(payload);
      navigate(`/tasks/${saved.id}`);
    } catch {
      setError('Không thể lưu task. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={ListChecks}
          title={isEditing ? 'Sửa task' : 'Tạo task'}
          description={isEditing ? 'Cập nhật nội dung, trạng thái, độ ưu tiên và người phụ trách task.' : 'Tạo task mới và gắn vào dự án phù hợp.'}
          actions={
            <Link to="/tasks">
              <Button variant="outline">Quay lại</Button>
            </Link>
          }
        />

        {error && (
          <Card className="border-rose-200">
            <EmptyState icon={AlertCircle} title="Có lỗi xảy ra" description={error} />
          </Card>
        )}

        <Card>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded bg-slate-100" />
                <div className="h-28 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
                <Input
                  label="Tiêu đề"
                  required
                  value={form.title}
                  onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                  error={fieldErrors.title}
                />

                <div>
                  <label htmlFor="task-description" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    id="task-description"
                    value={form.description || ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition placeholder:text-slate-500 hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="task-status" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Trạng thái
                    </label>
                    <select
                      id="task-status"
                      value={form.status || 'OPEN'}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Ưu tiên
                    </label>
                    <select
                      id="task-priority"
                      value={form.priority || 'MEDIUM'}
                      onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-project" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Dự án <span className="ml-1 text-rose-500">*</span>
                    </label>
                    {projects.length > 0 ? (
                      <select
                        id="task-project"
                        value={form.projectId || ''}
                        onChange={(event) => setForm((current) => ({ ...current, projectId: Number(event.target.value) }))}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                      >
                        <option value="" disabled>
                          Chọn dự án
                        </option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name} #{project.id}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id="task-project"
                        required
                        type="number"
                        min={1}
                        value={form.projectId}
                        onChange={(event) => setForm((current) => ({ ...current, projectId: Number(event.target.value) }))}
                        error={fieldErrors.projectId}
                        helperText={referenceError || 'Nhập ID dự án chứa task.'}
                      />
                    )}
                    {projects.length > 0 && fieldErrors.projectId && <p className="mt-1.5 text-sm text-rose-600">{fieldErrors.projectId}</p>}
                  </div>

                  <div>
                    <label htmlFor="task-assignee" className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Người phụ trách <span className="ml-1 text-rose-500">*</span>
                    </label>
                    {employees.length > 0 ? (
                      <select
                        id="task-assignee"
                        value={form.assigneeId || ''}
                        onChange={(event) => setForm((current) => ({ ...current, assigneeId: Number(event.target.value) }))}
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                      >
                        <option value="" disabled>
                          Chọn người phụ trách
                        </option>
                        {employees.map((employee) => (
                          <option key={employee.id} value={employee.id}>
                            {employee.name} #{employee.id}{employee.position ? ` - ${employee.position}` : ''}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        id="task-assignee"
                        required
                        type="number"
                        min={1}
                        value={form.assigneeId}
                        onChange={(event) => setForm((current) => ({ ...current, assigneeId: Number(event.target.value) }))}
                        error={fieldErrors.assigneeId}
                        helperText={referenceError || 'Nhập ID nhân viên phụ trách task.'}
                      />
                    )}
                    {employees.length > 0 && fieldErrors.assigneeId && <p className="mt-1.5 text-sm text-rose-600">{fieldErrors.assigneeId}</p>}
                    {(employees.length > 0 || projects.length > 0) && referenceError && <p className="mt-1.5 text-xs text-amber-700">{referenceError}</p>}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                  <Link to="/tasks">
                    <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={saving}>
                      Hủy
                    </Button>
                  </Link>
                  <Button type="submit" isLoading={saving}>
                    <Save size={16} />
                    Lưu task
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
