import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { authApi } from '@/api/auth.api';
import { useUIStore } from '@/store/uiStore';
import { ChangePasswordRequest } from '@/types/auth';

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordRequest>();

  const newPassword = watch('newPassword');

  const onSubmit = async (data: ChangePasswordRequest) => {
    setIsLoading(true);
    try {
      await authApi.changePassword(data);
      addNotification({
        type: 'success',
        message: 'Đổi mật khẩu thành công!',
      });
      navigate('/');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Đổi mật khẩu thất bại. Vui lòng thử lại.';
      addNotification({
        type: 'error',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Đổi mật khẩu</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Mật khẩu hiện tại"
              type="password"
              error={errors.oldPassword?.message}
              {...register('oldPassword', {
                required: 'Vui lòng nhập mật khẩu hiện tại',
              })}
            />

            <Input
              label="Mật khẩu mới"
              type="password"
              error={errors.newPassword?.message}
              {...register('newPassword', {
                required: 'Vui lòng nhập mật khẩu mới',
                minLength: {
                  value: 8,
                  message: 'Mật khẩu phải có ít nhất 8 ký tự',
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt',
                },
              })}
            />

            <Input
              label="Xác nhận mật khẩu mới"
              type="password"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', {
                required: 'Vui lòng xác nhận mật khẩu mới',
                validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp',
              })}
            />

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Yêu cầu mật khẩu:</p>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Ít nhất 8 ký tự</li>
                <li>Chứa chữ hoa và chữ thường</li>
                <li>Chứa ít nhất 1 số</li>
                <li>Chứa ít nhất 1 ký tự đặc biệt (@$!%*?&)</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <Button type="submit" isLoading={isLoading}>
                Đổi mật khẩu
              </Button>
              <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                Hủy
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};
