import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { KeyRound, ArrowLeft, Mail } from 'lucide-react';

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
    // Giả lập gửi email
    setTimeout(() => {
      setIsLoading(false);
      setSuccess(true);
    }, 1500);
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="text-green-600" size={32} />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Kiểm tra email của bạn</h2>
          <p className="text-gray-600 mb-6">
            Chúng tôi đã gửi hướng dẫn khôi phục mật khẩu đến email của bạn.
            Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
          </p>
          <Link to="/login">
            <Button className="w-full">
              Quay lại đăng nhập
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <KeyRound className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Quên mật khẩu?</h1>
          <p className="text-gray-600">
            Nhập email của bạn và chúng tôi sẽ gửi hướng dẫn khôi phục mật khẩu
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="Nhập email đã đăng ký"
            error={errors.email?.message}
            {...register('email', {
              required: 'Vui lòng nhập email',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Email không hợp lệ',
              },
            })}
          />

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Gửi hướng dẫn khôi phục
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            <ArrowLeft size={16} />
            Quay lại đăng nhập
          </Link>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <span className="font-medium">Lưu ý:</span> Nếu không nhận được email, vui lòng kiểm tra thư mục spam
            hoặc liên hệ quản trị viên.
          </p>
        </div>
      </div>
    </div>
  );
};
