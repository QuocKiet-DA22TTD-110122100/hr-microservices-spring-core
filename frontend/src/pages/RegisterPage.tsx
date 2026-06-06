import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, CheckCircle2, UserPlus } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/Auth/AuthShell';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';

interface RegisterForm {
  username: string;
  password: string;
  confirmPassword: string;
}

export const RegisterPage = () => {
  const { addNotification } = useUIStore();
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

      addNotification({
        type: 'success',
        message: 'đăng ký thành công.',
      });
      setSuccess(true);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'đăng ký thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="đăng ký thành công"
        description="Tài khoản của bạn đã được tạo. Vui lòng đăng nhập đã tiếp tục."
        icon={CheckCircle2}
      >
        <Link to="/login">
          <Button className="w-full">đăng nhập ngay</Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="đăng ký tài khoản"
      description="Tạo tài khoản người dùng cơ bản. Admin có thể cấp thêm role sau khi tài khoản được tạo."
      icon={UserPlus}
      footer={
        <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
          <ArrowLeft size={16} />
          Đã có tài khoản? Đăng nhập
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên đăng nhập"
          type="text"
          autoComplete="username"
          placeholder="Nhập tên đăng nhập"
          error={errors.username?.message}
          {...register('username', {
            required: 'Vui lòng nhập tên đăng nhập.',
            minLength: {
              value: 4,
              message: 'Tên đăng nhập phải có ít nhất 4 ký tự.',
            },
          })}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Nhập mật khẩu"
          error={errors.password?.message}
          {...register('password', {
            required: 'Vui lòng nhập mật khẩu.',
            minLength: {
              value: 8,
              message: 'Mật khẩu phải có ít nhất 8 ký tự.',
            },
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
              message: 'Mật khẩu phải chứa chữ hoa, chữ thường, số và ký tự đặc biệt.',
            },
          })}
        />

        <Input
          label="Xác nhận mật khẩu"
          type="password"
          autoComplete="new-password"
          placeholder="Nhập lại mật khẩu"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Vui lòng xác nhận mật khẩu.',
            validate: (value) => value === password || 'Mật khẩu xác nhận không khớp.',
          })}
        />

        <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-3">
          <p className="text-xs font-semibold text-cyan-900">Yêu cầu mật khẩu</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5 text-xs text-cyan-800">
            <li>Ít nhất 8 ký tự</li>
            <li>Chứa chữ hoa, chữ thường, số và ký tự đặc biệt</li>
          </ul>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          đăng ký
        </Button>
      </form>
    </AuthShell>
  );
};
