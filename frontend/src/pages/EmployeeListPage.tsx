import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Table } from '@/components/UI/Table';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { employeeApi } from '@/api/employee.api';
import { Employee } from '@/types/employee';
import { formatDate } from '@/utils/format';
import { getApiErrorMessage } from '@/utils/error';
import { useUIStore } from '@/store/uiStore';
import { Plus, Search } from 'lucide-react';

export const EmployeeListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const lastSearchAtRef = useRef(0);

  const getStatusClass = (status: string) => {
    if (status === 'ACTIVE') return 'bg-green-100 text-green-800';
    if (status === 'INACTIVE') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  const getStatusLabel = (status: string) => {
    if (status === 'ACTIVE') return 'Đang làm';
    if (status === 'INACTIVE') return 'Nghỉ việc';
    return 'Nghỉ phép';
  };

  const fetchEmployees = async () => {
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
  };

  useEffect(() => {
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleSearch = async () => {
    const now = Date.now();
    if (now - lastSearchAtRef.current < 1000) {
      return;
    }

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
  };

  const columns: Array<{
    key: string;
    title: string;
    render?: (value: Employee[keyof Employee], record: Employee) => React.ReactNode;
  }> = [
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
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(String(value))}`}
        >
          {getStatusLabel(String(value))}
        </span>
      ),
    },
    {
      key: 'hireDate',
      title: 'Ngày vào làm',
      render: (value: Employee[keyof Employee]) => formatDate(value as string),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Nhân viên</h1>
            <p className="text-gray-600 text-sm mt-1">Danh sách nhân viên trong hệ thống</p>
          </div>
          <Button onClick={() => navigate('/employees/add')}>
            <Plus size={18} className="mr-2" />
            Thêm nhân viên
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} isLoading={loading}>
              <Search size={18} className="mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table 
            columns={columns} 
            data={employees} 
            loading={loading}
            onRowClick={(record) => navigate(`/employees/${record.id}`)}
          />

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 p-4 border-t bg-gray-50">
              <Button
                variant="secondary"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-gray-600">
                Trang {page + 1} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};
