import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { UserPlus, ArrowLeft } from 'lucide-react';
import { authApi } from '@/api/auth.api';

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterForm>();

  const password = watch('password');

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);

    try {
      await authApi.register({
        username: data.username,
        password: data.password,
        role: 'USER',
      });

      setSuccess(true);
    } catch (error) {
      console.error('Register failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Đăng ký thành công!</h2>
          <p className="text-gray-600 mb-6">
            Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.
          </p>
          <Link to="/login">
            <Button className="w-full">
              Đăng nhập ngay
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <UserPlus className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Đăng ký tài khoản</h1>
          <p className="text-gray-600">Tạo tài khoản mới để sử dụng hệ thống</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            error={errors.username?.message}
            {...register('username', {
              required: 'Vui lòng nhập tên đăng nhập',
              minLength: {
                value: 4,
                message: 'Tên đăng nhập phải có ít nhất 4 ký tự',
              },
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Nhập mật khẩu"
            error={errors.password?.message}
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
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
            label="Confirm Password"
            type="password"
            placeholder="Nhập lại mật khẩu"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Vui lòng xác nhận mật khẩu',
              validate: (value) => value === password || 'Mật khẩu xác nhận không khớp',
            })}
          />

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-xs text-blue-800 font-medium mb-1">Yêu cầu mật khẩu:</p>
            <ul className="text-xs text-blue-700 space-y-0.5 list-disc list-inside">
              <li>Ít nhất 8 ký tự</li>
              <li>Chứa chữ hoa, chữ thường, số và ký tự đặc biệt</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Đăng ký
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={16} />
            Đã có tài khoản? Đăng nhập
          </Link>
        </div>
      </div>
    </div>
  );
};
