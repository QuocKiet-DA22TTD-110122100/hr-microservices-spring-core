import { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hoverable?: boolean;
}

export const Card = ({ className = '', children, hoverable = false, ...props }: CardProps) => (
  <div
    className={cn(
      'surface-panel-quiet rounded-xl',
      'transition-[transform,box-shadow,border-color] duration-200 ease-out',
      hoverable && 'card-hover cursor-pointer',
      className
    )}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader = ({ className = '', children, ...props }: Omit<CardProps, 'hoverable'>) => (
  <div
    className={cn('border-b border-slate-200/80 bg-slate-50/70 px-5 py-4', className)}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle = ({ className = '', children, ...props }: Omit<CardProps, 'hoverable'>) => (
  <h2
    className={cn('font-display text-base font-bold tracking-[-0.01em] text-slate-950 sm:text-lg', className)}
    {...props}
  >
    {children}
  </h2>
);

export const CardDescription = ({ className = '', children, ...props }: Omit<CardProps, 'hoverable'>) => (
  <p
    className={cn('mt-1 max-w-prose text-sm leading-6 text-slate-600 text-pretty', className)}
    {...props}
  >
    {children}
  </p>
);

export const CardContent = ({ className = '', children, ...props }: Omit<CardProps, 'hoverable'>) => (
  <div className={cn('p-5', className)} {...props}>
    {children}
  </div>
);
