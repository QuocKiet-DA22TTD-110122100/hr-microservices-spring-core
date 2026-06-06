import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization.api';
import { OrganizationUnit, CreateOrganizationUnitRequest, UpdateOrganizationUnitRequest } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Loader } from 'lucide-react';

interface OrganizationFormData {
  name: string;
  code?: string;
  level: 'CORPORATION' | 'TOTAL_COMPANY' | 'MEMBER_COMPANY' | 'DEPARTMENT';
  parentId?: number;
}

const ORG_LEVELS = [
  { value: 'CORPORATION', label: 'Công ty' },
  { value: 'TOTAL_COMPANY', label: 'Tổng công ty' },
  { value: 'MEMBER_COMPANY', label: 'Công ty thành viên' },
  { value: 'DEPARTMENT', label: 'Phòng ban' },
];

export const OrganizationFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(!!id);
  const [organizations, setOrganizations] = useState<OrganizationUnit[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<OrganizationFormData>({
    defaultValues: {
      name: '',
      code: '',
      level: 'CORPORATION',
      parentId: undefined,
    },
  });

  const currentLevel = watch('level');

  // Fetch parent organizations for selection
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

  // Fetch current organization if editing
  const fetchOrganization = async () => {
    if (!id) return;

    try {
      const response = await organizationApi.getById(Number(id));
      const org = response.data;
      setValue('name', org.name);
      setValue('code', org.code);
      setValue('level', org.level);
      setValue('parentId', org.parentId);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải thông tin tổ chức.'),
      });
      navigate('/organizations');
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
    if (id) {
      fetchOrganization();
    } else {
      setPageLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const onSubmit = async (data: OrganizationFormData) => {
    setIsLoading(true);
    try {
      if (id) {
        // Edit mode
        const updateData: UpdateOrganizationUnitRequest = {
          name: data.name,
          code: data.code,
          level: data.level,
          parentId: data.parentId,
        };
        await organizationApi.update(Number(id), updateData);
        addNotification({
          type: 'success',
          message: 'Cập nhật tổ chức thành công!',
        });
      } else {
        // Create mode
        const createData: CreateOrganizationUnitRequest = {
          name: data.name,
          code: data.code,
          level: data.level,
          parentId: data.parentId,
        };
        await organizationApi.create(createData);
        addNotification({
          type: 'success',
          message: 'Thêm tổ chức thành công!',
        });
      }
      navigate('/organizations');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(
          error,
          id ? 'Lỗi khi cập nhật tổ chức.' : 'Lỗi khi thêm tổ chức.'
        ),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Đang lưu...';
    return id ? 'Cập nhật' : 'Thêm tổ chức';
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

  // Determine parent level options based on current level selected
  const getParentLevelOptions = () => {
    switch (currentLevel) {
      case 'TOTAL_COMPANY':
        return organizations.filter((org) => org.level === 'CORPORATION');
      case 'MEMBER_COMPANY':
        return organizations.filter((org) => org.level === 'TOTAL_COMPANY');
      case 'DEPARTMENT':
        return organizations.filter((org) => org.level === 'MEMBER_COMPANY');
      default:
        return [];
    }
  };

  const parentOptions = getParentLevelOptions();

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/organizations')}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">
              {id ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              {id ? 'Cập nhật thông tin tổ chức' : 'Nhập thông tin tổ chức mới'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Tên tổ chức"
                placeholder="Nhập tên tổ chức"
                error={errors.name?.message}
                {...register('name', { required: 'Vui lòng nhập tên tổ chức' })}
              />

              <Input
                label="Mã tổ chức"
                placeholder="Nhập mã tổ chức (tùy chọn)"
                error={errors.code?.message}
                {...register('code')}
              />

              <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">
                  Loại tổ chức
                </label>
                <select
                  id="level"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('level', { required: 'Vui lòng chọn loại tổ chức' })}
                >
                  {ORG_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.level && <span className="text-red-500 text-xs mt-1">{errors.level.message}</span>}
              </div>

              {currentLevel !== 'CORPORATION' && (
                <div>
                  <label htmlFor="parentId" className="block text-sm font-medium text-gray-700 mb-1">
                    Tổ chức cha
                  </label>
                  {parentOptions.length === 0 ? (
                    <div className="px-3 py-2 border border-dashed border-gray-300 rounded-lg bg-gray-50 text-gray-500 text-sm">
                      Không có tổ chức cha khả dụng. Vui lòng tạo tổ chức cha trước.
                    </div>
                  ) : (
                    <select
                      id="parentId"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      {...register('parentId')}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined;
                        setValue('parentId', value);
                      }}
                    >
                      <option value="">Chọn tổ chức cha</option>
                      {parentOptions.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name} {org.code ? `(${org.code})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-8">
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="w-full md:w-auto"
              >
                {isLoading && <Loader size={18} className="mr-2 animate-spin" />}
                {getButtonText()}
              </Button>
              <button
                type="button"
                onClick={() => navigate('/organizations')}
                className="w-full md:w-auto px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
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
