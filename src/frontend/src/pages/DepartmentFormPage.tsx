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
import { OrganizationUnit } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Building2, Loader } from 'lucide-react';

interface DepartmentFormData {
  code?: string;
  name: string;
  organizationUnitId?: number;
}

export const DepartmentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const [organizations, setOrganizations] = useState<OrganizationUnit[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DepartmentFormData>({
    defaultValues: {
      name: '',
      code: '',
      organizationUnitId: undefined,
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

  // Fetch department if editing
  const fetchDepartment = async () => {
    if (!id) return;

    try {
      const response = await departmentApi.getById(Number(id));
      const dept = response.data;
      setValue('name', dept.name);
      setValue('code', dept.code);
      setValue('organizationUnitId', dept.organizationUnitId);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải thông tin phòng ban.'),
      });
      navigate('/departments');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (id) {
      fetchDepartment();
    } else {
      setPageLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: DepartmentFormData) => {
    setIsLoading(true);
    try {
      if (id) {
        await departmentApi.update(Number(id), data);
        addNotification({
          type: 'success',
          message: 'Cập nhật phòng ban thành công!',
        });
      } else {
        await departmentApi.create(data);
        addNotification({
          type: 'success',
          message: 'Thêm phòng ban thành công!',
        });
      }
      navigate('/departments');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(
          error,
          id ? 'Lỗi khi cập nhật phòng ban.' : 'Lỗi khi thêm phòng ban.'
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
          <Loader size={32} className="animate-spin text-cyan-600" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={Building2}
          title={id ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
          description={id ? 'Cập nhật mã, tên và tổ chức quản lý của phòng ban.' : 'Tạo phòng ban mới và gắn vào đúng đơn vị tổ chức.'}
          actions={
            <Button type="button" variant="outline" onClick={() => navigate('/departments')}>
              <ArrowLeft size={18} />
              Quay lại
            </Button>
          }
        />

        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Mã phòng ban"
                placeholder="Nhập mã phòng ban (tùy chọn)"
                error={errors.code?.message}
                {...register('code')}
              />

              <Input
                label="Tên phòng ban"
                placeholder="Nhập tên phòng ban"
                error={errors.name?.message}
                {...register('name', { required: 'Vui lòng nhập tên phòng ban' })}
              />

              <div>
                <label htmlFor="organizationUnitId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Tổ chức <span className="text-rose-500">*</span>
                </label>
                <select
                  id="organizationUnitId"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                  {...register('organizationUnitId')}
                >
                  <option value="">Chọn tổ chức</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} {org.code ? `(${org.code})` : ''} - {org.level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => navigate('/departments')} disabled={isLoading}>
                Hủy
              </Button>
              <Button type="submit" disabled={isLoading} isLoading={isLoading}>
                {id ? 'Cập nhật' : 'Thêm phòng ban'}
              </Button>
            </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
};
