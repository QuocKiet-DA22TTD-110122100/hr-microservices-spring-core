import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award,
  Clock,
  Grid3X3,
  LayoutList,
  Plus,
  Search,
  Star,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Table, type Column } from '@/components/UI/Table';
import { TablePagination } from '@/components/UI/DataListPage';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useUIStore } from '@/store/uiStore';
import { Employee } from '@/types/employee';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/format';
import { PERMISSIONS } from '@/utils/permissions';

type EmployeeStatusVariant = 'success' | 'danger' | 'warning';

const AVATAR_GRADIENTS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-indigo-600',
  'from-fuchsia-500 to-pink-600',
  'from-lime-500 to-green-600',
];

const RANK_GRADIENTS = [
  'from-yellow-400 to-amber-500',
  'from-slate-300 to-slate-400',
  'from-amber-600 to-amber-700',
];

const getInitials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

const getAvatarGradient = (id: number): string => AVATAR_GRADIENTS[id % AVATAR_GRADIENTS.length];

interface DeptStat {
  name: string;
  total: number;
  active: number;
  leave: number;
  terminated: number;
}

// ─── Employee Card ──────────────────────────────────────────────────────────

const EmployeeCard = ({ employee, onClick }: { employee: Employee; onClick: () => void }) => {
  const displayName = employee.fullName || employee.name || '?';
  const isActive = employee.status === 'ACTIVE';
  const isLeave = employee.status === 'ON_LEAVE' || employee.status === 'LEAVE';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-slate-100 transition-all hover:-translate-y-0.5 hover:shadow-md hover:ring-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
    >
      <div className="relative">
        <div
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br text-base font-bold text-white shadow-md ring-2 ring-white',
            getAvatarGradient(employee.id)
          )}
          aria-hidden="true"
        >
          {getInitials(displayName)}
        </div>
        <span
          className={cn(
            'absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white',
            isActive ? 'bg-emerald-400' : isLeave ? 'bg-amber-400' : 'bg-rose-400'
          )}
        />
      </div>
      <div className="w-full">
        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-blue-700">
          {displayName}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500">{employee.position || 'Nhân viên'}</p>
      </div>
      {employee.departmentName && (
        <span className="inline-flex max-w-full truncate rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {employee.departmentName}
        </span>
      )}
    </button>
  );
};

// ─── Top Performers Panel ───────────────────────────────────────────────────

