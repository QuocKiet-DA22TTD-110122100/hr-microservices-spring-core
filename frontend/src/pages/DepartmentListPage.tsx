import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Table } from '@/components/UI/Table';
import { Button } from '@/components/UI/Button';
import { departmentApi } from '@/api/department.api';
import { Department } from '@/types/department';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';

export const DepartmentListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách phòng ban.'),
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDelete = async (deptId: number) => {
    if (!confirm('Bạn chắc chắn muốn xóa phòng ban này?')) return;

    try {
      await departmentApi.delete(deptId);
      setDepartments((current) => current.filter((d) => d.id !== deptId));
      addNotification({
        type: 'success',
        message: 'Xóa phòng ban thành công',
      });
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi xóa phòng ban.'),
      });
    }
  };

  const columns: Array<{
    key: string;
    title: string;
    render?: (value: Department[keyof Department], record: Department) => React.ReactNode;
  }> = [
    { key: 'code', title: 'Mã phòng ban' },
    { key: 'name', title: 'Tên phòng ban' },
    {
      key: 'organizationUnitName',
      title: 'Tổ chức',
      render: (value: Department[keyof Department]): React.ReactNode => String(value) || '--',
    },
    {
      key: 'actions',
      title: 'Hành động',
      render: (_: Department[keyof Department], record: Department) => (
        <div className="flex gap-2">
          <button
            onClick={() => navigate(`/departments/edit/${record.id}`)}
            className="p-1 hover:bg-blue-100 rounded transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 size={16} className="text-blue-600" />
          </button>
          <button
            onClick={() => handleDelete(record.id)}
            className="p-1 hover:bg-red-100 rounded transition-colors"
            title="Xóa"
          >
            <Trash2 size={16} className="text-red-600" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Phòng ban</h1>
            <p className="text-gray-600 text-sm mt-1">Danh sách phòng ban trong tổ chức</p>
          </div>
          <Button onClick={() => navigate('/departments/add')}>
            <Plus size={18} className="mr-2" />
            Thêm phòng ban
          </Button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table 
            columns={columns} 
            data={departments} 
            loading={loading}
            onRowClick={(record) => navigate(`/departments/edit/${record.id}`)}
          />
        </div>
      </div>
    </MainLayout>
  );
};
