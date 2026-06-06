import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
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
      >
        <Link to="/login">
          <Button className="w-full">Quay lỗi đăng nhập</Button>
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Quên mật khẩu?"
      description="Nhập email đã đăng ký đã nh?n hưởng d?n khôi phục mật khẩu."
      icon={KeyRound}
      footer={
        <>
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 hover:text-cyan-800">
            <ArrowLeft size={16} />
            Quay lỗi đăng nhập
          </Link>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Lưu ý:</span> Nếu không nh?n được email, hãy kiểm tra thư mục spam hoặc
              liên hệ quản trị viên.
            </p>
          </div>
        </>
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
