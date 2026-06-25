import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3,
  Edit, ListChecks, Plus, Trash2, Zap
} from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { ConfirmModal } from '@/components/UI/ConfirmModal';
import { TablePagination } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { PageHeader } from '@/components/UI/PageHeader';
import { MainLayout } from '@/components/Layout/MainLayout';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/uiStore';
import { Task, TaskPriority, TaskStatus } from '@/types/task';
import { PERMISSIONS } from '@/utils/permissions';

const statusLabels: Record<TaskStatus, string> = {
  OPEN: 'Mở', IN_PROGRESS: 'Đang làm', COMPLETED: 'Hoàn tất', CANCELLED: 'Đã hủy',
};
const priorityLabels: Record<TaskPriority, string> = {
  LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao', URGENT: 'Khẩn cấp',
};
const statusVariants: Record<TaskStatus, 'info' | 'warning' | 'success' | 'muted'> = {
  OPEN: 'info', IN_PROGRESS: 'warning', COMPLETED: 'success', CANCELLED: 'muted',
};
const priorityVariants: Record<TaskPriority, 'muted' | 'info' | 'warning' | 'danger'> = {
  LOW: 'muted', MEDIUM: 'info', HIGH: 'warning', URGENT: 'danger',
};

const priorityBar: Record<TaskPriority, string> = {
  LOW:    'bg-slate-300',
  MEDIUM: 'bg-cyan-500',
  HIGH:   'bg-amber-500',
  URGENT: 'bg-rose-500',
};

const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString('vi-VN') : '--';
const pageSizeOptions = [10, 20, 50];

const ACTIVE_FILTER =
  'bg-cyan-600 text-white border-cyan-600 shadow-sm';
const IDLE_FILTER =
  'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50';

export const TaskListPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { addNotification } = useUIStore();
  const canCreateTask = can(PERMISSIONS.TASK_CREATE);
  const canUpdateTask = can(PERMISSIONS.TASK_UPDATE);
  const canDeleteTask = can(PERMISSIONS.TASK_DELETE);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<Task | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await taskApi.getAll());
    } catch {
      setError('Không thể tải danh sách task. Vui lòng kiểm tra gateway và task-service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadTasks(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, priorityFilter, pageSize]);

  const handleDeleteConfirm = async () => {
    if (!confirmTarget) return;
    setDeletingId(confirmTarget.id);
    try {
      await taskApi.remove(confirmTarget.id);
      setConfirmTarget(null);
      addNotification({ type: 'success', message: `Đã xóa task "${confirmTarget.title}".` });
      await loadTasks();
    } catch {
      addNotification({ type: 'error', message: 'Không thể xóa task. Vui lòng thử lại.' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      const matchSearch = !q || t.title.toLowerCase().includes(q) ||
        String(t.projectId).includes(q) || String(t.assigneeId).includes(q);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const taskStats = useMemo(() => [
    {
      label: 'Task mở',     value: tasks.filter((t) => t.status === 'OPEN').length,
      icon: ListChecks,     gradient: 'from-cyan-600 to-teal-500',    bg: 'bg-cyan-50',     text: 'text-cyan-700',
    },
    {
      label: 'Đang làm',   value: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      icon: Clock3,         gradient: 'from-amber-500 to-orange-400', bg: 'bg-amber-50',    text: 'text-amber-700',
    },
    {
      label: 'Hoàn tất',   value: tasks.filter((t) => t.status === 'COMPLETED').length,
      icon: CheckCircle2,   gradient: 'from-emerald-600 to-green-500',bg: 'bg-emerald-50',  text: 'text-emerald-700',
    },
    {
      label: 'Ưu tiên cao', value: tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
      icon: AlertTriangle,  gradient: 'from-rose-600 to-red-500',     bg: 'bg-rose-50',     text: 'text-rose-700',
    },
  ], [tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          icon={Zap}
          title="Quản lý task"
          description="Theo dõi task theo dự án, người phụ trách, trạng thái và mức ưu tiên."
          actions={
            canCreateTask ? (
              <Link to="/tasks/add">
                <Button><Plus size={16} />Tạo task</Button>
              </Link>
            ) : (
              <Button disabled title="Bạn không có quyền tạo task">
                <Plus size={16} />Tạo task
              </Button>
            )
          }
        />

        {/* Stats bar */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {taskStats.map((stat, i) => (
            <Card key={stat.label} className="relative overflow-hidden p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
                    {loading ? '—' : stat.value}
                  </p>
                </div>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
                  <stat.icon size={20} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Filters */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-700 via-cyan-400 to-slate-200" />
          <div className="space-y-4 p-5">
            <Input
              label="Tìm kiếm"
              placeholder="Tiêu đề, project ID hoặc assignee ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-medium text-slate-500 mr-1">Trạng thái:</span>
              {(['ALL', ...Object.keys(statusLabels)] as ('ALL' | TaskStatus)[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    statusFilter === s ? ACTIVE_FILTER : IDLE_FILTER
                  }`}
                >
                  {s === 'ALL' ? 'Tất cả' : statusLabels[s as TaskStatus]}
                </button>
              ))}
            </div>
            {/* Priority pills */}
            <div className="flex flex-wrap gap-2">
              <span className="self-center text-xs font-medium text-slate-500 mr-1">Ưu tiên:</span>
              {(['ALL', ...Object.keys(priorityLabels)] as ('ALL' | TaskPriority)[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                    priorityFilter === p ? ACTIVE_FILTER : IDLE_FILTER
                  }`}
                >
                  {p === 'ALL' ? 'Tất cả' : priorityLabels[p as TaskPriority]}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Task cards */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadTasks()}>Thử lại</Button>
            </div>
          ) : pagedTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Zap size={40} className="text-slate-300" />
              <p className="text-sm text-slate-500">Không có task nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {pagedTasks.map((task, i) => (
                <div
                  key={task.id}
                  className="group relative flex gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up"
                  style={{ animationDelay: `${i * 35}ms` }}
                  onClick={() => navigate(`/tasks/${task.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/tasks/${task.id}`)}
                  aria-label={`Xem task ${task.title}`}
                >
                  {/* Priority bar bên trái */}
                  <div className={`w-1 shrink-0 ${priorityBar[task.priority]}`} />

                  <div className="flex flex-1 flex-col gap-2 p-4">
                    {/* Title + badges */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-slate-900 leading-snug line-clamp-2">{task.title}</p>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant={priorityVariants[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                        <Badge variant={statusVariants[task.status]}>
                          {statusLabels[task.status]}
                        </Badge>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>Dự án #{task.projectId}</span>
                      <span>Người làm #{task.assigneeId}</span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={11} />
                        {formatDate(task.createdAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    {(canUpdateTask || canDeleteTask) && (
                      <div
                        role="group"
                        aria-label="Thao tác task"
                        className="flex items-center gap-2 border-t border-slate-100 pt-2"
                      >
                        {canUpdateTask && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => { e.stopPropagation(); navigate(`/tasks/edit/${task.id}`); }}
                          >
                            <Edit size={13} />Sửa
                          </Button>
                        )}
                        {canDeleteTask && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            disabled={deletingId === task.id}
                            isLoading={deletingId === task.id}
                            onClick={(e) => { e.stopPropagation(); setConfirmTarget(task); }}
                          >
                            <Trash2 size={13} />Xóa
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredTasks.length}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              itemLabel="task"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmTarget !== null}
        title="Xóa task"
        message={`Bạn có chắc muốn xóa task "${confirmTarget?.title}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa task"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setConfirmTarget(null)}
      />
    </MainLayout>
  );
};
