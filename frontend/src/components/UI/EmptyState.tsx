import { ReactNode } from 'react';
import { FileText, LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export const EmptyState = ({
  icon: Icon = FileText,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) => (
  <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <Icon size={28} />
    </div>
    <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
    {description && <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
