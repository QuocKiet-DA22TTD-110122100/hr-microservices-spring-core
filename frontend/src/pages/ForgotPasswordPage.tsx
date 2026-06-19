import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, KeyRound, Mail, ShieldAlert } from 'lucide-react';
import { AuthShell } from '@/components/Auth/AuthShell';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';

interface ForgotPasswordForm {
  email: string;
}

export const ForgotPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>();

  const onSubmit = async () => {
    setIsLoading(true);
    window.setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 900);
  };

  if (success) {
    return (
      <AuthShell
        title="Kiểm tra email của bạn"
        description="Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu sẽ được gửi đến hộp thư của bạn."
        icon={Mail}
        eyebrow="Recovery sent"
      >
        <Link to="/login" className="block">
          <Button className="w-full">Quay lại đăng nhập</Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Khôi phục mật khẩu"
      description="Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu."
      icon={KeyRound}
      eyebrow="Password recovery"
      footer={
        <div className="space-y-4">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
          <div className="flex gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <ShieldAlert size={18} className="mt-0.5 shrink-0" />
            <p>Nếu không nhận được email, hãy kiểm tra thư mục spam hoặc liên hệ quản trị viên.</p>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="Nhập email đã đăng ký"
          error={errors.email?.message}
          {...register('email', {
            required: 'Vui lòng nhập email.',
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Email không hợp lệ.',
            },
          })}
        />

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Gửi hướng dẫn khôi phục
        </Button>
      </form>
    </AuthShell>
  );
};
