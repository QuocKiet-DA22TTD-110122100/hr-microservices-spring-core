import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Search, UserCheck, UserMinus, Users } from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { type Column } from '@/components/UI/Table';
import { useUIStore } from '@/store/uiStore';
import { Employee } from '@/types/employee';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/format';
import { PERMISSIONS } from '@/utils/permissions';

type EmployeeStatusVariant = 'success' | 'danger' | 'warning';

const getInitials = (name: string): string =>
  name.split(/\s+/).filter(Boolean).slice(-2).map((n) => n[0]).join('').toUpperCase();

const avatarColors = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-500',
  'from-sky-500 to-indigo-600',
];

const getAvatarGradient = (id: number): string => avatarColors[id % avatarColors.length];

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
        size: 10,
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
  }, [departmentFilter, page, searchKeyword, statusFilter, addNotification]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchEmployees();
    }, searchKeyword.trim() ? 350 : 0);

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

  // Stats computed from current page (approximate)
  const activeCount  = useMemo(() => employees.filter((e) => e.status === 'ACTIVE').length, [employees]);
  const leaveCount = useMemo(() => employees.filter((e) => e.status === 'ON_LEAVE' || e.status === 'LEAVE').length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => e.status === 'INACTIVE' || e.status === 'TERMINATED').length, [employees]);
  const departmentOptions = useMemo(
    () => Array.from(new Set(employees.map((employee) => employee.departmentName).filter(Boolean) as string[])).sort(),
    [employees]
  );

  const summary = (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 animate-fade-up">
      {[
        { label: 'Tổng nhân viên', value: totalElements, icon: Users, border: 'border-t-blue-700', bg: 'bg-blue-100', text: 'text-blue-900' },
        { label: 'Đang làm việc', value: activeCount, icon: UserCheck, border: 'border-t-emerald-700', bg: 'bg-emerald-100', text: 'text-emerald-900' },
        { label: 'Nghỉ phép', value: leaveCount, icon: Building2, border: 'border-t-amber-600', bg: 'bg-amber-100', text: 'text-amber-950' },
        { label: 'Nghỉ việc', value: inactiveCount, icon: UserMinus, border: 'border-t-rose-700', bg: 'bg-rose-100', text: 'text-rose-900' },
      ].map((stat) => (
        <Card key={stat.label} className={`relative overflow-hidden border-t-4 p-5 ${stat.border}`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-700">{stat.label}</p>
              <p className="mt-1 font-display text-3xl font-bold tracking-tight text-slate-950">
                {loading ? '...' : stat.value}
              </p>
            </div>
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
              <stat.icon size={20} />
            </div>
          </div>
        </Card>
      ))}
    </section>
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
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(record.id)} text-xs font-bold text-white shadow-sm ring-1 ring-slate-200`}
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-display font-bold text-slate-950">{displayName}</p>
                {record.position && (
                  <p className="mt-0.5 truncate text-sm font-medium text-slate-700">{record.position}</p>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'employeeCode',
        title: 'Mã NV',
        render: (value) => <span className="font-mono text-xs font-semibold text-slate-800">{String(value || '--')}</span>,
      },
      {
        key: 'email',
        title: 'Email',
        render: (value) => <span className="text-sm font-medium text-slate-700">{String(value || '--')}</span>,
      },
      {
        key: 'departmentName',
        title: 'Phòng ban',
        render: (value) => <span className="text-sm font-semibold text-slate-800">{String(value || '--')}</span>,
      },
      {
        key: 'status',
        title: 'Trạng thái',
        render: (value) => (
          <Badge
            variant={getStatusVariant(String(value ?? ''))}
            className={cn(
              String(value ?? '') === 'ACTIVE' && 'bg-emerald-100 text-emerald-950',
              (String(value ?? '') === 'INACTIVE' || String(value ?? '') === 'TERMINATED') && 'bg-rose-100 text-rose-950',
              String(value ?? '') !== 'ACTIVE' && String(value ?? '') !== 'INACTIVE' && String(value ?? '') !== 'TERMINATED' && 'bg-amber-100 text-amber-950'
            )}
          >
            {getStatusLabel(String(value ?? ''))}
          </Badge>
        ),
      },
      {
        key: 'hireDate',
        title: 'Ngày vào làm',
        render: (value) => <span className="font-medium text-slate-700">{formatDate(value as string)}</span>,
      },
    ],
    [getStatusVariant, getStatusLabel]
  );

  return (
    <DataListPage
      icon={Users}
      title="Quản lý nhân viên"
      description="Tra cứu hồ sơ nhân viên, trạng thái làm việc và phòng ban trong hệ thống."
      actions={
        <PermissionGate permission={PERMISSIONS.EMPLOYEE_CREATE}>
          <Button onClick={() => navigate('/employees/add')}>
            <Plus size={18} />
            <span className="font-display">Thêm nhân viên</span>
          </Button>
        </PermissionGate>
      }
      summary={summary}
      filters={
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_180px_170px_auto]">
          <div>
            <Input
              placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
              value={searchKeyword}
              onChange={(event) => {
                setSearchKeyword(event.target.value);
                setPage(0);
              }}
              onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            />
          </div>
          <select
            value={departmentFilter}
            onChange={(event) => {
              setDepartmentFilter(event.target.value);
              setPage(0);
            }}
            className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Lọc theo phòng ban"
          >
            <option value="ALL">Tất cả phòng ban</option>
            {departmentOptions.map((department) => (
              <option key={department} value={department}>{department}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
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
          <Button onClick={() => void handleSearch()} isLoading={loading} className="font-display">
            <Search size={18} />
            Tìm kiếm
          </Button>
        </div>
      }
      columns={columns}
      data={employees}
      loading={loading}
      onRowClick={handleRowClick}
      pagination={
        totalPages > 1
          ? {
              currentPage: page + 1,
              totalPages,
              totalItems: totalElements,
              onPageChange: (nextPage) => setPage(nextPage - 1),
            }
          : undefined
      }
    />
  );
};
