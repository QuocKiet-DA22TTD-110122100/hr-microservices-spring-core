import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Users } from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { type Column } from '@/components/UI/Table';
import { useUIStore } from '@/store/uiStore';
import { Employee } from '@/types/employee';
import { getApiErrorMessage } from '@/utils/error';
import { formatDate } from '@/utils/format';
import { PERMISSIONS } from '@/utils/permissions';

type EmployeeStatusVariant = 'success' | 'danger' | 'warning';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
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
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách nhân viên.'),
      });
    } finally {
      setLoading(false);
    }
  }, [page, addNotification]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

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
    (record: Employee) => {
      navigate(`/employees/${record.id}`);
    },
    [navigate]
  );

  const columns = useMemo<Column<Employee>[]>(
    () => [
      { key: 'employeeCode', title: 'Mã NV' },
      { key: 'fullName', title: 'Họ và tên' },
      { key: 'email', title: 'Email' },
      { key: 'phone', title: 'Số điện thoại' },
      { key: 'position', title: 'Chức vụ' },
      { key: 'departmentName', title: 'Phòng ban' },
      {
        key: 'status',
        title: 'Trạng thái',
        render: (value: Employee[keyof Employee]) => (
          <Badge variant={getStatusVariant(String(value))}>{getStatusLabel(String(value))}</Badge>
        ),
      },
      {
        key: 'hireDate',
        title: 'Ngày vào làm',
        render: (value: Employee[keyof Employee]) => formatDate(value as string),
      },
    ],
    [getStatusVariant, getStatusLabel]
  );

  return (
    <DataListPage
      icon={Users}
      title="Quản lý nhân viên"
      description="Tra c?u hồ sơ nhân viên, trạng thái làm việc và phòng ban trong hệ thống."
      actions={
        <PermissionGate permission={PERMISSIONS.EMPLOYEE_CREATE}>
          <Button onClick={() => navigate('/employees/add')}>
            <Plus size={18} />
            Thêm nhân viên
          </Button>
        </PermissionGate>
      }
      filters={
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="flex-1">
            <Input
              placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleSearch()}
            />
          </div>
          <Button onClick={handleSearch} isLoading={loading}>
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
              onPageChange: (nextPage) => setPage(nextPage - 1),
            }
          : undefined
      }
    />
  );
};
