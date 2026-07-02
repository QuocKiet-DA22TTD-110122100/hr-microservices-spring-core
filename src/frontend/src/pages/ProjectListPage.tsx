import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Archive, CalendarDays, CheckCircle2, Edit,
  FolderKanban, PauseCircle, Plus, Trash2, Users,
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
import { Task } from '@/types/task';
import { PERMISSIONS } from '@/utils/permissions';
import { cn } from '@/utils/cn';

/* ─── types ──────────────────────────────────────────────────── */

interface ProjectRow extends Project {
  memberCount: number;
  taskCount: number;
  completedTaskCount: number;
}

/* ─── label / colour maps ────────────────────────────────────── */

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: 'Đang chạy', PAUSED: 'Tạm dừng', COMPLETED: 'Hoàn tất', ARCHIVED: 'Lưu trữ',
};
const statusVariants: Record<ProjectStatus, 'success' | 'warning' | 'info' | 'muted'> = {
  ACTIVE: 'success', PAUSED: 'warning', COMPLETED: 'info', ARCHIVED: 'muted',
};

const formatDate = (v?: string | null) => v ? new Date(v).toLocaleDateString('vi-VN') : '--';

const pageSizeOptions = [10, 20, 50];

/* ─── SVG Vertical Bar Chart ─────────────────────────────────── */

interface BarDatum { label: string; value: number; color: string; sublabel?: string }

const VBarChart = ({ data, title, subtitle }: { data: BarDatum[]; title: string; subtitle?: string }) => {
  const W = 360; const H = 160; const PB = 28; const PT = 18; const PL = 28; const PR = 8;
  const innerW = W - PL - PR;
  const innerH = H - PB - PT;
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.floor(innerW / data.length);
  const barGap = Math.max(6, Math.floor(barW * 0.22));
  const gridCounts = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {/* Y grid */}
        {gridCounts.map(t => {
          const y = PT + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              {t > 0 && (
                <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
                  {Math.round(max * t)}
                </text>
              )}
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const bh = (d.value / max) * innerH;
          const bx = PL + i * barW + barGap / 2;
          const bw = barW - barGap;
          const by = PT + innerH - bh;
          return (
            <g key={d.label}>
              <rect x={bx} y={by} width={bw} height={bh} rx="3" fill={d.color} opacity="0.9" />
              {d.value > 0 && (
                <text x={bx + bw / 2} y={by - 3} textAnchor="middle" fontSize="7.5" fontWeight="600" fill="#475569">
                  {d.value}
                </text>
              )}
              <text x={bx + bw / 2} y={H - 6} textAnchor="middle" fontSize="7" fill="#94a3b8">
                {d.sublabel ?? d.label}
              </text>
            </g>
          );
        })}
        {/* Y axis */}
        <line x1={PL} y1={PT} x2={PL} y2={PT + innerH} stroke="#e2e8f0" strokeWidth="1" />
      </svg>
    </div>
  );
};

/* ─── SVG Line / Area Chart ──────────────────────────────────── */

interface LineDatum { label: string; value: number }

const LineAreaChart = ({ data, title, subtitle, color = '#06b6d4' }: {
  data: LineDatum[]; title: string; subtitle?: string; color?: string;
}) => {
  const W = 360; const H = 160; const PB = 28; const PT = 18; const PL = 30; const PR = 8;
  const innerW = W - PL - PR; const innerH = H - PB - PT;
  const max = Math.max(...data.map(d => d.value), 1);
  const pts = data.map((d, i) => ({
    x: PL + (i / Math.max(data.length - 1, 1)) * innerW,
    y: PT + innerH * (1 - d.value / max),
    ...d,
  }));
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = pts.length > 0
    ? `${linePath} L${pts[pts.length - 1].x},${PT + innerH} L${pts[0].x},${PT + innerH} Z`
    : '';

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-semibold text-slate-700">{title}</p>
      {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: H }}>
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PT + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              {t > 0 && (
                <text x={PL - 4} y={y + 3} textAnchor="end" fontSize="7" fill="#94a3b8">
                  {Math.round(max * t)}%
                </text>
              )}
            </g>
          );
        })}
        {areaPath && <path d={areaPath} fill={color} fillOpacity="0.12" />}
        {linePath && <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {pts.map(p => (
          <g key={p.label}>
            <circle cx={p.x} cy={p.y} r="3.5" fill="white" stroke={color} strokeWidth="2" />
            <text x={p.x} y={H - 6} textAnchor="middle" fontSize="6.5" fill="#94a3b8">
              {p.label.length > 8 ? p.label.slice(0, 7) + '…' : p.label}
            </text>
            <text x={p.x} y={p.y - 7} textAnchor="middle" fontSize="7" fontWeight="600" fill="#475569">
              {p.value}%
            </text>
          </g>
        ))}
        <line x1={PL} y1={PT} x2={PL} y2={PT + innerH} stroke="#e2e8f0" strokeWidth="1" />
      </svg>
    </div>
  );
};

