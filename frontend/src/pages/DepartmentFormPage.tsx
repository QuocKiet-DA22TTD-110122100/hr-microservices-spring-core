import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization.api';
import { departmentApi } from '@/api/department.api';
import { OrganizationUnit } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Loader } from 'lucide-react';

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
            onClick={() => navigate('/departments')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {id ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {id ? 'Cập nhật thông tin phòng ban' : 'Nhập thông tin phòng ban mới'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg border shadow-sm p-6">
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
                <label htmlFor="organizationUnitId" className="block text-sm font-medium text-gray-700 mb-1">
                  Tổ chức <span className="text-red-500">*</span>
                </label>
                <select
                  id="organizationUnitId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <div className="flex gap-3 mt-8">
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader size={18} className="mr-2 animate-spin" />}
                {id ? 'Cập nhật' : 'Thêm phòng ban'}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/departments')}
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
