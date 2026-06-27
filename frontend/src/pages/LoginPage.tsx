import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { AxiosError } from 'axios';
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

type LoginErrorPayload = {
  message?: string;
  error?: string;
  reason?: string;
  detail?: string;
  title?: string;
  code?: string;
};

const getLoginErrorMessage = (error: unknown) => {
  const axiosError = error as AxiosError<LoginErrorPayload>;
  const status = axiosError.response?.status;
  const serverMessage =
    axiosError.response?.data?.message ||
    axiosError.response?.data?.reason ||
    axiosError.response?.data?.detail ||
    axiosError.response?.data?.error ||
    axiosError.response?.data?.title ||
    '';
  const errorCode = axiosError.response?.data?.code || '';
  const normalizedMessage = serverMessage.toLowerCase();

  if (
    errorCode === 'ACCOUNT_LOCKED' ||
    status === 423 ||
    normalizedMessage.includes('account is locked') ||
    normalizedMessage.includes('tai khoan bi khoa') ||
    normalizedMessage.includes('tài khoản bị khóa')
  ) {
    if (normalizedMessage.includes('too many failed attempts')) {
      return 'Tài khoản bị khóa do đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 30 phút.';
    }

    return 'Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên để được mở khóa.';
  }

  if (errorCode === 'INVALID_CREDENTIALS' || normalizedMessage.includes('invalid credentials') || status === 401) {
    return 'Sai tên đăng nhập hoặc mật khẩu.';
  }

  if (errorCode === 'PASSWORD_EXPIRED' || normalizedMessage.includes('password expired') || status === 403) {
    return 'Mật khẩu đã hết hạn. Vui lòng đổi mật khẩu.';
  }

  if (status === 429) {
    return 'Đăng nhập quá nhiều lần. Vui lòng thử lại sau.';
  }

  return getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.');
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setTokens, setUser } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
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
    setFormError(null);

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
      const message = getLoginErrorMessage(error);
      setFormError(message);
      addNotification({
        type: 'error',
        message,
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

        {formError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium leading-6 text-rose-800">
            {formError}
          </div>
        )}

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Đăng nhập
          <ArrowRight size={16} />
        </Button>
      </form>
    </AuthShell>
  );
};
