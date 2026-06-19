import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-cyan-800 text-white shadow-cyan-900/10 hover:bg-cyan-900 active:bg-cyan-950 focus:ring-cyan-500',
  secondary: 'bg-slate-100 text-slate-950 shadow-slate-900/5 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400',
  danger: 'bg-rose-600 text-white shadow-rose-900/10 hover:bg-rose-700 active:bg-rose-800 focus:ring-rose-500',
  success: 'bg-emerald-600 text-white shadow-emerald-900/10 hover:bg-emerald-700 active:bg-emerald-800 focus:ring-emerald-500',
  ghost: 'bg-transparent text-slate-700 shadow-none hover:bg-slate-100 active:bg-slate-200 focus:ring-slate-400',
  outline: 'border border-slate-300 bg-white text-slate-800 shadow-slate-900/5 hover:border-cyan-500 hover:bg-cyan-50 active:bg-cyan-100 focus:ring-cyan-500',
};

const sizeStyles = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-10 w-10 p-0',
};

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2',
        'shadow-sm active:translate-y-px disabled:pointer-events-none disabled:opacity-55',
        variantStyles[variant],
        sizeStyles[size],
        isDisabled && 'cursor-not-allowed',
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span>Đang xử lý...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};
