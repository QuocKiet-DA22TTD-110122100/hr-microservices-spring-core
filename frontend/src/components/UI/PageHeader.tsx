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
  <section
    className={cn(
      'relative overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 p-5 shadow-[0_1px_2px_rgba(15,23,42,0.05)] ring-1 ring-white/70',
      className
    )}
  >
    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-cyan-100 bg-cyan-50 text-cyan-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
            <Icon size={22} />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h1>
          {description && <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </div>
  </section>
);