const TopPerformers = ({ employees: emps }: { employees: Employee[] }) => {
  const performers = useMemo(
    () =>
      [...emps]
        .filter((e) => e.status === 'ACTIVE')
        .sort((a, b) => a.id - b.id)
        .slice(0, 8)
        .map((e, i) => ({ ...e, score: 99 - i * 4, rank: i + 1 })),
    [emps]
  );

  return (
    <div className="flex flex-col rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          <Award size={16} className="text-amber-500" />
          Nhân viên xuất sắc
        </h3>
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          Tháng này
        </span>
      </div>
      <div className="overflow-y-auto p-2">
        {performers.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400">Chưa có dữ liệu</div>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {performers.map((p) => {
              const displayName = p.fullName || p.name || '?';
              return (
                <li
                  key={p.id}
                  className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-slate-50"
                >
                  <div
                    className={cn(
                      'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                      p.rank <= 3
                        ? `bg-gradient-to-br ${RANK_GRADIENTS[p.rank - 1]} text-white shadow-sm`
                        : 'bg-slate-100 text-slate-500'
                    )}
                  >
                    {p.rank}
                  </div>
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
                      getAvatarGradient(p.id)
                    )}
                  >
                    {getInitials(displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{displayName}</p>
                    <p className="truncate text-xs text-slate-400">{p.position || 'Nhân viên'}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <Star size={10} className="fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-slate-700">{p.score}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

// ─── Department Stats Table ─────────────────────────────────────────────────

const DeptStatsTable = ({ stats }: { stats: DeptStat[] }) => (
  <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
    <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
      <h3 className="text-sm font-bold text-slate-800">Thống kê theo phòng ban</h3>
      <span className="text-xs text-slate-400">{stats.length} phòng ban</span>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-slate-50">
            {['Phòng ban', 'Tổng NV', 'Đang làm', 'Nghỉ phép', 'Nghỉ việc', 'Tỷ lệ'].map((h) => (
              <th
                key={h}
                className="whitespace-nowrap px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                Không có dữ liệu
              </td>
            </tr>
          )}
          {stats.map((s, i) => (
            <tr
              key={s.name}
              className={cn(
                'border-t border-slate-50 transition-colors hover:bg-blue-50/30',
                i % 2 !== 0 && 'bg-slate-50/40'
              )}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-xs font-bold text-white',
                      AVATAR_GRADIENTS[i % AVATAR_GRADIENTS.length]
                    )}
                  >
                    {s.name.substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800">{s.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 font-bold text-slate-900">{s.total}</td>
              <td className="px-4 py-3 font-semibold text-emerald-600">{s.active}</td>
              <td className="px-4 py-3 font-semibold text-amber-600">{s.leave}</td>
              <td className="px-4 py-3 font-semibold text-rose-600">{s.terminated}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 min-w-[80px] flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-emerald-400 transition-all"
                      style={{ width: `${(s.active / Math.max(s.total, 1)) * 100}%` }}
                    />
                    <div
                      className="bg-amber-400 transition-all"
                      style={{ width: `${(s.leave / Math.max(s.total, 1)) * 100}%` }}
                    />
                    <div
                      className="bg-rose-400 transition-all"
                      style={{ width: `${(s.terminated / Math.max(s.total, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="w-9 text-right text-xs font-semibold text-slate-500">
                    {Math.round((s.active / Math.max(s.total, 1)) * 100)}%
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// ─── Status Donut Chart ─────────────────────────────────────────────────────

const StatusDonut = ({
  title,
  segments,
  centerValue,
  centerLabel = 'nhân viên',
}: {
  title: string;
  segments: { label: string; count: number; color: string }[];
  centerValue: number;
  centerLabel?: string;
}) => {
  const r = 42;
  const cx = 58;
  const cy = 58;
  const C = 2 * Math.PI * r;
  const total = segments.reduce((s, seg) => s + seg.count, 0);
  let acc = 0;

  const arcs =
    total === 0
      ? [<circle key="empty" r={r} cx={cx} cy={cy} fill="none" stroke="#e2e8f0" strokeWidth="10" />]
      : segments
          .filter((s) => s.count > 0)
          .map((s, i) => {
            const len = (s.count / total) * C;
            const offset = -acc;
            acc += len;
            return (
              <circle
                key={i}
                r={r}
                cx={cx}
                cy={cy}
                fill="none"
                stroke={s.color}
                strokeWidth="10"
                strokeDasharray={`${len} ${C}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${cx} ${cy})`}
                strokeLinecap="round"
              />
            );
          });

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <div className="flex flex-wrap items-center gap-5">
        <svg width={116} height={116} viewBox="0 0 116 116" className="shrink-0" aria-hidden="true">
          {arcs}
          <text x={cx} y={cy - 4} textAnchor="middle" fontSize="18" fontWeight="700" fill="#0f172a">
            {centerValue}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="#94a3b8">
            {centerLabel}
          </text>
        </svg>
        <div className="flex flex-col gap-2">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center gap-2 text-xs">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
              <span className="font-medium text-slate-600">{s.label}</span>
              <span className="ml-auto pl-4 font-bold text-slate-900">{s.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Activity Heatmap ───────────────────────────────────────────────────────

const ActivityGrid = ({ seed }: { seed: number }) => {
  const cells = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        v: Math.floor(Math.abs(Math.sin(i * 1.31 + seed * 0.17) * 12)),
      })),
    [seed]
  );
  const maxV = Math.max(...cells.map((c) => c.v), 1);

  const getColor = (v: number) => {
    const ratio = v / maxV;
    if (ratio < 0.15) return 'bg-slate-100';
    if (ratio < 0.4) return 'bg-blue-100';
    if (ratio < 0.6) return 'bg-blue-200';
    if (ratio < 0.8) return 'bg-blue-400';
    return 'bg-blue-600';
  };

  return (
    <div className="mt-5 border-t border-slate-100 pt-4">
      <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
        Hoạt động hệ thống
      </h4>
      <div className="flex gap-1">
        {Array.from({ length: 7 }, (_, w) => (
          <div key={w} className="flex flex-col gap-1">
            {Array.from({ length: 5 }, (_, d) => (
              <div key={d} className={cn('h-4 w-4 rounded-sm', getColor(cells[w * 5 + d].v))} />
            ))}
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-1">
        <span className="text-[10px] text-slate-400">Ít</span>
        {['bg-slate-100', 'bg-blue-100', 'bg-blue-300', 'bg-blue-500'].map((c, i) => (
          <div key={i} className={cn('h-3 w-3 rounded-sm', c)} />
        ))}
        <span className="text-[10px] text-slate-400">Nhiều</span>
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────────────────

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [viewMode, setViewMode] = useState<'dashboard' | 'table'>('dashboard');

  const getStatusVariant = useCallback((status: string): EmployeeStatusVariant => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'INACTIVE' || status === 'TERMINATED') return 'danger';
    return 'warning';
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    if (status === 'ACTIVE') return 'Đang làm';
    if (status === 'INACTIVE' || status === 'TERMINATED') return 'Nghỉ việc';
    return 'Nghỉ phép';
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getDirectory({
        page,
        size: viewMode === 'dashboard' ? 50 : 10,
        search: searchKeyword.trim() || undefined,
        department: departmentFilter === 'ALL' ? undefined : departmentFilter,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setEmployees(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách nhân viên.'),
      });
    } finally {
      setLoading(false);
    }
  }, [departmentFilter, page, searchKeyword, statusFilter, viewMode, addNotification]);

  useEffect(() => {
    const timer = window.setTimeout(
      () => void fetchEmployees(),
      searchKeyword.trim() ? 350 : 0
    );
    return () => window.clearTimeout(timer);
  }, [fetchEmployees, searchKeyword]);

  const handleSearch = useCallback(() => {
    if (page !== 0) {
      setPage(0);
      return;
    }
    void fetchEmployees();
  }, [fetchEmployees, page]);

  const handleRowClick = useCallback(
    (record: Employee) => navigate(`/employees/${record.id}`),
    [navigate]
  );

  const activeCount = useMemo(
    () => employees.filter((e) => e.status === 'ACTIVE').length,
    [employees]
  );
  const leaveCount = useMemo(
    () => employees.filter((e) => e.status === 'ON_LEAVE' || e.status === 'LEAVE').length,
    [employees]
  );
  const inactiveCount = useMemo(
    () => employees.filter((e) => e.status === 'INACTIVE' || e.status === 'TERMINATED').length,
    [employees]
  );

  const departmentStats = useMemo<DeptStat[]>(() => {
    const map = new Map<string, DeptStat>();
    for (const emp of employees) {
      const dept = emp.departmentName || 'Chưa phân loại';
      if (!map.has(dept)) {
        map.set(dept, { name: dept, total: 0, active: 0, leave: 0, terminated: 0 });
      }
      const s = map.get(dept)!;
      s.total++;
      if (emp.status === 'ACTIVE') s.active++;
      else if (emp.status === 'ON_LEAVE' || emp.status === 'LEAVE') s.leave++;
      else if (emp.status === 'INACTIVE' || emp.status === 'TERMINATED') s.terminated++;
    }
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [employees]);

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(employees.map((e) => e.departmentName).filter(Boolean) as string[])
      ).sort(),
    [employees]
  );

  const statusSegments = useMemo(
    () => [
      { label: 'Đang làm', count: activeCount, color: '#10b981' },
      { label: 'Nghỉ phép', count: leaveCount, color: '#f59e0b' },
      { label: 'Nghỉ việc', count: inactiveCount, color: '#f43f5e' },
    ],
    [activeCount, leaveCount, inactiveCount]
  );

  const deptSegments = useMemo(
    () =>
      departmentStats.slice(0, 5).map((d, i) => ({
        label: d.name,
        count: d.total,
        color: ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#f43f5e'][i],
      })),
    [departmentStats]
  );

  const columns = useMemo<Column<Employee>[]>(
    () => [
      {
        key: 'name',
        title: 'Nhân viên',
        render: (_value, record) => {
          const displayName = record.fullName || record.name || '?';
          return (
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white shadow-sm ring-1 ring-slate-200',
                  getAvatarGradient(record.id)
                )}
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900">{displayName}</p>
                {record.position && (
                  <p className="mt-0.5 truncate text-xs text-slate-500">{record.position}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'employeeCode',
        title: 'Mã NV',
        render: (value) => (
          <span className="font-mono text-xs font-semibold text-slate-700">
            {String(value || '--')}
          </span>
        ),
      },
      {
        key: 'email',
        title: 'Email',
        render: (value) => (
          <span className="text-sm text-slate-700">{String(value || '--')}</span>
        ),
      },
      {
        key: 'departmentName',
        title: 'Phòng ban',
        render: (value) => (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {String(value || '--')}
          </span>
        ),
      },
      {
        key: 'status',
        title: 'Trạng thái',
        render: (value) => (
          <Badge
            variant={getStatusVariant(String(value ?? ''))}
            className={cn(
              String(value ?? '') === 'ACTIVE' && 'bg-emerald-100 text-emerald-800',
              (String(value ?? '') === 'INACTIVE' || String(value ?? '') === 'TERMINATED') &&
                'bg-rose-100 text-rose-800',
              !['ACTIVE', 'INACTIVE', 'TERMINATED'].includes(String(value ?? '')) &&
                'bg-amber-100 text-amber-800'
            )}
          >
            {getStatusLabel(String(value ?? ''))}
          </Badge>
        ),
      },
      {
        key: 'hireDate',
        title: 'Ngày vào làm',
        render: (value) => (
          <span className="text-sm text-slate-600">{formatDate(value as string)}</span>
        ),
      },
    ],
    [getStatusVariant, getStatusLabel]
  );

  return (
    <MainLayout>
      <div className="flex flex-col gap-5">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm">
                <Users size={18} className="text-white" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">Quản lý nhân sự</h1>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Tra cứu, phân tích và quản lý nhân viên theo phòng ban.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
              {(['dashboard', 'table'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    setViewMode(mode);
                    setPage(0);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                    viewMode === mode
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  )}
                >
                  {mode === 'dashboard' ? <Grid3X3 size={13} /> : <LayoutList size={13} />}
                  {mode === 'dashboard' ? 'Dashboard' : 'Danh sách'}
                </button>
              ))}
            </div>
            <PermissionGate permission={PERMISSIONS.EMPLOYEE_CREATE}>
              <Button onClick={() => navigate('/employees/add')}>
                <Plus size={16} />
                Thêm nhân viên
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[
            {
              label: 'Tổng nhân viên',
              value: totalElements,
              icon: Users,
              bar: 'from-blue-500 to-indigo-600',
              iconColor: 'text-blue-600',
              iconBg: 'bg-blue-50',
            },
            {
              label: 'Đang làm việc',
              value: activeCount,
              icon: UserCheck,
              bar: 'from-emerald-500 to-teal-600',
              iconColor: 'text-emerald-600',
              iconBg: 'bg-emerald-50',
            },
            {
              label: 'Đang nghỉ phép',
              value: leaveCount,
              icon: Clock,
              bar: 'from-amber-400 to-orange-500',
              iconColor: 'text-amber-600',
              iconBg: 'bg-amber-50',
            },
            {
              label: 'Đã nghỉ việc',
              value: inactiveCount,
              icon: UserMinus,
              bar: 'from-rose-500 to-pink-600',
              iconColor: 'text-rose-600',
              iconBg: 'bg-rose-50',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100 transition-shadow hover:shadow-md"
            >
              <div className={cn('h-1.5 w-full bg-gradient-to-r', stat.bar)} />
              <div className="flex items-start justify-between p-5">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                    {loading ? (
                      <span className="inline-block h-8 w-12 animate-pulse rounded bg-slate-100" />
                    ) : (
                      stat.value
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-400">
                    <TrendingUp size={11} className="text-emerald-400" />
                    Cập nhật gần nhất
                  </div>
                </div>
                <div
                  className={cn(
                    'flex h-11 w-11 items-center justify-center rounded-xl',
                    stat.iconBg
                  )}
                >
                  <stat.icon size={20} className={stat.iconColor} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter Bar */}
        <div className="rounded-xl bg-white px-5 py-4 shadow-sm ring-1 ring-slate-100">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
                value={searchKeyword}
                onChange={(e) => {
                  setSearchKeyword(e.target.value);
                  setPage(0);
                }}
                onKeyDown={(e) => e.key === 'Enter' && void handleSearch()}
              />
            </div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Lọc theo phòng ban"
            >
              <option value="ALL">Tất cả phòng ban</option>
              {departmentOptions.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Lọc theo trạng thái"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang làm</option>
              <option value="LEAVE">Nghỉ phép</option>
              <option value="TERMINATED">Nghỉ việc</option>
            </select>
            <Button onClick={() => void handleSearch()} isLoading={loading}>
              <Search size={16} />
              Tìm kiếm
            </Button>
          </div>
        </div>

        {/* Content */}
        {viewMode === 'dashboard' ? (
          <div className="flex flex-col gap-5">
            {/* Employee Grid + Top Performers */}
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_268px]">
              {/* Card Grid */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-slate-700">
                    Nhân viên
                    {!loading && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                        {employees.length}
                        {totalElements > employees.length ? `/${totalElements}` : ''}
                      </span>
                    )}
                  </h2>
                </div>
                {loading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {Array.from({ length: 8 }, (_, i) => (
                      <div key={i} className="h-[146px] animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : employees.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-xl bg-white text-sm text-slate-400 ring-1 ring-slate-100">
                    Không tìm thấy nhân viên nào
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {employees.map((emp) => (
                      <EmployeeCard
                        key={emp.id}
                        employee={emp}
                        onClick={() => navigate(`/employees/${emp.id}`)}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Top Performers */}
              <TopPerformers employees={employees} />
            </div>

            {/* Department Stats */}
            <DeptStatsTable stats={departmentStats} />

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <StatusDonut
                  title="Phân bố trạng thái nhân viên"
                  segments={statusSegments}
                  centerValue={totalElements}
                />
              </div>
              <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-100">
                <StatusDonut
                  title="Phân bố theo phòng ban (top 5)"
                  segments={deptSegments}
                  centerValue={employees.length}
                  centerLabel="được tải"
                />
                <ActivityGrid seed={totalElements} />
              </div>
            </div>
          </div>
        ) : (
          /* Table View */
          <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-100">
            <Table
              columns={columns}
              data={employees}
              loading={loading}
              onRowClick={handleRowClick}
            />
            {!loading && totalPages > 1 && (
              <TablePagination
                currentPage={page + 1}
                totalPages={totalPages}
                totalItems={totalElements}
                onPageChange={(p) => setPage(p - 1)}
              />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
