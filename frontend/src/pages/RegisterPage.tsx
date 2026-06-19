import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, ArrowRight, CheckCircle2, UserPlus } from 'lucide-react';
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

const passwordRuleClass = (passed: boolean) =>
  `flex items-center gap-2 text-xs ${passed ? 'text-emerald-700' : 'text-slate-500'}`;

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

  const password = watch('password') || '';

  const passwordRules = useMemo(
    () => [
      { label: 'Ít nhất 8 ký tự', passed: password.length >= 8 },
      { label: 'Có chữ hoa và chữ thường', passed: /[A-Z]/.test(password) && /[a-z]/.test(password) },
      { label: 'Có số và ký tự đặc biệt', passed: /\d/.test(password) && /[@$!%*?&]/.test(password) },
    ],
    [password]
  );

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
        message: 'Đăng ký thành công.',
      });
      setSuccess(true);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthShell
        title="Đăng ký thành công"
        description="Tài khoản của bạn đã được tạo với quyền USER. Admin có thể cấp thêm vai trò khi cần."
        icon={CheckCircle2}
        eyebrow="Account created"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
            Bạn có thể đăng nhập ngay để vào khu vực tài khoản người dùng.
          </div>
          <Link to="/login" className="block">
            <Button className="w-full">
              Đăng nhập ngay
              <ArrowRight size={16} />
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Tạo tài khoản"
      description="Tạo tài khoản người dùng cơ bản. Các quyền nâng cao sẽ do quản trị viên cấp sau."
      icon={UserPlus}
      eyebrow="New account"
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

        <div className="rounded-md border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Yêu cầu mật khẩu</p>
          <div className="mt-3 grid gap-2">
            {passwordRules.map((rule) => (
              <div key={rule.label} className={passwordRuleClass(rule.passed)}>
                <CheckCircle2 size={15} className={rule.passed ? 'text-emerald-600' : 'text-slate-300'} />
                <span>{rule.label}</span>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Tạo tài khoản
          <ArrowRight size={16} />
        </Button>
      </form>
    </AuthShell>
  );
};
