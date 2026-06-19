import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader, Shield, Users } from 'lucide-react';
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
import { CreateEmployeeRequest, UpdateEmployeeRequest } from '@/types/employee';
import { getApiErrorMessage } from '@/utils/error';
import {
  mapBackendValidationErrors,
  validateDate,
  validateMaxLength,
  validateMinLength,
  validatePositiveNumber,
  validateRequired,
} from '@/utils/formValidation';
import { usePermissions } from '@/hooks/usePermissions';
import { PERMISSIONS } from '@/utils/permissions';

interface EmployeeFormData {
  authUserId: string;
  name: string;
  position?: string;
  baseSalary?: number;
  hireDate: string;
  did?: string;
  departmentId?: number;
}

const generateAuthUserId = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }

  return `demo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

const getTodayForInput = () => new Date().toISOString().slice(0, 10);

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const [organizations, setOrganizations] = useState<OrganizationUnit[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<number | undefined>();

  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.EMPLOYEE_CREATE);
  const canUpdate = can(PERMISSIONS.EMPLOYEE_UPDATE);
  const hasSubmitPermission = id ? canUpdate : canCreate;

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    defaultValues: {
      authUserId: generateAuthUserId(),
      name: '',
      position: '',
      baseSalary: undefined,
      hireDate: getTodayForInput(),
      did: '',
      departmentId: undefined,
    },
  });

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

  const fetchEmployee = async () => {
    if (!id) return;

    try {
      const response = await employeeApi.getById(Number(id));
      const emp = response.data;
      setValue('authUserId', emp.authUserId || '');
      setValue('name', emp.name);
      setValue('position', emp.position);
      setValue('baseSalary', emp.baseSalary);
      setValue('hireDate', emp.hireDate || getTodayForInput());
      setValue('did', emp.did || '');
      setValue('departmentId', emp.departmentId);

      if (emp.departmentId) {
        try {
          const deptResponse = await departmentApi.getById(emp.departmentId);
          const dept = deptResponse.data;
          if (dept.organizationUnitId) {
            setSelectedOrgId(dept.organizationUnitId);
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
      const updatePayload: UpdateEmployeeRequest = {
        name: data.name.trim(),
        position: data.position?.trim() || undefined,
        did: data.did?.trim() || undefined,
        departmentId: data.departmentId ? Number(data.departmentId) : undefined,
      };

      if (id) {
        await employeeApi.update(Number(id), updatePayload);
        addNotification({
          type: 'success',
          message: 'Cập nhật nhân viên thành công!',
        });
      } else {
        const createPayload: CreateEmployeeRequest = {
          ...updatePayload,
          authUserId: data.authUserId.trim(),
          baseSalary: Number(data.baseSalary),
          hireDate: data.hireDate,
          departmentId: Number(data.departmentId),
        };

        await employeeApi.create(createPayload);
        addNotification({
          type: 'success',
          message: 'Thêm nhân viên thành công!',
        });
      }
      navigate('/employees');
    } catch (error: unknown) {
      if (mapBackendValidationErrors(error, setError)) {
        addNotification({
          type: 'error',
          message: 'Vui lòng kiểm tra các trường bị lỗi.',
          duration: 3000,
        });
        return;
      }

      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, id ? 'Lỗi khi cập nhật nhân viên.' : 'Lỗi khi thêm nhân viên.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <Loader size={32} className="animate-spin text-cyan-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={Users}
          title={id ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
          description={id ? 'Cập nhật thông tin hồ sơ nhân viên' : 'Tạo hồ sơ HR và liên kết với auth-service'}
          actions={
            <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
              <ArrowLeft size={18} />
              Quay lại
            </Button>
          }
        />

        {!hasSubmitPermission && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <Shield size={20} className="mt-0.5 flex-shrink-0 text-amber-600" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Chế độ chỉ xem</p>
              <p className="mt-1 text-sm text-amber-800">
                Tài khoản hiện tại không có quyền {id ? 'cập nhật' : 'thêm'} nhân viên.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Input
                  label="Auth User ID"
                  placeholder="UUID liên kết với auth-service"
                  required={!id}
                  disabled={!!id}
                  error={errors.authUserId?.message}
                  helperText={id ? 'Mã liên kết tài khoản đăng nhập' : 'Đã tự tạo cho demo, có thể thay bằng UUID thật từ Auth Service'}
                  {...register('authUserId', {
                    validate: {
                      required: !id ? validateRequired('Auth User ID') : () => true,
                      maxLength: validateMaxLength(100, 'Auth User ID'),
                    },
                  })}
                />

                <Input
                  label="Tên nhân viên"
                  placeholder="Nhập tên nhân viên"
                  required
                  error={errors.name?.message}
                  helperText="Tên đầy đủ của nhân viên"
                  {...register('name', {
                    validate: {
                      required: validateRequired('Tên nhân viên'),
                      minLength: validateMinLength(2, 'Tên nhân viên'),
                      maxLength: validateMaxLength(100, 'Tên nhân viên'),
                    },
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
                    },
                  })}
                />

                <Input
                  label="Lương cơ bản"
                  type="number"
                  min="1"
                  step="100000"
                  placeholder="12000000"
                  required={!id}
                  disabled={!!id}
                  error={errors.baseSalary?.message}
                  helperText={id ? 'Lương cơ bản chỉ cập nhật qua payroll flow' : 'Bắt buộc khi tạo nhân viên mới'}
                  {...register('baseSalary', {
                    valueAsNumber: true,
                    validate: {
                      required: !id ? validateRequired('Lương cơ bản') : () => true,
                      positive: validatePositiveNumber('Lương cơ bản'),
                    },
                  })}
                />

                <Input
                  label="Ngày vào làm"
                  type="date"
                  required={!id}
                  disabled={!!id}
                  error={errors.hireDate?.message}
                  helperText={id ? 'Ngày vào làm chỉ cập nhật qua quy trình HR' : 'Bắt buộc khi tạo nhân viên mới'}
                  {...register('hireDate', {
                    validate: {
                      required: !id ? validateRequired('Ngày vào làm') : () => true,
                      date: validateDate,
                    },
                  })}
                />

                <Input
                  label="DID"
                  placeholder="Mã định danh tùy chọn"
                  error={errors.did?.message}
                  helperText="Dùng để liên kết danh tính số nếu có"
                  {...register('did', {
                    validate: {
                      maxLength: validateMaxLength(255, 'DID'),
                    },
                  })}
                />

                <div>
                  <label htmlFor="organizationId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tổ chức <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="organizationId"
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                    value={selectedOrgId?.toString() || ''}
                    onChange={(event) => handleOrgChange(event.target.value)}
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
                  <label htmlFor="departmentId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Phòng ban <span className="text-rose-500">*</span>
                  </label>
                  {selectedOrgId ? (
                    <>
                      <select
                        id="departmentId"
                        className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                        {...register('departmentId', {
                          valueAsNumber: true,
                          validate: {
                            required: !id ? validateRequired('Phòng ban') : () => true,
                          },
                        })}
                      >
                        <option value="">Chọn phòng ban</option>
                        {departments.map((dept) => (
                          <option key={dept.id} value={dept.id}>
                            {dept.name} {dept.code ? `(${dept.code})` : ''}
                          </option>
                        ))}
                      </select>
                      {errors.departmentId && (
                        <p className="mt-1.5 text-sm text-rose-600">{errors.departmentId.message}</p>
                      )}
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                      Vui lòng chọn tổ chức trước
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button type="button" variant="secondary" onClick={() => navigate('/employees')} disabled={isLoading}>
                  {hasSubmitPermission ? 'Hủy' : 'Đóng'}
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !hasSubmitPermission}
                  isLoading={isLoading}
                  title={!hasSubmitPermission ? 'Bạn không có quyền thực hiện thao tác này' : undefined}
                >
                  {!hasSubmitPermission && <Shield size={14} className="mr-2" />}
                  {id ? 'Cập nhật' : 'Thêm nhân viên'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
};
