import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ className = '', children, ...props }: CardProps) => (
  <div
    className={cn(
      'rounded-xl border border-slate-200/80 bg-white/95 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-white/70',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }: CardProps) => (
  <div className={cn('border-b border-slate-200/80 px-5 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: CardProps) => (
  <h2 className={cn('text-base font-semibold tracking-[-0.01em] text-slate-950 sm:text-lg', className)} {...props}>
    {children}
  </h2>
);

export const CardDescription = ({ className = '', children, ...props }: CardProps) => (
  <p className={cn('mt-1 text-sm leading-6 text-slate-600', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }: CardProps) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);
