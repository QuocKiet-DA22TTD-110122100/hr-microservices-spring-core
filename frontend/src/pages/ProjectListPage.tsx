import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Edit, FolderKanban, Plus, Trash2 } from 'lucide-react';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { Column } from '@/components/UI/Table';
import { Project, ProjectStatus } from '@/types/project';

interface ProjectRow extends Project {
  memberCount: number;
  taskCount: number;
}

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn tất',
  ARCHIVED: 'Lưu trữ',
};

const statusVariants: Record<ProjectStatus, 'success' | 'warning' | 'info' | 'muted'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  COMPLETED: 'info',
  ARCHIVED: 'muted',
};

const pageSizeOptions = [10, 20, 50];

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

export const ProjectListPage = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
  const [sortKey, setSortKey] = useState<keyof ProjectRow>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const projectList = await projectApi.getAll();
      const rows = await Promise.all(
        projectList.map(async (project) => {
          const [assignments, tasks] = await Promise.all([
            projectApi.getAssignments(project.id),
            taskApi.getByProject(project.id),
          ]);

          return {
            ...project,
            memberCount: assignments.filter((assignment) => assignment.active).length,
            taskCount: tasks.length,
          };
        })
      );

      setProjects(rows);
    } catch {
      setError('Không thể tải danh sách dự án. Vui lòng kiểm tra gateway và project-service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, pageSize]);

  const handleSort = (key: keyof ProjectRow) => {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
  };

  const filteredProjects = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return projects
      .filter((project) => {
        const matchesSearch =
          !normalizedSearch ||
          project.name.toLowerCase().includes(normalizedSearch) ||
          String(project.leadId).includes(normalizedSearch);
        const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;

        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const first = a[sortKey];
        const second = b[sortKey];
        const compare = String(first ?? '').localeCompare(String(second ?? ''), 'vi', { numeric: true });

        return sortDirection === 'asc' ? compare : -compare;
      });
  }, [projects, search, sortDirection, sortKey, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (project: ProjectRow) => {
    if (!window.confirm(`Xóa dự án "${project.name}"?`)) return;

    try {
      await projectApi.remove(project.id);
      await loadProjects();
    } catch {
      setError('Không thể xóa dự án. Vui lòng thử lại.');
    }
  };

  const columns: Column<ProjectRow>[] = [
    {
      key: 'name',
      title: 'Dự án',
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
    { key: 'leadId', title: 'Lead ID', sortable: true, onSort: handleSort },
    { key: 'memberCount', title: 'Thành viên', sortable: true, onSort: handleSort },
    { key: 'taskCount', title: 'Task', sortable: true, onSort: handleSort },
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
          <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/projects/edit/${record.id}`)}>
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
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
      <Input
        label="Tìm kiếm"
        placeholder="Tên dự án hoặc lead ID"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <div>
        <label htmlFor="project-status-filter" className="mb-1 block text-sm font-medium text-slate-700">
          Trạng thái
        </label>
        <select
          id="project-status-filter"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as 'ALL' | ProjectStatus)}
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
    </div>
  );

  return (
    <DataListPage
      icon={FolderKanban}
      title="Quản lý dự án"
      description="Theo dõi danh sách dự án, lead, thành viên và số lượng task theo từng dự án."
      actions={
        <Link to="/projects/add">
          <Button>
            <Plus size={16} />
            Tạo dự án
          </Button>
        </Link>
      }
      filters={filters}
      columns={columns}
      data={pagedProjects}
      loading={loading}
      error={error}
      onRetry={loadProjects}
      onRowClick={(project) => navigate(`/projects/${project.id}`)}
      pagination={{
        currentPage: page,
        totalPages,
        totalItems: filteredProjects.length,
        pageSize,
        pageSizeOptions,
        itemLabel: 'dự án',
        onPageChange: setPage,
        onPageSizeChange: setPageSize,
      }}
    />
  );
};
