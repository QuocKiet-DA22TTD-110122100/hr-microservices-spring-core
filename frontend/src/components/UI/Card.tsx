import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const Card = ({ className = '', children, ...props }: CardProps) => (
  <div className={cn('rounded-lg border border-slate-200 bg-white shadow-sm', className)} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }: CardProps) => (
  <div className={cn('border-b border-slate-200 px-5 py-4', className)} {...props}>
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: CardProps) => (
  <h2 className={cn('text-lg font-semibold text-slate-900', className)} {...props}>
    {children}
  </h2>
);

export const CardDescription = ({ className = '', children, ...props }: CardProps) => (
  <p className={cn('mt-1 text-sm text-slate-500', className)} {...props}>
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }: CardProps) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);
