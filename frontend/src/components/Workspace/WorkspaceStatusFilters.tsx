import { cn } from '@/utils/cn';
import { WorkspaceStatus } from './types';

export type WorkspaceFilter = 'all' | WorkspaceStatus;

export const workspaceFilterOptions: Array<{ value: WorkspaceFilter; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ xử lý' },
  { value: 'inProgress', label: 'Đang xử lý' },
  { value: 'blocked', label: 'Cần chú ý' },
  { value: 'approved', label: 'Đã duyệt' },
];

interface WorkspaceStatusFiltersProps {
  activeFilter: WorkspaceFilter;
  onFilterChange: (filter: WorkspaceFilter) => void;
}

export const WorkspaceStatusFilters = ({ activeFilter, onFilterChange }: WorkspaceStatusFiltersProps) => (
  <div className="flex flex-wrap gap-2">
    {workspaceFilterOptions.map((option) => (
      <button
        key={option.value}
        type="button"
        onClick={() => onFilterChange(option.value)}
        className={cn(
          'h-8 rounded-md border px-3 text-sm font-semibold transition-colors',
          activeFilter === option.value
            ? 'border-cyan-600 bg-cyan-600 text-white'
            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
        )}
      >
        {option.label}
      </button>
    ))}
  </div>
);
