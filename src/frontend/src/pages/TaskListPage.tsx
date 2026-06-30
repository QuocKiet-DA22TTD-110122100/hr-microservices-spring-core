import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, CheckCircle2, Clock3,
  Edit, ListChecks, Plus, Trash2, UserPlus, Zap,
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
import { cn } from '@/utils/cn';
import { PERMISSIONS } from '@/utils/permissions';

// ─── Labels / badge variants ──────────────────────────────────────────────────

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
  LOW: 'bg-slate-300', MEDIUM: 'bg-cyan-500', HIGH: 'bg-amber-500', URGENT: 'bg-rose-500',
};

// ─── Color-coded filter pill styles ───────────────────────────────────────────

const statusActiveStyle: Record<'ALL' | TaskStatus, string> = {
  ALL:         'bg-slate-700 text-white border-slate-700 shadow-sm',
  OPEN:        'bg-sky-600 text-white border-sky-600 shadow-sm',
  IN_PROGRESS: 'bg-amber-500 text-white border-amber-500 shadow-sm',
  COMPLETED:   'bg-emerald-600 text-white border-emerald-600 shadow-sm',
  CANCELLED:   'bg-slate-500 text-white border-slate-500 shadow-sm',
};
const priorityActiveStyle: Record<'ALL' | TaskPriority, string> = {
  ALL:    'bg-slate-700 text-white border-slate-700 shadow-sm',
  LOW:    'bg-slate-500 text-white border-slate-500 shadow-sm',
  MEDIUM: 'bg-cyan-600 text-white border-cyan-600 shadow-sm',
  HIGH:   'bg-amber-600 text-white border-amber-600 shadow-sm',
  URGENT: 'bg-rose-600 text-white border-rose-600 shadow-sm',
};
const IDLE_FILTER =
  'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50';

// ─── Mock data (shown when API returns no tasks) ───────────────────────────────

const MOCK_TASKS: Task[] = [
  {
    id: -1,
    title: 'Thiết kế UI/UX trang Approvals',
    description: 'Xây dựng giao diện và flow phê duyệt cho module HR theo design system hiện tại.',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    projectId: 1,
    assigneeId: 1,
    createdAt: '2026-06-15T08:00:00Z',
    updatedAt: '2026-06-25T10:00:00Z',
  },
  {
    id: -2,
    title: 'Kết nối API endpoint submit/review',
    description: 'Tích hợp các endpoint submit và review vào frontend, xử lý error states.',
    status: 'OPEN',
    priority: 'URGENT',
    projectId: 1,
    assigneeId: 2,
    createdAt: '2026-06-20T09:00:00Z',
    updatedAt: null,
  },
  {
    id: -3,
    title: 'Kiểm thử ma trận phân quyền hệ thống',
    description: 'Viết test case và kiểm thử toàn bộ ma trận RBAC cho các role trong hệ thống.',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    projectId: 2,
    assigneeId: 3,
    createdAt: '2026-06-10T07:00:00Z',
    updatedAt: '2026-06-22T16:00:00Z',
  },
];

