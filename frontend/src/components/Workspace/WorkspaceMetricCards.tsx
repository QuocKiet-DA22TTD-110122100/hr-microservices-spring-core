import { Card } from '@/components/UI/Card';
import { WorkspaceMetric } from './types';

interface WorkspaceMetricCardsProps {
  metrics: WorkspaceMetric[];
}

export const WorkspaceMetricCards = ({ metrics }: WorkspaceMetricCardsProps) => (
  <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
    {metrics.map((metric) => (
      <Card key={metric.label} className="p-5">
        <p className="text-sm font-medium text-slate-500">{metric.label}</p>
        <p className="mt-2 text-3xl font-semibold text-slate-900">{metric.value}</p>
        <p className="mt-2 text-sm text-slate-500">{metric.hint}</p>
      </Card>
    ))}
  </section>
);
