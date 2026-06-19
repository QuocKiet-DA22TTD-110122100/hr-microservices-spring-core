import { Card } from '@/components/UI/Card';
import { WorkspaceMetric } from './types';

interface WorkspaceMetricCardsProps {
  metrics: WorkspaceMetric[];
}

export const WorkspaceMetricCards = ({ metrics }: WorkspaceMetricCardsProps) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {metrics.map((metric, index) => (
      <Card key={metric.label} className="group relative overflow-hidden p-5 transition duration-150 hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-[0_12px_24px_rgba(15,23,42,0.07)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-600 via-slate-300 to-transparent opacity-0 transition group-hover:opacity-100" />
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-500">{metric.label}</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950">{metric.value}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{metric.hint}</p>
          </div>
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-500 ring-1 ring-slate-200">
            {index + 1}
          </span>
        </div>
      </Card>
    ))}
  </section>
);
