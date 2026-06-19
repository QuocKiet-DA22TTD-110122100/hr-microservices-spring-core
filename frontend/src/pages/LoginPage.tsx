import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { AuthShell } from '@/components/Auth/AuthShell';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { LoginRequest } from '@/types/auth';
import { decodeJwtClaims, mapClaimsToUser } from '@/utils/authSession';
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

      let claims = decodeJwtClaims(loginResponse.token);
      try {
        const profile = await authApi.getProfile();
        if (profile.valid) {
          claims = profile.claims;
        }
      } catch {
        // The signed JWT already contains the role claims needed for the frontend session.
      }

      setUser(mapClaimsToUser(claims, data.username));

      addNotification({
        type: 'success',
        message: 'Đăng nhập thành công.',
      });

      navigate('/');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      title="Đăng nhập"
      description="Sử dụng tài khoản nội bộ để truy cập workspace phù hợp với vai trò của bạn."
      icon={LockKeyhole}
      eyebrow="Secure sign in"
      footer={
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 text-sm">
            <Link to="/forgot-password" className="font-semibold text-cyan-700 hover:text-cyan-800">
              Quên mật khẩu?
            </Link>
            <Link to="/register" className="inline-flex items-center gap-2 font-semibold text-slate-600 hover:text-slate-900">
              <UserRound size={16} />
              Tạo tài khoản
            </Link>
          </div>
          <div className="flex gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-600" />
            <p>Tài khoản sẽ được kiểm tra token và quyền truy cập trước khi vào hệ thống.</p>
          </div>
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
          Đăng nhập
          <ArrowRight size={16} />
        </Button>
      </form>
    </AuthShell>
  );
};
