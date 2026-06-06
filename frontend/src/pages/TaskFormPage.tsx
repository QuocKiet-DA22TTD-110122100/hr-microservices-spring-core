import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertCircle, ListChecks, Save } from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
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
    setSaving(true);
    setError(null);

    try {
      const payload: TaskRequest = {
        ...form,
        title: form.title.trim(),
        description: form.description?.trim() || null,
        assigneeId: Number(form.assigneeId),
        projectId: Number(form.projectId),
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
          description="Form sử dụng contract TaskRequest: title, description, status, priority, assigneeId, projectId."
          actions={
            <Link to="/tasks">
              <Button variant="outline">Hủy</Button>
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
                />

                <div>
                  <label htmlFor="task-description" className="mb-1 block text-sm font-medium text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    id="task-description"
                    value={form.description || ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="task-status" className="mb-1 block text-sm font-medium text-slate-700">
                      Trạng thái
                    </label>
                    <select
                      id="task-status"
                      value={form.status || 'OPEN'}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as TaskStatus }))}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="task-priority" className="mb-1 block text-sm font-medium text-slate-700">
                      Ưu tiên
                    </label>
                    <select
                      id="task-priority"
                      value={form.priority || 'MEDIUM'}
                      onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {Object.entries(priorityLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Project ID"
                    required
                    type="number"
                    min={1}
                    value={form.projectId}
                    onChange={(event) => setForm((current) => ({ ...current, projectId: Number(event.target.value) }))}
                  />

                  <Input
                    label="Assignee ID"
                    required
                    type="number"
                    min={1}
                    value={form.assigneeId}
                    onChange={(event) => setForm((current) => ({ ...current, assigneeId: Number(event.target.value) }))}
                  />
                </div>

                <div className="flex justify-end">
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
