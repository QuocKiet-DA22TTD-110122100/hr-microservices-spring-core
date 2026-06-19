import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Archive, CheckCircle2, Edit, FolderKanban, PauseCircle, Plus, Trash2, Users } from 'lucide-react';
import { projectApi } from '@/api/project.api';
import { taskApi } from '@/api/task.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { Column } from '@/components/UI/Table';
import { usePermissions } from '@/hooks/usePermissions';
import { Project, ProjectStatus } from '@/types/project';
import { PERMISSIONS } from '@/utils/permissions';

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
  const { can } = usePermissions();
  const canCreateProject = can(PERMISSIONS.PROJECT_CREATE);
  const canUpdateProject = can(PERMISSIONS.PROJECT_UPDATE);
  const canDeleteProject = can(PERMISSIONS.PROJECT_DELETE);
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

  const projectStats = useMemo(() => {
    const activeProjects = projects.filter((project) => project.status === 'ACTIVE').length;
    const pausedProjects = projects.filter((project) => project.status === 'PAUSED').length;
    const completedProjects = projects.filter((project) => project.status === 'COMPLETED').length;
    const totalMembers = projects.reduce((sum, project) => sum + project.memberCount, 0);

    return [
      {
        label: 'Dự án đang chạy',
        value: activeProjects.toString(),
        hint: 'Cần theo dõi tiến độ hằng ngày',
        icon: FolderKanban,
        tone: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Tạm dừng',
        value: pausedProjects.toString(),
        hint: 'Cần quyết định tiếp tục hoặc đóng',
        icon: PauseCircle,
        tone: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Hoàn tất',
        value: completedProjects.toString(),
        hint: 'Có thể dùng cho báo cáo năng suất',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Thành viên active',
        value: totalMembers.toString(),
        hint: 'Tổng phân bổ đang hoạt động',
        icon: Users,
        tone: 'bg-slate-100 text-slate-700',
      },
    ];
  }, [projects]);

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
    { key: 'leadId', title: 'Lead ID', sortable: true, onSort: handleSort, render: (value) => <span>#{value}</span> },
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
      render: (_value, record) => {
        if (!canUpdateProject && !canDeleteProject) {
          return <span className="text-sm text-slate-500">Chỉ xem</span>;
        }

        return (
          <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
            {canUpdateProject && (
              <Button type="button" variant="outline" size="sm" onClick={() => navigate(`/projects/edit/${record.id}`)}>
                <Edit size={14} />
                Sửa
              </Button>
            )}
            {canDeleteProject && (
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
      {projectStats.map((stat) => (
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
    </div>
  );

  return (
    <DataListPage
      icon={Archive}
      title="Quản lý dự án"
      description="Theo dõi dự án, lead, thành viên và số lượng task theo từng dự án."
      actions={canCreateProject ? (
        <Link to="/projects/add">
          <Button>
            <Plus size={16} />
            Tạo dự án
          </Button>
        </Link>
      ) : undefined}
      summary={summary}
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
