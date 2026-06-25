import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const lastSearchAtRef = useRef(0);

  const getStatusVariant = useCallback((status: string): EmployeeStatusVariant => {
    if (status === 'ACTIVE') return 'success';
    if (status === 'INACTIVE') return 'danger';
    return 'warning';
  }, []);

  const getStatusLabel = useCallback((status: string) => {
    if (status === 'ACTIVE') return 'Đang làm';
    if (status === 'INACTIVE') return 'Nghỉ việc';
    return 'Nghỉ phép';
  }, []);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getAll({ page, size: 10 });
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
  }, [page, addNotification]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  const handleSearch = useCallback(async () => {
    const now = Date.now();
    if (now - lastSearchAtRef.current < 1000) return;
    lastSearchAtRef.current = now;

    if (!searchKeyword.trim()) {
      fetchEmployees();
      return;
    }

    setLoading(true);
    try {
      const response = await employeeApi.search(searchKeyword, { page, size: 10 });
      setEmployees(response.data.content);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tìm kiếm nhân viên.'),
      });
    } finally {
      setLoading(false);
    }
  }, [searchKeyword, page, fetchEmployees, addNotification]);

  const handleRowClick = useCallback(
    (record: Employee) => navigate(`/employees/${record.id}`),
    [navigate]
  );

  // Stats computed from current page (approximate)
  const activeCount  = useMemo(() => employees.filter((e) => e.status === 'ACTIVE').length, [employees]);
  const leaveCount   = useMemo(() => employees.filter((e) => e.status === 'ON_LEAVE').length, [employees]);
  const inactiveCount = useMemo(() => employees.filter((e) => e.status === 'INACTIVE').length, [employees]);

  const summary = (
    <section className="grid grid-cols-2 gap-3 xl:grid-cols-4 animate-fade-up">
      {[
        { label: 'Tổng nhân viên', value: totalElements, icon: Users,      gradient: 'from-cyan-600 to-teal-500',     bg: 'bg-cyan-50',     text: 'text-cyan-700'   },
        { label: 'Đang làm việc',  value: activeCount,   icon: UserCheck,   gradient: 'from-emerald-600 to-green-500', bg: 'bg-emerald-50',  text: 'text-emerald-700'},
        { label: 'Nghỉ phép',      value: leaveCount,    icon: Building2,   gradient: 'from-amber-500 to-orange-400',  bg: 'bg-amber-50',    text: 'text-amber-700'  },
        { label: 'Nghỉ việc',      value: inactiveCount, icon: UserMinus,   gradient: 'from-rose-500 to-red-500',      bg: 'bg-rose-50',     text: 'text-rose-700'   },
      ].map((stat) => (
        <Card key={stat.label} className="relative overflow-hidden p-4">
          <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`} />
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium text-slate-500">{stat.label}</p>
              <p className="mt-0.5 text-2xl font-bold tracking-tight text-slate-900">
                {loading ? '—' : stat.value}
              </p>
            </div>
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg} ${stat.text}`}>
              <stat.icon size={18} />
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
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${getAvatarGradient(record.id)} text-xs font-bold text-white shadow-sm`}
                aria-hidden="true"
              >
                {getInitials(displayName)}
              </div>
              <div className="min-w-0">
                <p className="font-medium text-slate-900 truncate">{displayName}</p>
                {record.position && (
                  <p className="text-xs text-slate-500 truncate">{record.position}</p>
                )}
              </div>
            </div>
          );
        },
      },
      { key: 'employeeCode', title: 'Mã NV' },
      { key: 'email', title: 'Email' },
      { key: 'departmentName', title: 'Phòng ban' },
      {
        key: 'status',
        title: 'Trạng thái',
        render: (value) => (
          <Badge variant={getStatusVariant(String(value ?? ''))}>{getStatusLabel(String(value ?? ''))}</Badge>
        ),
      },
      {
        key: 'hireDate',
        title: 'Ngày vào làm',
        render: (value) => formatDate(value as string),
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
            Thêm nhân viên
          </Button>
        </PermissionGate>
      }
      summary={summary}
      filters={
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            />
          </div>
          <Button onClick={() => void handleSearch()} isLoading={loading}>
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