const MOCK_PROJECT_NAMES: Record<number, string> = { 1: 'HRM-01', 2: 'Security-02' };
const MOCK_ASSIGNEE_NAMES: Record<number, string> = {
  1: 'Nguyễn Văn A', 2: 'Trần Thị B', 3: 'Lê Hoàng C',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString('vi-VN') : '--';
const pageSizeOptions = [10, 20, 50];

const getProjectDisplay = (task: Task): string =>
  task.id < 0
    ? (MOCK_PROJECT_NAMES[task.projectId] ?? `#${task.projectId}`)
    : `Dự án #${task.projectId}`;

const getAssigneeDisplay = (task: Task): string =>
  task.id < 0
    ? (MOCK_ASSIGNEE_NAMES[task.assigneeId] ?? `#${task.assigneeId}`)
    : `#${task.assigneeId}`;

// ─── Component ────────────────────────────────────────────────────────────────

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
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
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

  const handleStatusUpdate = async (task: Task, newStatus: TaskStatus) => {
    if (task.id < 0) {
      addNotification({ type: 'info', message: 'Đây là dữ liệu mẫu — cập nhật trạng thái không áp dụng được.' });
      return;
    }
    if (!canUpdateTask) return;
    setUpdatingStatusId(task.id);
    try {
      await taskApi.update(task.id, {
        title: task.title,
        description: task.description,
        status: newStatus,
        priority: task.priority,
        assigneeId: task.assigneeId,
        projectId: task.projectId,
      });
      addNotification({ type: 'success', message: 'Đã cập nhật trạng thái task.' });
      await loadTasks();
    } catch {
      addNotification({ type: 'error', message: 'Không thể cập nhật trạng thái.' });
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleAssign = (task: Task) => {
    if (task.id < 0) {
      addNotification({ type: 'info', message: 'Tính năng giao việc sẽ có trong phiên bản tiếp theo.' });
    } else {
      addNotification({ type: 'info', message: '[API endpoint: assign task] đang được phát triển.' });
    }
  };

  // Use mock tasks when API returns empty
  const allTasks = useMemo(
    () => (tasks.length > 0 ? tasks : MOCK_TASKS),
    [tasks]
  );

  const taskStats = useMemo(() => {
    const useMock = tasks.length === 0;
    return [
      {
        label: 'Task mở',
        value: useMock ? 12 : tasks.filter((t) => t.status === 'OPEN').length,
        icon: ListChecks,
        gradient: 'from-cyan-500 to-cyan-700',
        bg: 'bg-cyan-50', text: 'text-cyan-700',
        danger: false,
      },
      {
        label: 'Đang làm',
        value: useMock ? 5 : tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        icon: Clock3,
        gradient: 'from-amber-400 to-amber-600',
        bg: 'bg-amber-50', text: 'text-amber-700',
        danger: false,
      },
      {
        label: 'Hoàn tất',
        value: useMock ? 48 : tasks.filter((t) => t.status === 'COMPLETED').length,
        icon: CheckCircle2,
        gradient: 'from-emerald-500 to-emerald-700',
        bg: 'bg-emerald-50', text: 'text-emerald-700',
        danger: false,
      },
      {
        label: 'Ưu tiên cao',
        value: useMock ? 3 : tasks.filter((t) => t.priority === 'URGENT' || t.priority === 'HIGH').length,
        icon: AlertTriangle,
        gradient: 'from-rose-500 to-rose-700',
        bg: 'bg-rose-100', text: 'text-rose-700',
        danger: true,
      },
    ];
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allTasks.filter((t) => {
      const nameDisplay = getAssigneeDisplay(t).toLowerCase();
      const projectDisplay = getProjectDisplay(t).toLowerCase();
      const matchSearch = !q
        || t.title.toLowerCase().includes(q)
        || String(t.projectId).includes(q)
        || String(t.assigneeId).includes(q)
        || projectDisplay.includes(q)
        || nameDisplay.includes(q);
      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
      const matchPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;
      return matchSearch && matchStatus && matchPriority;
    });
  }, [allTasks, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── h1: Header ────────────────────────────────────────────────────── */}
        <PageHeader
          icon={Zap}
          title="Quản lý tác vụ"
          description="Theo dõi tác vụ theo dự án, người phụ trách, trạng thái và mức ưu tiên."
          actions={
            canCreateTask ? (
              <Link to="/tasks/add">
                <Button className="rounded-xl shadow-sm">
                  <Plus size={16} />
                  Tạo task
                </Button>
              </Link>
            ) : undefined
          }
        />

        {/* ── h2: Stats cards ────────────────────────────────────────────────── */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {taskStats.map((stat, i) => (
            <Card
              key={stat.label}
              className={cn(
                'relative overflow-hidden p-5 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md',
                stat.danger && 'border-rose-200 bg-rose-50/60'
              )}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className={cn(
                    'mt-1 font-display text-3xl font-bold tabular-nums tracking-tight',
                    stat.danger ? 'text-rose-700' : 'text-slate-950'
                  )}>
                    {loading ? '—' : stat.value}
                  </p>
                </div>
                <div className={cn(
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
                  stat.bg, stat.text
                )}>
                  <stat.icon size={20} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* ── h3: Filters ────────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-cyan-700 via-cyan-400 to-slate-200" />
          <div className="flex flex-col gap-4 p-5">
            {/* Search centered with max-width */}
            <div className="mx-auto w-full max-w-2xl">
              <Input
                label="Tìm kiếm"
                placeholder="Tiêu đề, project ID hoặc assignee ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border-slate-200"
              />
            </div>

            {/* Status pills — centered */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Trạng thái:</span>
              {(['ALL', ...Object.keys(statusLabels)] as ('ALL' | TaskStatus)[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[color,background-color,border-color] duration-150',
                    statusFilter === s
                      ? statusActiveStyle[s]
                      : IDLE_FILTER
                  )}
                >
                  {s === 'ALL' ? 'Tất cả' : statusLabels[s]}
                </button>
              ))}
            </div>

            {/* Priority pills — centered */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Ưu tiên:</span>
              {(['ALL', ...Object.keys(priorityLabels)] as ('ALL' | TaskPriority)[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriorityFilter(p)}
                  className={cn(
                    'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-[color,background-color,border-color] duration-150',
                    priorityFilter === p
                      ? priorityActiveStyle[p]
                      : IDLE_FILTER
                  )}
                >
                  {p === 'ALL' ? 'Tất cả' : priorityLabels[p]}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* ── h4: Task list ──────────────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          {loading && (
            <div className="grid gap-3 p-5 md:grid-cols-2">
              {['sk0', 'sk1', 'sk2', 'sk3', 'sk4', 'sk5'].map((key) => (
                <div key={key} className="h-28 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadTasks()}>Thử lại</Button>
            </div>
          )}
          {!loading && !error && pagedTasks.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <Zap size={40} className="text-slate-300" />
              <p className="font-semibold text-slate-600">Không tìm thấy tác vụ nào</p>
              <p className="text-sm text-slate-400">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
          {!loading && !error && pagedTasks.length > 0 && (
            <>
              {/* Desktop: Table layout */}
              <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full">
                  <thead className="border-b border-slate-100 bg-slate-50/80">
                    <tr>
                      {['Tiêu đề tác vụ', 'Dự án', 'Người làm', 'Trạng thái', 'Ưu tiên', 'Thao tác'].map((col) => (
                        <th
                          key={col}
                          className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pagedTasks.map((task, i) => (
                      <tr
                        key={task.id}
                        className="group cursor-pointer transition-colors duration-150 hover:bg-slate-50/80 animate-fade-up"
                        style={{ animationDelay: `${i * 30}ms` }}
                        onClick={() => task.id > 0 && navigate(`/tasks/${task.id}`)}
                      >
                        {/* Title with priority indicator */}
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <div className={cn('mt-1 h-4 w-1 shrink-0 rounded-full', priorityBar[task.priority])} />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 line-clamp-1">{task.title}</p>
                              {task.description && (
                                <p className="mt-0.5 text-xs text-slate-500 line-clamp-1">{task.description}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Project */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                            {getProjectDisplay(task)}
                          </span>
                        </td>

                        {/* Assignee */}
                        <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                          {getAssigneeDisplay(task)}
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge variant={statusVariants[task.status]}>
                            {statusLabels[task.status]}
                          </Badge>
                        </td>

                        {/* Priority */}
                        <td className="whitespace-nowrap px-5 py-4">
                          <Badge variant={priorityVariants[task.priority]}>
                            {priorityLabels[task.priority]}
                          </Badge>
                        </td>

                        {/* Actions */}
                        <td
                          className="whitespace-nowrap px-5 py-4"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-1.5">
                            {/* Update status select */}
                            {canUpdateTask && (
                              <select
                                value={task.status}
                                disabled={updatingStatusId === task.id}
                                onChange={(e) => void handleStatusUpdate(task, e.target.value as TaskStatus)}
                                className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                                title="Cập nhật trạng thái"
                                aria-label="Cập nhật trạng thái"
                              >
                                {Object.entries(statusLabels).map(([v, l]) => (
                                  <option key={v} value={v}>{l}</option>
                                ))}
                              </select>
                            )}

                            {/* Assign button */}
                            <button
                              type="button"
                              onClick={() => handleAssign(task)}
                              className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                              title="Giao việc"
                            >
                              <UserPlus size={13} />
                              <span className="hidden lg:inline">Giao việc</span>
                            </button>

                            {/* Delete icon */}
                            {canDeleteTask && (
                              <button
                                type="button"
                                disabled={deletingId === task.id}
                                onClick={() => task.id > 0 ? setConfirmTarget(task) : addNotification({ type: 'info', message: 'Không thể xóa dữ liệu mẫu.' })}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                                title="Xóa task"
                                aria-label="Xóa task"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile: Card layout */}
              <div className="grid gap-3 p-4 md:hidden">
                {pagedTasks.map((task, i) => (
                  <div
                    key={task.id}
                    className="group relative flex gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md animate-fade-up"
                    style={{ animationDelay: `${i * 35}ms` }}
                  >
                    <div className={cn('w-1 shrink-0', priorityBar[task.priority])} />
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      {/* Title + badges */}
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="text-left font-semibold leading-snug text-slate-900 line-clamp-2"
                          onClick={() => task.id > 0 && navigate(`/tasks/${task.id}`)}
                        >
                          {task.title}
                        </button>
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
                        <span>{getProjectDisplay(task)}</span>
                        <span>{getAssigneeDisplay(task)}</span>
                        <span className="flex items-center gap-1">
                          <CalendarDays size={11} />
                          {formatDate(task.createdAt)}
                        </span>
                      </div>

                      {/* Actions */}
                      <div
                        className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2"
                      >
                        {canUpdateTask && (
                          <select
                            value={task.status}
                            disabled={updatingStatusId === task.id}
                            onChange={(e) => void handleStatusUpdate(task, e.target.value as TaskStatus)}
                            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 transition-colors hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                          >
                            {Object.entries(statusLabels).map(([v, l]) => (
                              <option key={v} value={v}>{l}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={() => handleAssign(task)}
                          className="flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <UserPlus size={13} />
                          Giao việc
                        </button>
                        {canUpdateTask && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => task.id > 0 && navigate(`/tasks/edit/${task.id}`)}
                          >
                            <Edit size={13} />Sửa
                          </Button>
                        )}
                        {canDeleteTask && (
                          <button
                            type="button"
                            disabled={deletingId === task.id}
                            onClick={() => task.id > 0 ? setConfirmTarget(task) : addNotification({ type: 'info', message: 'Không thể xóa dữ liệu mẫu.' })}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-100 text-rose-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
                            title="Xóa"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredTasks.length}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              itemLabel="tác vụ"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmTarget !== null}
        title="Xóa tác vụ"
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
