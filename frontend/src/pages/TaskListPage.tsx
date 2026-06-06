import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, ListChecks, Plus, Trash2 } from 'lucide-react';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { Column } from '@/components/UI/Table';
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

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

export const TaskListPage = () => {
  const navigate = useNavigate();
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
    { key: 'projectId', title: 'Project ID', sortable: true, onSort: handleSort },
    { key: 'assigneeId', title: 'Assignee ID', sortable: true, onSort: handleSort },
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
      render: (_value, record) => (
        <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/tasks/edit/${record.id}`)}>
            <Edit size={14} />
            Sửa
          </Button>
          <Button type="button" variant="danger" size="sm" onClick={() => void handleDelete(record)}>
            <Trash2 size={14} />
            Xóa
          </Button>
        </div>
      ),
    },
  ];

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
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
      icon={ListChecks}
      title="Quản lý task"
      description="Theo dõi task theo dự án, người phụ trách, trạng thái và mức ưu tiên."
      actions={
        <Link to="/tasks/add">
          <Button>
            <Plus size={16} />
            Tạo task
          </Button>
        </Link>
      }
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
