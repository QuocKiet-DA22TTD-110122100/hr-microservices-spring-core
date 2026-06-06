import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AlertCircle, Edit, ListChecks } from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { Task, TaskPriority, TaskStatus } from '@/types/task';

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

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleString('vi-VN') : '--');

export const TaskDetailPage = () => {
  const { id } = useParams();
  const taskId = Number(id);
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTask = async () => {
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
      setError('Không thể tải chi tiết task.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTask();
  }, [taskId]);

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={ListChecks}
          title={task?.title || 'Chi tiết task'}
          description="Thông tin task theo contract Task API."
          actions={
            task && (
              <>
                <Link to="/tasks">
                  <Button variant="outline">Quay lại</Button>
                </Link>
                <Link to={`/tasks/edit/${task.id}`}>
                  <Button>
                    <Edit size={16} />
                    Sửa task
                  </Button>
                </Link>
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
              <div className="h-24 animate-pulse rounded bg-slate-100" />
            </CardContent>
          </Card>
        )}

        {!loading && !task && !error && (
          <Card>
            <EmptyState title="Không tìm thấy task" description="Task không tồn tại hoặc đã bị xóa." />
          </Card>
        )}

        {!loading && task && (
          <Card>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
              <CardDescription>Project #{task.projectId} · Assignee #{task.assigneeId}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Trạng thái</dt>
                  <dd className="mt-2">
                    <Badge variant={statusVariants[task.status]}>{statusLabels[task.status]}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Ưu tiên</dt>
                  <dd className="mt-2">
                    <Badge variant={priorityVariants[task.priority]}>{priorityLabels[task.priority]}</Badge>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Ngày tạo</dt>
                  <dd className="mt-2 text-sm text-slate-700">{formatDate(task.createdAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">Cập nhật</dt>
                  <dd className="mt-2 text-sm text-slate-700">{formatDate(task.updatedAt)}</dd>
                </div>
              </dl>
              <p className="mt-5 text-sm leading-6 text-slate-600">{task.description || 'Chưa có mô tả task.'}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
