import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Table } from '@/components/UI/Table';
import { Button } from '@/components/UI/Button';
import { departmentApi } from '@/api/department.api';
import { Department } from '@/types/department';
import { Plus } from 'lucide-react';

export const DepartmentListPage = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const columns: Array<{
    key: string;
    title: string;
    render?: (value: Department[keyof Department], record: Department) => React.ReactNode;
  }> = [
    { key: 'code', title: 'Mã phòng ban' },
    { key: 'name', title: 'Tên phòng ban' },
    { key: 'managerName', title: 'Trưởng phòng' },
    { key: 'parentDepartmentName', title: 'Phòng ban cha' },
    { key: 'employeeCount', title: 'Số nhân viên' },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (value: Department[keyof Department]) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value === 'ACTIVE' ? 'Hoạt động' : 'Không hoạt động'}
        </span>
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
