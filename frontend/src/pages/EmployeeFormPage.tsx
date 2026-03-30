import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { useUIStore } from '@/store/uiStore';
import { ArrowLeft } from 'lucide-react';

interface EmployeeFormData {
  employeeCode: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  position: string;
  departmentId: string;
  hireDate: string;
  salary: string;
}

export const EmployeeFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeFormData>();

  const onSubmit = async () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      addNotification({
        type: 'success',
        message: id ? 'Cập nhật nhân viên thành công!' : 'Thêm nhân viên thành công!',
      });
      navigate('/employees');
    }, 1000);
  };

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
              {/* Thông tin cơ bản */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  Thông tin cơ bản
                </h3>
              </div>

              <Input
                label="Mã nhân viên"
                placeholder="Nhập mã nhân viên"
                error={errors.employeeCode?.message}
                {...register('employeeCode', { required: 'Vui lòng nhập mã nhân viên' })}
              />

              <Input
                label="Họ và tên"
                placeholder="Nhập họ và tên đầy đủ"
                error={errors.fullName?.message}
                {...register('fullName', { required: 'Vui lòng nhập họ và tên' })}
              />

              <Input
                label="Email"
                type="email"
                placeholder="Nhập email"
                error={errors.email?.message}
                {...register('email', {
                  required: 'Vui lòng nhập email',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email không hợp lệ',
                  },
                })}
              />

              <Input
                label="Số điện thoại"
                type="tel"
                placeholder="Nhập số điện thoại"
                error={errors.phone?.message}
                {...register('phone', {
                  required: 'Vui lòng nhập số điện thoại',
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: 'Số điện thoại không hợp lệ',
                  },
                })}
              />

              <Input
                label="Ngày sinh"
                type="date"
                error={errors.dateOfBirth?.message}
                {...register('dateOfBirth', { required: 'Vui lòng chọn ngày sinh' })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Giới tính <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('gender', { required: 'Vui lòng chọn giới tính' })}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="MALE">Nam</option>
                  <option value="FEMALE">Nữ</option>
                  <option value="OTHER">Khác</option>
                </select>
                {errors.gender && (
                  <p className="mt-1 text-sm text-red-500">{errors.gender.message}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Địa chỉ"
                  placeholder="Nhập địa chỉ"
                  error={errors.address?.message}
                  {...register('address', { required: 'Vui lòng nhập địa chỉ' })}
                />
              </div>

              {/* Thông tin công việc */}
              <div className="md:col-span-2 mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  Thông tin công việc
                </h3>
              </div>

              <Input
                label="Chức vụ"
                placeholder="Nhập chức vụ"
                error={errors.position?.message}
                {...register('position', { required: 'Vui lòng nhập chức vụ' })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  {...register('departmentId', { required: 'Vui lòng chọn phòng ban' })}
                >
                  <option value="">Chọn phòng ban</option>
                  <option value="1">Phòng IT</option>
                  <option value="2">Phòng Nhân sự</option>
                  <option value="3">Phòng Kế toán</option>
                  <option value="4">Phòng Marketing</option>
                </select>
                {errors.departmentId && (
                  <p className="mt-1 text-sm text-red-500">{errors.departmentId.message}</p>
                )}
              </div>

              <Input
                label="Ngày vào làm"
                type="date"
                error={errors.hireDate?.message}
                {...register('hireDate', { required: 'Vui lòng chọn ngày vào làm' })}
              />

              <Input
                label="Lương (VNĐ)"
                type="number"
                placeholder="Nhập mức lương"
                error={errors.salary?.message}
                {...register('salary')}
              />
            </div>

            <div className="flex gap-3 mt-6 pt-6 border-t">
              <Button type="submit" isLoading={isLoading}>
                {id ? 'Cập nhật' : 'Thêm mới'}
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/employees')}>
                Hủy
              </Button>
            </div>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};
