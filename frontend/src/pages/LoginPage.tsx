import { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { LoginRequest, User } from '@/types/auth';
import { authApi } from '@/api/auth.api';
import { getApiErrorMessage } from '@/utils/error';

const toStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toStringClaim = (value: unknown, fallback: string): string => {
  return typeof value === 'string' && value.trim() ? value : fallback;
};

const mapClaimsToUser = (claims: Record<string, unknown>, fallbackUsername: string): User => {
  const username = toStringClaim(claims.username ?? claims.sub, fallbackUsername);
  const roles = toStringArray(claims.roles);
  const permissions = toStringArray(claims.permissions);
  const expiresAt = typeof claims.exp === 'number'
    ? new Date(claims.exp * 1000).toISOString()
    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    id: toStringClaim(claims.userId ?? claims.sub, username),
    username,
    email: toStringClaim(claims.email, `${username}@company.com`),
    fullName: toStringClaim(claims.fullName, username),
    roles,
    permissions,
    passwordExpiresAt: expiresAt,
    isLocked: false,
  };
};

export const LoginPage = () => {
  const navigate = useNavigate();
  const { setUser, setTokens } = useAuthStore();
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
    if (now - lastSubmitAtRef.current < 1000) {
      return;
    }

    lastSubmitAtRef.current = now;
    setIsLoading(true);

    try {
      const loginResponse = await authApi.login(data);
      setTokens(loginResponse.token, '');

      const profile = await authApi.getProfile();
      if (!profile.valid) {
        throw new Error('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
      }

      const user = mapClaimsToUser(profile.claims as Record<string, unknown>, data.username);
      setUser(user);

      addNotification({
        type: 'success',
        message: 'Đăng nhập thành công!',
      });

      navigate('/');
    } catch (error: unknown) {
      const message = getApiErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.');
      addNotification({
        type: 'error',
        message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Hệ thống Quản lý Nhân sự</h1>
          <p className="text-gray-600">Đăng nhập để tiếp tục</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Username"
            type="text"
            placeholder="Nhập tên đăng nhập"
            error={errors.username?.message}
            {...register('username', {
              required: 'Vui lòng nhập tên đăng nhập',
            })}
          />

          <Input
            label="Password"
            type="password"
            placeholder="Nhập mật khẩu"
            error={errors.password?.message}
            {...register('password', {
              required: 'Vui lòng nhập mật khẩu',
            })}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Đăng nhập
          </Button>
        </form>

        <div className="mt-6 space-y-3">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Hoặc</span>
            </div>
          </div>

          <div className="text-center">
            <span className="text-sm text-gray-600">Chưa có tài khoản? </span>
            <Link
              to="/register"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
