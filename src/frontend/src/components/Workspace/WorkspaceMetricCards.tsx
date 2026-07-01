import { Filter } from 'lucide-react';
import { Card } from '@/components/UI/Card';
import { cn } from '@/utils/cn';
import { WorkspaceMetric } from './types';

interface WorkspaceMetricCardsProps {
  metrics: WorkspaceMetric[];
  onMetricClick?: (index: number) => void;
  activeMetricIndex?: number;
}

export const WorkspaceMetricCards = ({ metrics, onMetricClick, activeMetricIndex }: WorkspaceMetricCardsProps) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {metrics.map((metric, index) => {
      const isActive = activeMetricIndex === index;
      return (
        <Card
          key={metric.label}
          className={cn(
            'group relative overflow-hidden p-5 transition duration-150',
            onMetricClick ? 'cursor-pointer select-none' : '',
            isActive
              ? 'border-cyan-400 bg-cyan-50/50 shadow-[0_8px_20px_rgba(6,182,212,0.12)] -translate-y-0.5'
              : 'hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)]',
          )}
          onClick={onMetricClick ? () => onMetricClick(index) : undefined}
          role={onMetricClick ? 'button' : undefined}
          tabIndex={onMetricClick ? 0 : undefined}
          onKeyDown={
            onMetricClick
              ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onMetricClick(index); } }
              : undefined
          }
        >
          <div
            className={cn(
              'pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r transition',
              isActive
                ? 'opacity-100 from-cyan-600 via-cyan-400 to-transparent'
                : 'opacity-0 group-hover:opacity-100 from-cyan-600 via-slate-300 to-transparent',
            )}
          />
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={cn('text-sm font-medium', isActive ? 'text-cyan-700' : 'text-slate-500')}>
                {metric.label}
              </p>
              <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950">
                {metric.value}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{metric.hint}</p>
            </div>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1',
                isActive
                  ? 'bg-cyan-100 text-cyan-700 ring-cyan-300'
                  : 'bg-slate-100 text-slate-500 ring-slate-200',
              )}
            >
              {isActive ? <Filter size={14} /> : index + 1}
            </span>
          </div>
          {isActive && (
            <p className="mt-3 text-[11px] font-semibold text-cyan-600">
              Đang lọc · Bấm lại để bỏ lọc
            </p>
          )}
        </Card>
      );
    })}
  </section>
);
