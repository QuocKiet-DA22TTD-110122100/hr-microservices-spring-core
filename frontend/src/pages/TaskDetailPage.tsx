import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, CalendarClock, Edit, FolderKanban, ListChecks, Target, UserRound } from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { PERMISSIONS } from '@/utils/permissions';

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

const statusVariants: Record<TaskStatus, 'info' | 'warning' | 'success' | 'muted'> = {
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

const statusHints: Record<TaskStatus, string> = {
  OPEN: 'Task đã được tạo và đang chờ xử lý hoặc phân công.',
  IN_PROGRESS: 'Task đang được triển khai, nên theo dõi tiến độ thường xuyên.',
  COMPLETED: 'Task đã hoàn tất và có thể dùng cho báo cáo dự án.',
  CANCELLED: 'Task đã hủy, giữ lại để phục vụ lịch sử thay đổi.',
};

const priorityHints: Record<TaskPriority, string> = {
  LOW: 'Có thể xử lý sau các đầu việc quan trọng hơn.',
  MEDIUM: 'Ưu tiên tiêu chuẩn trong kế hoạch làm việc.',
  HIGH: 'Cần được theo dõi sát để tránh trễ tiến độ.',
  URGENT: 'Cần phản hồi nhanh trong ngày làm việc.',
};

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');
const formatDateTime = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '--');

export const TaskDetailPage = () => {
  const { id } = useParams();
  const { can } = usePermissions();
  const canUpdateTask = can(PERMISSIONS.TASK_UPDATE);
  const taskId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = useCallback(async () => {
    if (!Number.isFinite(taskId)) {
      setError('Mã task không hợp lệ.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      setTask(await taskApi.getById(taskId));
    } catch {
      setError('Không thể tải chi tiết task. Vui lòng kiểm tra gateway và task-service.');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    void loadTask();
  }, [loadTask]);

  const overviewItems = useMemo(() => {
    if (!task) return [];

    return [
      {
        label: 'Trạng thái',
        value: statusLabels[task.status],
        hint: statusHints[task.status],
        icon: Target,
        badge: <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>,
        tone: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Ưu tiên',
        value: priorityLabels[task.priority],
        hint: priorityHints[task.priority],
        icon: AlertCircle,
        badge: <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>,
        tone: 'bg-rose-50 text-rose-700',
      },
      {
        label: 'Project',
        value: `#${task.projectId}`,
        hint: 'Liên kết về dự án chứa task này',
        icon: FolderKanban,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Cập nhật',
        value: formatDate(task.updatedAt || task.createdAt),
        hint: 'Theo dữ liệu Task API',
        icon: CalendarClock,
        tone: 'bg-slate-100 text-slate-700',
      },
    ];
  }, [task]);

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={ListChecks}
          title={task?.title || 'Chi tiết task'}
          description="Theo dõi trạng thái, ưu tiên, người phụ trách và liên kết dự án."
          actions={
            task && (
              <>
                <Link to="/tasks">
                  <Button variant="outline">Quay lại</Button>
                </Link>
                {canUpdateTask && (
                  <Link to={`/tasks/edit/${task.id}`}>
                    <Button>
                      <Edit size={16} />
                      Sửa task
                    </Button>
                  </Link>
                )}
              </>
            )
          }
        />

        {error && (
          <Card className="border-rose-200">
            <EmptyState icon={AlertCircle} title="Có lỗi xảy ra" description={error} action={<Button onClick={loadTask}>Thử lại</Button>} />
          </Card>
        )}

        {loading && (
          <Card>
            <CardContent>
              <div className="h-32 animate-pulse rounded-md bg-slate-100" />
            </CardContent>
          </Card>
        )}

        {!loading && !task && !error && (
          <Card>
            <EmptyState title="Không tìm thấy task" description="Task không tồn tại hoặc đã bị xóa." />
          </Card>
        )}

        {!loading && task && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {overviewItems.map((item) => (
                <Card key={item.label} className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-500">{item.label}</p>
                      <div className="mt-2">{item.badge || <p className="text-2xl font-semibold text-slate-900">{item.value}</p>}</div>
                      <p className="mt-3 text-sm text-slate-500">{item.hint}</p>
                    </div>
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${item.tone}`}>
                      <item.icon size={22} />
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
                      <CardTitle>{task.title}</CardTitle>
                      <CardDescription>
                        Project #{task.projectId} · Assignee #{task.assigneeId}
                      </CardDescription>
                    </div>
                    <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Task ID</dt>
                      <dd className="mt-2 text-sm font-medium text-slate-900">#{task.id}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt>
                      <dd className="mt-2 text-sm text-slate-700">{formatDateTime(task.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Cập nhật</dt>
                      <dd className="mt-2 text-sm text-slate-700">{formatDateTime(task.updatedAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase text-slate-500">Ưu tiên</dt>
                      <dd className="mt-2">
                        <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-5 rounded-md border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Mô tả</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{task.description || 'Chưa có mô tả task.'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Điều hướng</CardTitle>
                  <CardDescription>Mở nhanh các màn hình liên quan.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link to={`/projects/${task.projectId}`} className="block">
                    <Button className="w-full justify-start" variant="outline">
                      <FolderKanban size={16} />
                      Xem dự án
                    </Button>
                  </Link>
                  {canUpdateTask && (
                    <Link to={`/tasks/edit/${task.id}`} className="block">
                      <Button className="w-full justify-start" variant="outline">
                        <Edit size={16} />
                        Cập nhật task
                      </Button>
                    </Link>
                  )}
                  <div className="rounded-md border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">Người phụ trách</p>
                        <p className="text-sm text-slate-500">Employee #{task.assigneeId}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
};
