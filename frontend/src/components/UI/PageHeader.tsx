import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
}

export const PageHeader = ({ title, description, icon: Icon, actions, className = '' }: PageHeaderProps) => (
  <section className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-sm', className)}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  </section>
);
