import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { LockKeyhole, UserRound } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/Auth/AuthShell';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LoginRequest } from '@/types/auth';
import { mapClaimsToUser } from '@/utils/authSession';
import { getApiErrorMessage } from '@/utils/error';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const lastSubmitAtRef = useRef(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginRequest>();

  const onSubmit = async (data: LoginRequest) => {
    const now = Date.now();
    if (now - lastSubmitAtRef.current < 1000) return;

    lastSubmitAtRef.current = now;
    setIsLoading(true);

    try {
      const loginResponse = await authApi.login(data);
      setTokens(loginResponse.token, '');

      const profile = await authApi.getProfile();
      if (!profile.valid) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      setUser(mapClaimsToUser(profile.claims, data.username));

      addNotification({
        type: 'success',
        message: 'đăng nhập thành công.',
      });

      navigate('/');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'đăng nhập thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="đăng nhập"
      description="Sử dụng tài khoản nội bộ để tiếp tục vào hệ thống HR Core."
      icon={LockKeyhole}
      footer={
        <div className="flex items-center justify-between gap-3 text-sm">
          <Link to="/forgot-password" className="font-semibold text-cyan-700 hover:text-cyan-800">
            Quên mật khẩu?
          </Link>
          <Link to="/register" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900">
            <UserRound size={16} />
            Tạo tài khoản
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Tên đăng nhập"
          type="text"
          autoComplete="username"
          placeholder="admin hoặc mã nhân viên"
          error={errors.username?.message}
          {...register('username', {
            required: 'Vui lòng nhập tên đăng nhập.',
          })}
        />

        <Input
          label="Mật khẩu"
          type="password"
          autoComplete="current-password"
          placeholder="Nhập mật khẩu"
          error={errors.password?.message}
          {...register('password', {
            required: 'Vui lòng nhập mật khẩu.',
          })}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          đăng nhập
        </Button>
      </form>
    </AuthShell>
  );
};
