import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization.api';
import { departmentApi } from '@/api/department.api';
import { employeeApi } from '@/api/employee.api';
import { OrganizationUnit } from '@/types/organization';
import { Department } from '@/types/department';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Loader } from 'lucide-react';

interface EmployeeFormData {
  name: string;
  position?: string;
  departmentId?: number;
}

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const [organizations, setOrganizations] = useState<OrganizationUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      name: '',
      position: '',
      departmentId: undefined,
    },
  });

  // Fetch all organizations
  const fetchOrganizations = async () => {
    try {
      const response = await organizationApi.getAll();
      setOrganizations(response.data);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách tổ chức.'),
      });
    }
  };

  // Fetch departments filtered by organization
  const fetchDepartmentsByOrg = async (orgId: number) => {
    try {
      const response = await departmentApi.getByOrganizationUnitId(orgId);
      setDepartments(response.data.content);
    } catch (error: unknown) {
      setDepartments([]);
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách phòng ban.'),
      });
    }
  };

  // Fetch employee if editing
  const fetchEmployee = async () => {
    if (!id) return;

    try {
      const response = await employeeApi.getById(Number(id));
      const emp = response.data;
      setValue('name', emp.name);
      setValue('position', emp.position);
      setValue('departmentId', emp.departmentId);
      
      // If employee has a department, fetch it to get the organization
      if (emp.departmentId) {
        try {
          const deptResponse = await departmentApi.getById(emp.departmentId);
          const dept = deptResponse.data;
          if (dept.organizationUnitId) {
            setSelectedOrgId(dept.organizationUnitId);
            // Fetch departments for that organization
            await fetchDepartmentsByOrg(dept.organizationUnitId);
          }
        } catch (error: unknown) {
          addNotification({
            type: 'error',
            message: getApiErrorMessage(error, 'Lỗi khi tải chi tiết phòng ban.'),
          });
        }
      }
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải thông tin nhân viên.'),
      });
      navigate('/employees');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (id) {
      fetchEmployee();
    } else {
      setPageLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleOrgChange = async (orgId: string) => {
    const numOrgId = orgId ? Number(orgId) : undefined;
    setSelectedOrgId(numOrgId);
    setValue('departmentId', undefined);
    setDepartments([]);

    if (numOrgId) {
      await fetchDepartmentsByOrg(numOrgId);
    }
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setIsLoading(true);
    try {
      if (id) {
        await employeeApi.update(Number(id), data);
        addNotification({
          type: 'success',
          message: 'Cập nhật nhân viên thành công!',
        });
      } else {
        await employeeApi.create(data);
        addNotification({
          type: 'success',
          message: 'Thêm nhân viên thành công!',
        });
      }
      navigate('/employees');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(
          error,
          id ? 'Lỗi khi cập nhật nhân viên.' : 'Lỗi khi thêm nhân viên.'
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center py-12">
          <Loader size={32} className="animate-spin text-blue-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {id ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {id ? 'Cập nhật thông tin nhân viên' : 'Nhập thông tin nhân viên mới'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Tên nhân viên"
                placeholder="Nhập tên nhân viên"
                error={errors.name?.message}
                {...register('name', { required: 'Vui lòng nhập tên nhân viên' })}
              />

              <Input
                label="Chức vụ"
                placeholder="Nhập chức vụ (tuỳ chọn)"
                error={errors.position?.message}
                {...register('position')}
              />

              <div>
                <label htmlFor="organizationId" className="block text-sm font-medium text-gray-700 mb-1">
                  Tổ chức <span className="text-red-500">*</span>
                </label>
                <select
                  id="organizationId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedOrgId?.toString() || ''}
                  onChange={(e) => handleOrgChange(e.target.value)}
                >
                  <option value="">Chọn tổ chức</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.code ? `(${org.code})` : ''} - {org.level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                {selectedOrgId ? (
                  <select
                    id="departmentId"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    {...register('departmentId')}
                  >
                    <option value="">Chọn phòng ban</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name} {dept.code ? `(${dept.code})` : ''}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                    Vui lòng chọn tổ chức trước
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader size={18} className="mr-2 animate-spin" />}
                {id ? 'Cập nhật' : 'Thêm nhân viên'}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
