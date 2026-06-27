import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  actions?: ReactNode;
  className?: string;
  centered?: boolean;
}

export const PageHeader = ({ title, description, icon: Icon, actions, className = '', centered = false }: PageHeaderProps) => (
  <section
    className={cn(
      'surface-panel relative overflow-hidden rounded-xl p-5',
      'animate-fade-in',
      centered && 'py-7',
      className
    )}
  >
    {/* top accent bar */}
    <div className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-blue-600 via-cyan-500 to-slate-300" />

    {/* decorative glow */}
    <div className="pointer-events-none absolute right-0 top-0 h-28 w-64 bg-[radial-gradient(circle_at_top_right,rgba(14,116,144,0.10),transparent_70%)]" />

    {centered ? (
      <>
        <div className="flex flex-col items-center gap-3 text-center">
          {Icon && (
            <div
              className={cn(
                'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl',
                'border border-blue-100/80 bg-gradient-to-b from-blue-50 to-cyan-50 text-blue-700',
                'shadow-[0_1px_2px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]',
                'animate-scale-in'
              )}
            >
              <Icon size={24} />
            </div>
          )}
          <div>
            <h1
              className={cn(
                'text-2xl font-semibold tracking-[-0.02em] text-slate-950',
                'animate-fade-up'
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  'mt-1.5 max-w-xl text-sm leading-6 text-slate-600',
                  'animate-fade-up'
                )}
                style={{ animationDelay: '40ms' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div
            className="absolute right-5 top-5 flex shrink-0 flex-wrap gap-2 animate-fade-in"
            style={{ animationDelay: '80ms' }}
          >
            {actions}
          </div>
        )}
      </>
    ) : (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          {Icon && (
            <div
              className={cn(
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                'border border-blue-100/80 bg-gradient-to-b from-blue-50 to-cyan-50 text-blue-700',
                'shadow-[0_1px_2px_rgba(37,99,235,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]',
                'transition-transform duration-300 hover:scale-105',
                'animate-scale-in'
              )}
            >
              <Icon size={22} />
            </div>
          )}
          <div className="min-w-0">
            <h1
              className={cn(
                'text-2xl font-semibold tracking-[-0.02em] text-slate-950 text-balance',
                'animate-fade-up'
              )}
            >
              {title}
            </h1>
            {description && (
              <p
                className={cn(
                  'mt-2 max-w-3xl text-sm leading-6 text-slate-600 text-pretty',
                  'animate-fade-up'
                )}
                style={{ animationDelay: '40ms' }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        {actions && (
          <div
            className="flex shrink-0 flex-wrap gap-2 animate-fade-in"
            style={{ animationDelay: '80ms' }}
          >
            {actions}
          </div>
        )}
      </div>
    )}
  </section>
);
