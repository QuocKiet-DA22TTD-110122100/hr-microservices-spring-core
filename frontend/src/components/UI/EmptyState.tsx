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
  <div className={cn('relative flex flex-col items-center justify-center overflow-hidden px-6 py-12 text-center', className)}>
    <div className="pointer-events-none absolute inset-x-8 top-8 h-24 rounded-full bg-cyan-100/45 blur-3xl" />
    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 shadow-sm">
      <Icon size={28} strokeWidth={1.8} />
    </div>
    <h3 className="relative mt-4 text-base font-semibold tracking-[-0.01em] text-slate-950">{title}</h3>
    {description && <p className="relative mt-2 max-w-sm text-sm leading-6 text-slate-600">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