/* ─── Horizontal bar list ────────────────────────────────────── */

const HorizBarList = ({ data, title, subtitle, color = 'bg-cyan-500' }: {
  data: { label: string; value: number; sub?: string }[];
  title: string; subtitle?: string; color?: string;
}) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex flex-col gap-2">
      <div>
        <p className="text-xs font-semibold text-slate-700">{title}</p>
        {subtitle && <p className="text-[11px] text-slate-400">{subtitle}</p>}
      </div>
      <div className="space-y-2.5">
        {data.map(d => (
          <div key={d.label} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="max-w-[65%] truncate text-[11px] font-medium text-slate-700" title={d.label}>{d.label}</span>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">
                {d.value}{d.sub ? ` ${d.sub}` : ''}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={cn('h-full rounded-full transition-all duration-700', color)}
                style={{ width: `${(d.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        {data.length === 0 && <p className="text-[11px] text-slate-400">Chưa có dữ liệu</p>}
      </div>
    </div>
  );
};

/* ─── Main page ──────────────────────────────────────────────── */

export const ProjectListPage = () => {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const { addNotification } = useUIStore();
  const canCreateProject = can(PERMISSIONS.PROJECT_CREATE);
  const canUpdateProject = can(PERMISSIONS.PROJECT_UPDATE);
  const canDeleteProject = can(PERMISSIONS.PROJECT_DELETE);

  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
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
      const [projectList, tasks] = await Promise.all([
        projectApi.getAll(),
        taskApi.getAll().catch(() => [] as Task[]),
      ]);

      setAllTasks(tasks);

      const taskCountMap = tasks.reduce<Record<number, number>>((acc, t) => {
        acc[t.projectId] = (acc[t.projectId] ?? 0) + 1;
        return acc;
      }, {});

      const completedTaskMap = tasks.reduce<Record<number, number>>((acc, t) => {
        if (t.status === 'COMPLETED') acc[t.projectId] = (acc[t.projectId] ?? 0) + 1;
        return acc;
      }, {});

      const memberCounts = await Promise.all(
        projectList.map((p) =>
          projectApi.getAssignments(p.id)
            .then((list) => list.filter((a) => a.active).length)
            .catch(() => 0)
        )
      );

      setProjects(
        projectList.map((p, i) => ({
          ...p,
          memberCount: memberCounts[i],
          taskCount: taskCountMap[p.id] ?? 0,
          completedTaskCount: completedTaskMap[p.id] ?? 0,
        }))
      );
    } catch {
      setError('Không thể tải danh sách dự án.');
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

  /* ── chart data ── */

  const taskStatusChartData = useMemo<BarDatum[]>(() => [
    { label: 'Mở',        sublabel: 'Mở',        value: allTasks.filter(t => t.status === 'OPEN').length,        color: '#0ea5e9' },
    { label: 'Đang làm',  sublabel: 'Đang làm',  value: allTasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#f59e0b' },
    { label: 'Hoàn tất',  sublabel: 'Hoàn tất',  value: allTasks.filter(t => t.status === 'COMPLETED').length,   color: '#10b981' },
    { label: 'Đã hủy',    sublabel: 'Đã hủy',    value: allTasks.filter(t => t.status === 'CANCELLED').length,   color: '#94a3b8' },
  ], [allTasks]);

  const completionChartData = useMemo<LineDatum[]>(() =>
    projects
      .filter(p => p.taskCount > 0)
      .slice(0, 8)
      .map(p => ({
        label: p.name.length > 10 ? p.name.slice(0, 9) + '…' : p.name,
        value: Math.round((p.completedTaskCount / p.taskCount) * 100),
      })),
    [projects]
  );

  const memberChartData = useMemo(() =>
    [...projects]
      .sort((a, b) => b.memberCount - a.memberCount)
      .slice(0, 6)
      .map(p => ({ label: p.name, value: p.memberCount, sub: 'TV' })),
    [projects]
  );

  /* ── stat cards ── */

  const projectStats = useMemo(() => [
    {
      label: 'Đang chạy',   value: projects.filter(p => p.status === 'ACTIVE').length,
      icon: FolderKanban,   gradient: 'from-cyan-500 to-cyan-700',      text: 'text-cyan-700',   bg: 'bg-cyan-50',
    },
    {
      label: 'Tạm dừng',    value: projects.filter(p => p.status === 'PAUSED').length,
      icon: PauseCircle,    gradient: 'from-amber-400 to-amber-600',    text: 'text-amber-700',  bg: 'bg-amber-50',
    },
    {
      label: 'Hoàn tất',    value: projects.filter(p => p.status === 'COMPLETED').length,
      icon: CheckCircle2,   gradient: 'from-emerald-500 to-emerald-700', text: 'text-emerald-700', bg: 'bg-emerald-50',
    },
    {
      label: 'Tổng thành viên', value: projects.reduce((s, p) => s + p.memberCount, 0),
      icon: Users,          gradient: 'from-slate-400 to-slate-600',    text: 'text-slate-700',  bg: 'bg-slate-100',
    },
  ], [projects]);

  /* ── filter + table ── */

  const filteredProjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter(p => {
      const matchSearch = !q || p.name.toLowerCase().includes(q) || String(p.leadId).includes(q);
      const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / pageSize));
  const pagedProjects = filteredProjects.slice((page - 1) * pageSize, page * pageSize);

  return (
    <MainLayout>
      <div className="space-y-5">
        {/* Header */}
        <PageHeader
          icon={Archive}
          title="Quản lý dự án"
          description="Theo dõi tiến độ, phân công và biểu đồ tổng quan toàn bộ dự án."
          actions={
            canCreateProject ? (
              <Link to="/projects/add">
                <Button><Plus size={16} />Tạo dự án</Button>
              </Link>
            ) : undefined
          }
        />

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {projectStats.map((stat, i) => (
            <Card key={stat.label} className="relative overflow-hidden p-5" style={{ animationDelay: `${i * 60}ms` }}>
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className="mt-1 font-display text-3xl font-bold tabular-nums tracking-tight text-slate-950">
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

        {/* Charts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-5">
            {loading ? (
              <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <VBarChart
                data={taskStatusChartData}
                title="Phân bổ task theo trạng thái"
                subtitle={`Tổng ${allTasks.length} task toàn hệ thống`}
              />
            )}
          </Card>

          <Card className="p-5">
            {loading ? (
              <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
            ) : completionChartData.length === 0 ? (
              <div className="flex h-44 flex-col items-center justify-center gap-2">
                <p className="text-xs font-semibold text-slate-700">Tiến độ hoàn thành (%)</p>
                <p className="text-[11px] text-slate-400">Chưa có task trong dự án</p>
              </div>
            ) : (
              <LineAreaChart
                data={completionChartData}
                title="Tiến độ hoàn thành theo dự án"
                subtitle="% task đã hoàn tất / tổng task"
                color="#10b981"
              />
            )}
          </Card>

          <Card className="p-5">
            {loading ? (
              <div className="h-44 animate-pulse rounded-lg bg-slate-100" />
            ) : (
              <HorizBarList
                data={memberChartData}
                title="Phân công nhân sự"
                subtitle="Top dự án theo số thành viên active"
                color="bg-cyan-500"
              />
            )}
          </Card>
        </div>

        {/* Filters */}
        <Card className="overflow-hidden">
          <div className="h-1 bg-blue-700" />
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

        {/* Project table */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 animate-pulse rounded-lg bg-slate-100" />
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
              <p className="text-sm text-slate-600">Không có dự án nào phù hợp.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dự án</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trạng thái</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Thành viên</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Task</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Hoàn thành</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Ngày tạo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Lead</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pagedProjects.map((project) => {
                    const pct = project.taskCount > 0
                      ? Math.round((project.completedTaskCount / project.taskCount) * 100)
                      : null;
                    return (
                      <tr
                        key={project.id}
                        className="group cursor-pointer transition-colors hover:bg-slate-50"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        {/* Name + description */}
                        <td className="px-4 py-3">
                          <p className="font-semibold text-slate-900 group-hover:text-cyan-700 transition-colors">
                            {project.name}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 line-clamp-1">
                            {project.description || 'Chưa có mô tả'}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <Badge variant={statusVariants[project.status]}>
                            {statusLabels[project.status]}
                          </Badge>
                        </td>

                        {/* Members */}
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                            <Users size={11} />
                            {project.memberCount}
                          </span>
                        </td>

                        {/* Tasks open / total */}
                        <td className="px-4 py-3 text-center">
                          <span className="text-xs font-semibold tabular-nums text-slate-700">
                            {project.completedTaskCount}
                            <span className="font-normal text-slate-400">/{project.taskCount}</span>
                          </span>
                        </td>

                        {/* Progress bar + % */}
                        <td className="px-4 py-3">
                          {pct !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={cn(
                                    'h-full rounded-full',
                                    pct >= 100 ? 'bg-emerald-500' : pct >= 60 ? 'bg-cyan-500' : pct >= 30 ? 'bg-amber-400' : 'bg-rose-400',
                                  )}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs font-semibold tabular-nums text-slate-600">{pct}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>

                        {/* Created */}
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <CalendarDays size={11} />
                            {formatDate(project.createdAt)}
                          </span>
                        </td>

                        {/* Lead */}
                        <td className="px-4 py-3">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono text-slate-600">
                            #{project.leadId}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3">
                          <div
                            className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {canUpdateProject && (
                              <button
                                type="button"
                                title="Sửa"
                                className="rounded p-1 text-slate-400 hover:bg-cyan-50 hover:text-cyan-700 transition-colors"
                                onClick={() => navigate(`/projects/edit/${project.id}`)}
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            {canDeleteProject && (
                              <button
                                type="button"
                                title="Xóa"
                                disabled={deletingId === project.id}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors disabled:opacity-40"
                                onClick={() => setConfirmTarget(project)}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
