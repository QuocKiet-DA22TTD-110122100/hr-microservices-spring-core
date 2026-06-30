import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, KeyRound, Mail, RotateCcw, XCircle } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { PageHeader } from '@/components/UI/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { ChangePasswordForm } from '@/types/auth';
import { getApiErrorMessage } from '@/utils/error';
import { cn } from '@/utils/cn';

const OTP_TTL = 60;

const passwordRules = [
  { label: 'Ít nhất 8 ký tự', test: (value: string) => value.length >= 8 },
  { label: 'Có chữ hoa và chữ thường', test: (value: string) => /[A-Z]/.test(value) && /[a-z]/.test(value) },
  { label: 'Có ít nhất 1 số', test: (value: string) => /\d/.test(value) },
  { label: 'Có ký tự đặc biệt @$!%*?&', test: (value: string) => /[@$!%*?&]/.test(value) },
];

const OtpInput = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleKey = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, i) => (i === index ? '' : d)).join('');
      onChange(next.trimEnd());
      if (index > 0) refs.current[index - 1]?.focus();
    }
  };

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1);
    const next = digits.map((d, i) => (i === index ? char : d)).join('').slice(0, 6);
    onChange(next);
    if (char && index < 5) refs.current[index + 1]?.focus();
  };

  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 6 }, (_, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i] ?? ''}
          disabled={disabled}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            'h-12 w-10 rounded-lg border text-center text-lg font-bold text-slate-900',
            'transition-[border-color,box-shadow] duration-150',
            'focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20',
            digits[i] ? 'border-cyan-400 bg-cyan-50' : 'border-slate-300 bg-white',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          aria-label={`Chữ số OTP thứ ${i + 1}`}
        />
      ))}
    </div>
  );
};

export const ChangePasswordPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpLoading, setOtpLoading] = useState(false);

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

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleRequestOtp = async () => {
    setOtpLoading(true);
    try {
      // Phase 2: POST /api/v1/auth/change-password/request-otp
      // await authApi.requestOtp({ username: user?.username });
      await new Promise((r) => setTimeout(r, 600));
      setOtpSent(true);
      setCountdown(OTP_TTL);
      setOtpCode('');
      addNotification({
        type: 'success',
        message: `Mã OTP đã được gửi đến email của ${user?.username || 'bạn'}. (Phase 2 — backend endpoint chưa có)`,
      });
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Không thể gửi mã OTP. Vui lòng thử lại.'),
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const onSubmit = async (data: ChangePasswordForm) => {
    if (otpSent && otpCode.length < 6) {
      addNotification({ type: 'error', message: 'Vui lòng nhập đầy đủ mã OTP 6 chữ số.' });
      return;
    }

    setIsLoading(true);
    try {
      if (!user?.username) throw new Error('Không tìm thấy thông tin người dùng hiện tại.');

      // Phase 2: POST /api/v1/auth/change-password/verify-and-update (with otpCode)
      await authApi.changePassword({
        username: user.username,
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      addNotification({ type: 'success', message: 'Đổi mật khẩu thành công.' });
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
        <PageHeader
          icon={KeyRound}
          title="Đổi mật khẩu"
          description={`Cập nhật mật khẩu cho tài khoản ${user?.username || 'hiện tại'}.`}
        />

        {/* OTP request panel */}
        <div className={cn(
          'flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between',
          otpSent
            ? 'border-cyan-200 bg-cyan-50/60'
            : 'border-slate-200 bg-white shadow-sm'
        )}>
          <div className="flex items-start gap-3">
            <div className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
              otpSent ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-600'
            )}>
              <Mail size={19} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {otpSent ? 'Mã OTP đã được gửi' : 'Xác thực qua Email (khuyến nghị)'}
              </p>
              <p className="mt-0.5 text-sm text-slate-600">
                {otpSent
                  ? `Kiểm tra hộp thư của ${user?.username || 'bạn'} — mã hết hạn sau ${countdown}s.`
                  : 'Gửi mã OTP 6 số về email để bảo vệ tài khoản trước khi đổi mật khẩu.'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant={otpSent ? 'outline' : 'secondary'}
            size="sm"
            isLoading={otpLoading}
            disabled={countdown > 0}
            onClick={() => void handleRequestOtp()}
            className="shrink-0"
          >
            {otpSent ? (
              <>
                <RotateCcw size={15} />
                {countdown > 0 ? `Gửi lại sau ${countdown}s` : 'Gửi lại mã'}
              </>
            ) : (
              <>
                <Mail size={15} />
                Gửi mã xác nhận
              </>
            )}
          </Button>
        </div>

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

                {/* OTP input — hiện khi đã gửi mã */}
                {otpSent && (
                  <div className="rounded-lg border border-cyan-200 bg-cyan-50/40 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-800">Nhập mã OTP từ email</p>
                    <OtpInput value={otpCode} onChange={setOtpCode} disabled={isLoading} />
                    {otpCode.length === 6 && (
                      <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                        <CheckCircle2 size={13} />
                        Mã OTP đã nhập đủ
                      </p>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                  <Button
                    type="submit"
                    isLoading={isLoading}
                    disabled={otpSent && otpCode.length < 6}
                  >
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
                <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
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
                      <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                    ) : (
                      <XCircle size={17} className="shrink-0 text-slate-300" />
                    )}
                    <span className={passed ? 'font-medium text-slate-800' : 'text-slate-600'}>
                      {rule.label}
                    </span>
                  </div>
                );
              })}

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-sm">
                  {confirmPassword && confirmPassword === newPassword ? (
                    <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle size={17} className="shrink-0 text-slate-300" />
                  )}
                  <span className={
                    confirmPassword && confirmPassword === newPassword
                      ? 'font-medium text-slate-800'
                      : 'text-slate-600'
                  }>
                    Xác nhận khớp mật khẩu mới
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-sm">
                  {otpSent && otpCode.length === 6 ? (
                    <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
                  ) : (
                    <XCircle size={17} className="shrink-0 text-slate-300" />
                  )}
                  <span className={
                    otpSent && otpCode.length === 6 ? 'font-medium text-slate-800' : 'text-slate-600'
                  }>
                    Xác thực email OTP
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
