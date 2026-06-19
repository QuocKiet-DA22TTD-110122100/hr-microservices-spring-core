import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  children: ReactNode;
}

const badgeStyles = {
  default: 'border-slate-200 bg-white text-slate-700 shadow-slate-900/5',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800 shadow-emerald-900/5',
  warning: 'border-amber-200 bg-amber-50 text-amber-800 shadow-amber-900/5',
  danger: 'border-rose-200 bg-rose-50 text-rose-800 shadow-rose-900/5',
  info: 'border-cyan-200 bg-cyan-50 text-cyan-800 shadow-cyan-900/5',
  muted: 'border-slate-200 bg-slate-100 text-slate-700 shadow-slate-900/5',
};

export const Badge = ({ variant = 'default', className = '', children, ...props }: BadgeProps) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-1 text-xs font-semibold leading-none shadow-sm',
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
