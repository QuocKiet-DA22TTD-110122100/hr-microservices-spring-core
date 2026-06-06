import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ChangePasswordForm } from '@/types/auth';
import { getApiErrorMessage } from '@/utils/error';

const passwordRules = [
  { label: 'Ít nhất 8 ký tự', test: (value: string) => value.length >= 8 },
  { label: 'Có chữ hoa và chữ thường', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Có ít nhất 1 số', test: (value: string) => /\d/.test(value) },
  { label: 'Có ký tự đặc biệt @$!%*?&', test: (value: string) => /[@$!%*?&]/.test(value) },
];

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ChangePasswordForm>();

  const newPassword = watch('newPassword') || '';
  const confirmPassword = watch('confirmPassword') || '';

  const passedRules = useMemo(
    () => passwordRules.filter((rule) => rule.test(newPassword)).length,
    [newPassword]
  );

  const onSubmit = async (data: ChangePasswordForm) => {
    setIsLoading(true);

    try {
      if (!user?.username) {
        throw new Error('Không tìm thấy thông tin người dùng hiện tại.');
      }

      await authApi.changePassword({
        username: user.username,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      addNotification({
        type: 'success',
        message: 'Đổi mật khẩu thành công.',
      });
      navigate('/');
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Đổi mật khẩu thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <Card>
          <CardContent className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
              <KeyRound size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Đổi mật khẩu</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                Cập nhật mật khẩu cho tài khoản {user?.username || 'hiện tại'}.
              </p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin mật khẩu</CardTitle>
              <CardDescription>Nhập mật khẩu hiện tại và mật khẩu mới đủ mạnh.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input
                  label="Mật khẩu hiện tại"
                  type="password"
                  autoComplete="current-password"
                  error={errors.oldPassword?.message}
                  {...register('oldPassword', {
                    required: 'Vui lòng nhập mật khẩu hiện tại.',
                  })}
                />

                <Input
                  label="Mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  error={errors.newPassword?.message}
                  {...register('newPassword', {
                    required: 'Vui lòng nhập mật khẩu mới.',
                    validate: (value) =>
                      passwordRules.every((rule) => rule.test(value)) ||
                      'Mật khẩu chưa đáp ứng đầy đủ yêu cầu.',
                  })}
                />

                <Input
                  label="Xác nhận mật khẩu mới"
                  type="password"
                  autoComplete="new-password"
                  error={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Vui lòng xác nhận mật khẩu mới.',
                    validate: (value) => value === newPassword || 'Mật khẩu xác nhận không khớp.',
                  })}
                />

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button type="submit" isLoading={isLoading}>
                    Đổi mật khẩu
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => navigate('/')}>
                    Hủy
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Độ mạnh mật khẩu</CardTitle>
                  <CardDescription>Yêu cầu bảo mật tối thiểu.</CardDescription>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {passedRules}/{passwordRules.length}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {passwordRules.map((rule) => {
                const passed = rule.test(newPassword);

                return (
                  <div key={rule.label} className="flex items-center gap-2 text-sm">
                    {passed ? (
                      <CheckCircle2 size={17} className="text-emerald-600" />
                    ) : (
                      <XCircle size={17} className="text-slate-300" />
                    )}
                    <span className={passed ? 'font-medium text-slate-800' : 'text-slate-500'}>{rule.label}</span>
                  </div>
                );
              })}

              <div className="border-t border-slate-200 pt-3">
                <div className="flex items-center gap-2 text-sm">
                  {confirmPassword && confirmPassword === newPassword ? (
                    <CheckCircle2 size={17} className="text-emerald-600" />
                  ) : (
                    <XCircle size={17} className="text-slate-300" />
                  )}
                  <span className={confirmPassword && confirmPassword === newPassword ? 'font-medium text-slate-800' : 'text-slate-500'}>
                    Xác nhận khớp mật khẩu mới
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};
