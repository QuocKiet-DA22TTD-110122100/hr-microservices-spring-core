import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { ArrowLeft } from 'lucide-react';

interface DepartmentFormData {
  code: string;
  name: string;
  description: string;
  managerId: string;
  parentDepartmentId: string;
}

export const DepartmentFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DepartmentFormData>();

  const onSubmit = async (data: DepartmentFormData) => {
    console.log('Form data:', data);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addNotification({
        type: 'success',
        message: id ? 'Cập nhật phòng ban thành công!' : 'Thêm phòng ban thành công!',
      });
      navigate('/departments');
    }, 1000);
  };

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
                placeholder="Nhập mã phòng ban"
                error={errors.code?.message}
                {...register('code', { required: 'Vui lòng nhập mã phòng ban' })}
              />

              <Input
                label="Tên phòng ban"
                placeholder="Nhập tên phòng ban"
                error={errors.name?.message}
                {...register('name', { required: 'Vui lòng nhập tên phòng ban' })}
              />

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Nhập mô tả về phòng ban"
                  {...register('description')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Trưởng phòng
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('managerId')}
                >
                  <option value="">Chọn trưởng phòng</option>
                  <option value="1">Nguyễn Văn A</option>
                  <option value="2">Trần Thị B</option>
                  <option value="3">Lê Văn C</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban cha
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('parentDepartmentId')}
                >
                  <option value="">Không có (Phòng ban cấp cao nhất)</option>
                  <option value="1">Ban Giám đốc</option>
                  <option value="2">Phòng Hành chính</option>
                  <option value="3">Phòng Kinh doanh</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button type="submit" isLoading={isLoading}>
                {id ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/departments')}>
                Hủy
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
