import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive, CalendarDays, CheckCircle2, Edit, FolderKanban,
  PauseCircle, Plus, Trash2, Users
} from 'lucide-react';
import { projectApi } from '@/api/project.api';
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

const statusBorder: Record<ProjectStatus, string> = {
  ACTIVE:    'border-l-emerald-500',
  PAUSED:    'border-l-amber-400',
  COMPLETED: 'border-l-cyan-500',
  ARCHIVED:  'border-l-slate-400',
};

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '--';

const pageSizeOptions = [10, 20, 50];

export const ProjectListPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { addNotification } = useUIStore();
  const canCreateProject = can(PERMISSIONS.PROJECT_CREATE);
  const canUpdateProject = can(PERMISSIONS.PROJECT_UPDATE);
  const canDeleteProject = can(PERMISSIONS.PROJECT_DELETE);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<ProjectRow | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ProjectStatus>('ALL');
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
            memberCount: assignments.filter((a) => a.active).length,
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

  useEffect(() => { void loadProjects(); }, []);
  useEffect(() => { setPage(1); }, [search, statusFilter, pageSize]);

  const handleDeleteConfirm = async () => {
    if (!confirmTarget) return;
    setDeletingId(confirmTarget.id);
    try {
      await projectApi.remove(confirmTarget.id);
      setConfirmTarget(null);
      addNotification({ type: 'success', message: `Đã xóa dự án "${confirmTarget.name}".` });
      await loadProjects();
    } catch {
      addNotification({ type: 'error', message: 'Không thể xóa dự án. Vui lòng thử lại.' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || String(p.leadId).includes(q);
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const projectStats = useMemo(() => [
    {
      label: 'Đang chạy',    value: projects.filter((p) => p.status === 'ACTIVE').length,
      icon: FolderKanban,    gradient: 'from-cyan-600 to-teal-500',    text: 'text-cyan-700',   bg: 'bg-cyan-50',
    },
    {
      label: 'Tạm dừng',     value: projects.filter((p) => p.status === 'PAUSED').length,
      icon: PauseCircle,     gradient: 'from-amber-500 to-orange-400', text: 'text-amber-700',  bg: 'bg-amber-50',
    },
    {
      label: 'Hoàn tất',     value: projects.filter((p) => p.status === 'COMPLETED').length,
      icon: CheckCircle2,    gradient: 'from-emerald-600 to-green-500',text: 'text-emerald-700',bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng thành viên active', value: projects.reduce((s, p) => s + p.memberCount, 0),
      icon: Users,           gradient: 'from-slate-600 to-slate-500',  text: 'text-slate-700',  bg: 'bg-slate-100',
    },
  ], [projects]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          icon={Archive}
          title="Quản lý dự án"
          description="Theo dõi tiến độ, thành viên và task theo từng dự án."
          actions={
            canCreateProject ? (
              <Link to="/projects/add">
                <Button><Plus size={16} />Tạo dự án</Button>
              </Link>
            ) : (
              <Button disabled title="Bạn không có quyền tạo dự án">
                <Plus size={16} />Tạo dự án
              </Button>
            )
          }
        />

        {/* Stats bar */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {projectStats.map((stat, i) => (
            <Card
              key={stat.label}
              className="relative overflow-hidden p-5"
              style={{ animationDelay: `${i * 60}ms` }}
            >
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
          <div className="grid gap-4 p-5 md:grid-cols-[minmax(0,1fr)_200px]">
            <Input
              label="Tìm kiếm"
              placeholder="Tên dự án hoặc lead ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div>
              <label htmlFor="status-filter" className="mb-1 block text-sm font-medium text-slate-700">
                Trạng thái
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'ALL' | ProjectStatus)}
                className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="ALL">Tất cả</option>
                {(Object.entries(statusLabels) as [ProjectStatus, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Project card grid */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-lg bg-slate-100" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-rose-600">{error}</p>
              <Button variant="outline" size="sm" onClick={() => void loadProjects()}>Thử lại</Button>
            </div>
          ) : pagedProjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <FolderKanban size={40} className="text-slate-300" />
              <p className="text-sm text-slate-500">Không có dự án nào phù hợp.</p>
            </div>
          ) : (
            <div className="grid gap-4 p-5 md:grid-cols-2">
              {pagedProjects.map((project, i) => (
                <div
                  key={project.id}
                  className={`
                    group relative flex flex-col gap-3 overflow-hidden rounded-xl border border-slate-200
                    border-l-4 ${statusBorder[project.status]} bg-white p-5 shadow-sm
                    cursor-pointer transition-all duration-200
                    hover:-translate-y-0.5 hover:shadow-md hover:border-slate-300
                    animate-fade-up
                  `}
                  style={{ animationDelay: `${i * 40}ms` }}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}`)}
                  aria-label={`Xem dự án ${project.name}`}
                >
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{project.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                        {project.description || 'Chưa có mô tả'}
                      </p>
                    </div>
                    <Badge variant={statusVariants[project.status]} className="shrink-0">
                      {statusLabels[project.status]}
                    </Badge>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users size={13} />
                      {project.memberCount} thành viên
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      {project.taskCount} task
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarDays size={13} />
                      {formatDate(project.createdAt)}
                    </span>
                  </div>

                  {/* Actions */}
                  {(canUpdateProject || canDeleteProject) && (
                    <div
                      role="group"
                      aria-label="Thao tác dự án"
                      className="flex items-center gap-2 border-t border-slate-100 pt-3"
                    >
                      {canUpdateProject && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => { e.stopPropagation(); navigate(`/projects/edit/${project.id}`); }}
                        >
                          <Edit size={13} />Sửa
                        </Button>
                      )}
                      {canDeleteProject && (
                        <Button
                          type="button"
                          variant="danger"
                          size="sm"
                          disabled={deletingId === project.id}
                          isLoading={deletingId === project.id}
                          onClick={(e) => { e.stopPropagation(); setConfirmTarget(project); }}
                        >
                          <Trash2 size={13} />Xóa
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!loading && !error && (
            <TablePagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={filteredProjects.length}
              pageSize={pageSize}
              pageSizeOptions={pageSizeOptions}
              itemLabel="dự án"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmTarget !== null}
        title="Xóa dự án"
        message={`Bạn có chắc muốn xóa dự án "${confirmTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa dự án"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setConfirmTarget(null)}
      />
    </MainLayout>
  );
};
