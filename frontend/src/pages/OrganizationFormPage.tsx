import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { useUIStore } from '@/store/uiStore';
import { organizationApi } from '@/api/organization.api';
import { OrganizationUnit, CreateOrganizationUnitRequest, UpdateOrganizationUnitRequest } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';
import { ArrowLeft, Layers, Loader } from 'lucide-react';

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
          <Loader size={32} className="animate-spin text-cyan-600" />
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
        <PageHeader
          icon={Layers}
          title={id ? 'Chỉnh sửa tổ chức' : 'Thêm tổ chức mới'}
          description={id ? 'Cập nhật tên, mã và quan hệ cha con của tổ chức.' : 'Tạo đơn vị mới trong cây tổ chức HR.'}
          actions={
            <Button type="button" variant="outline" onClick={() => navigate('/organizations')}>
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
                <label htmlFor="level" className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Loại tổ chức
                </label>
                <select
                  id="level"
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
                  {...register('level', { required: 'Vui lòng chọn loại tổ chức' })}
                >
                  {ORG_LEVELS.map((level) => (
                    <option key={level.value} value={level.value}>
                      {level.label}
                    </option>
                  ))}
                </select>
                {errors.level && <span className="mt-1.5 block text-sm text-rose-600">{errors.level.message}</span>}
              </div>

              {currentLevel !== 'CORPORATION' && (
                <div>
                  <label htmlFor="parentId" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tổ chức cha
                  </label>
                  {parentOptions.length === 0 ? (
                    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                      Không có tổ chức cha khả dụng. Vui lòng tạo tổ chức cha trước.
                    </div>
                  ) : (
                    <select
                      id="parentId"
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 shadow-[0_1px_1px_rgba(15,23,42,0.04)] transition hover:border-slate-500 focus:border-cyan-600 focus:outline-none focus:ring-2 focus:ring-cyan-700/15"
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

            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/organizations')}
                disabled={isLoading || isSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                isLoading={isLoading}
              >
                {getButtonText()}
              </Button>
            </div>
            </CardContent>
          </Card>
        </form>
      </div>
    </MainLayout>
  );
};
