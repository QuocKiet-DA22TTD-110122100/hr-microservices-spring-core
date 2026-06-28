import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted' | 'accent' | 'dark';
  children: ReactNode;
}

const badgeStyles = {
  default: 'border-slate-200 bg-white text-slate-700',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  danger:  'border-rose-200 bg-rose-50 text-rose-800',
  info:    'border-blue-200 bg-blue-50 text-blue-800',
  muted:   'border-slate-200 bg-slate-100 text-slate-700',
  /* Lumora-style */
  accent:  'border-[#e8c8a8] bg-[#fdf3ea] text-[#b15f2c]',
  dark:    'border-transparent bg-[#0a0a0a] text-white',
};

export const Badge = ({ variant = 'default', className = '', children, ...props }: BadgeProps) => (
  <span
    className={cn(
      'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold leading-none',
      'shadow-sm ring-1 ring-white/60',
      'animate-scale-in',
      'transition-[box-shadow,transform] duration-150 hover:shadow-md',
      badgeStyles[variant],
      className
    )}
    {...props}
  >
    {children}
  </span>
);
