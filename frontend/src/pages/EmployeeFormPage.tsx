import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { useUIStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization.api';
import { departmentApi } from '@/api/department.api';
import { employeeApi } from '@/api/employee.api';
import { OrganizationUnit } from '@/types/organization';
import { Department } from '@/types/department';
import { getApiErrorMessage } from '@/utils/error';
import { 
  mapBackendValidationErrors, 
  validateRequired, 
  validateEmail,
  validateMinLength,
  validateMaxLength 
} from '@/utils/formValidation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/utils/permissions';
import { ArrowLeft, Loader, Shield, Users } from 'lucide-react';

interface EmployeeFormData {
  name: string;
  email?: string;
  position?: string;
  phone?: string;
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
  
  // Permission hooks
  const { can } = usePermissions();
  
  // Check permissions
  const canCreate = can(PERMISSIONS.EMPLOYEE_CREATE);
  const canUpdate = can(PERMISSIONS.EMPLOYEE_UPDATE);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      name: '',
      email: '',
      position: '',
      phone: '',
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
      // Map backend validation errors to form fields
      if (mapBackendValidationErrors(error, setError)) {
        addNotification({
          type: 'error',
          message: 'Vui lòng kiểm tra các trường bị lỗi',
          duration: 3000,
        });
        return;
      }

      // Handle other errors
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

  // Check if user has permission to submit
  const hasSubmitPermission = id ? canUpdate : canCreate;

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={Users}
          title={id ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          description={id ? 'Cập nhật thông tin nhân viên' : 'Nhập thông tin nhân viên mới'}
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
              <ArrowLeft size={18} />
              Quay lại
            </Button>
          }
        />

        {/* Permission warning */}
        {!hasSubmitPermission && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
            <Shield size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Chế độ chỉ xem</p>
              <p className="text-sm text-yellow-700 mt-1">
                Bạn không có quyền {id ? 'chỉnh sửa' : 'thêm'} nhân viên. Biểu mẫu này chỉ hiển thị để xem.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Tên nhân viên"
                placeholder="Nhập tên nhân viên"
                error={errors.name?.message}
                helperText="Tên đầy đủ của nhân viên"
                {...register('name', { 
                  validate: {
                    required: validateRequired('Tên nhân viên'),
                    minLength: validateMinLength(2, 'Tên nhân viên'),
                    maxLength: validateMaxLength(100, 'Tên nhân viên'),
                  }
                })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="email@example.com"
                error={errors.email?.message}
                helperText="Email để liên hệ với nhân viên"
                {...register('email', { 
                  validate: validateEmail
                })}
              />

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="0912345678"
                error={errors.phone?.message}
                helperText="Số điện thoại di động"
                {...register('phone', {
                  pattern: {
                    value: /^(0|\+84)(3|5|7|8|9)\d{8}$/,
                    message: 'Số điện thoại không hợp lệ (VD: 0912345678)'
                  }
                })}
              />

              <Input
                label="Chức vụ"
                placeholder="Nhập chức vụ"
                error={errors.position?.message}
                helperText="Chức danh công việc"
                {...register('position', {
                  validate: {
                    maxLength: validateMaxLength(100, 'Chức vụ'),
                  }
                })}
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
              <Button 
                type="submit" 
                disabled={isLoading || !hasSubmitPermission}
                title={!hasSubmitPermission ? 'Bạn không có quyền thực hiện thao tác này' : undefined}
              >
                {isLoading && <Loader size={18} className="mr-2 animate-spin" />}
                {!hasSubmitPermission && <Shield size={14} className="mr-2" />}
                {id ? 'Cập nhật' : 'Thêm nhân viên'}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/employees')}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {hasSubmitPermission ? 'Hủy' : 'Đóng'}
              </button>
            </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
};
