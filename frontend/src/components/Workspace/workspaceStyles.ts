import { WorkspacePriority, WorkspaceStatus } from './types';

export const workspaceStatusStyles: Record<
  WorkspaceStatus,
  { label: string; className: string; badge: 'warning' | 'success' | 'info' | 'danger' }
> = {
  pending: {
    label: 'Chờ xử lý',
    className: 'border-amber-200 bg-amber-50 text-amber-700',
    badge: 'warning',
  },
  approved: {
    label: 'Đã duyệt',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    badge: 'success',
  },
  inProgress: {
    label: 'Đang xử lý',
    className: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    badge: 'info',
  },
  blocked: {
    label: 'Cần chú ý',
    className: 'border-rose-200 bg-rose-50 text-rose-700',
    badge: 'danger',
  },
};

export const workspacePriorityStyles: Record<WorkspacePriority, { label: string; className: string }> = {
  high: { label: 'Cao', className: 'bg-rose-50 text-rose-700' },
  medium: { label: 'Vừa', className: 'bg-amber-50 text-amber-700' },
  normal: { label: 'Bình thường', className: 'bg-slate-100 text-slate-600' },
};
