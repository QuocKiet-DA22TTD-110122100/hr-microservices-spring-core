import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Edit, ListChecks, Plus, Trash2, Zap } from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { Column } from '@/components/UI/Table';
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

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

export const TaskListPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCreateTask = can(PERMISSIONS.TASK_CREATE);
  const canUpdateTask = can(PERMISSIONS.TASK_UPDATE);
  const canDeleteTask = can(PERMISSIONS.TASK_DELETE);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TaskStatus>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');
  const [sortKey, setSortKey] = useState<keyof Task>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
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

  useEffect(() => {
    void loadTasks();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [priorityFilter, search, statusFilter, pageSize]);

  const handleSort = (key: keyof Task) => {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
  };

  const filteredTasks = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return tasks
      .filter((task) => {
        const matchesSearch =
          !normalizedSearch ||
          task.title.toLowerCase().includes(normalizedSearch) ||
          String(task.projectId).includes(normalizedSearch) ||
          String(task.assigneeId).includes(normalizedSearch);
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
        const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        const first = a[sortKey];
        const second = b[sortKey];
        const compare = String(first ?? '').localeCompare(String(second ?? ''), 'vi', { numeric: true });

        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [priorityFilter, search, sortDirection, sortKey, statusFilter, tasks]);

  const taskStats = useMemo(() => {
    const openTasks = tasks.filter((task) => task.status === 'OPEN').length;
    const inProgressTasks = tasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const completedTasks = tasks.filter((task) => task.status === 'COMPLETED').length;
    const urgentTasks = tasks.filter((task) => task.priority === 'URGENT' || task.priority === 'HIGH').length;

    return [
      {
        label: 'Task mở',
        value: openTasks.toString(),
        hint: 'Chờ nhận hoặc phân công',
        icon: ListChecks,
        tone: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Đang làm',
        value: inProgressTasks.toString(),
        hint: 'Cần theo dõi tiến độ',
        icon: Clock3,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Hoàn tất',
        value: completedTasks.toString(),
        hint: 'Có thể dùng cho báo cáo sprint',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Ưu tiên cao',
        value: urgentTasks.toString(),
        hint: 'Nên xử lý trước trong ngày',
        icon: AlertTriangle,
        tone: 'bg-rose-50 text-rose-700',
      },
    ];
  }, [tasks]);

  const totalPages = Math.max(1, Math.ceil(filteredTasks.length / pageSize));
  const pagedTasks = filteredTasks.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (task: Task) => {
    if (!window.confirm(`Xóa task "${task.title}"?`)) return;

    try {
      await taskApi.remove(task.id);
      await loadTasks();
    } catch {
      setError('Không thể xóa task. Vui lòng thử lại.');
    }
  };

  const columns: Column<Task>[] = [
    {
      key: 'title',
      title: 'Task',
      sortable: true,
      onSort: handleSort,
      render: (value, record) => (
        <div>
          <p className="font-medium text-slate-900">{value}</p>
          <p className="mt-1 max-w-md truncate text-xs text-slate-500">{record.description || 'Chưa có mô tả'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      sortable: true,
      onSort: handleSort,
      render: (value) => <Badge variant={statusVariants[value]}>{statusLabels[value]}</Badge>,
    },
    {
      key: 'priority',
      title: 'Ưu tiên',
      sortable: true,
      onSort: handleSort,
      render: (value) => <Badge variant={priorityVariants[value]}>{priorityLabels[value]}</Badge>,
    },
    { key: 'projectId', title: 'Project ID', sortable: true, onSort: handleSort, render: (value) => <span>#{value}</span> },
    { key: 'assigneeId', title: 'Assignee ID', sortable: true, onSort: handleSort, render: (value) => <span>#{value}</span> },
    {
      key: 'createdAt',
      title: 'Ngày tạo',
      sortable: true,
      onSort: handleSort,
      render: (value) => formatDate(value),
    },
    {
      key: 'id',
      title: 'Thao tác',
      render: (_value, record) => {
        if (!canUpdateTask && !canDeleteTask) {
          return <span className="text-sm text-slate-500">Chỉ xem</span>;
        }

        return (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            {canUpdateTask && (
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/tasks/edit/${record.id}`)}>
                <Edit size={14} />
                Sửa
              </Button>
            )}
            {canDeleteTask && (
              <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(record)}>
                <Trash2 size={14} />
                Xóa
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const summary = (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {taskStats.map((stat) => (
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
  );

  const filters = (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_200px_200px]">
      <Input
        label="Tìm kiếm"
        placeholder="Tiêu đề, project ID hoặc assignee ID"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div>
        <label htmlFor="task-status-filter" className="mb-1 block text-sm font-medium text-slate-700">
          Trạng thái
        </label>
        <select
          id="task-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'ALL' | TaskStatus)}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="ALL">Tất cả</option>
          {Object.entries(statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="task-priority-filter" className="mb-1 block text-sm font-medium text-slate-700">
          Ưu tiên
        </label>
        <select
          id="task-priority-filter"
          value={priorityFilter}
          onChange={(event) => setPriorityFilter(event.target.value as 'ALL' | TaskPriority)}
          className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="ALL">Tất cả</option>
          {Object.entries(priorityLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  return (
    <DataListPage
      icon={Zap}
      title="Quản lý task"
      description="Theo dõi task theo dự án, người phụ trách, trạng thái và mức ưu tiên."
      actions={canCreateTask ? (
        <Link to="/tasks/add">
          <Button>
            <Plus size={16} />
            Tạo task
          </Button>
        </Link>
      ) : undefined}
      summary={summary}
      filters={filters}
      columns={columns}
      data={pagedTasks}
      loading={loading}
      error={error}
      onRetry={loadTasks}
      onRowClick={(task) => navigate(`/tasks/${task.id}`)}
      pagination={{
        currentPage: page,
        totalPages,
        totalItems: filteredTasks.length,
        pageSize,
        pageSizeOptions,
        itemLabel: 'task',
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
    />
  );
};
