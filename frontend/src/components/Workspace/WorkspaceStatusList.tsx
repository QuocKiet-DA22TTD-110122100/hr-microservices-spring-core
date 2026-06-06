import { cn } from '@/utils/cn';
import { WorkspaceItem } from './types';
import { workspacePriorityStyles, workspaceStatusStyles } from './workspaceStyles';

interface WorkspaceStatusListProps {
  items: WorkspaceItem[];
  selectedItem?: WorkspaceItem;
  onSelectItem: (item: WorkspaceItem) => void;
}

export const WorkspaceStatusList = ({ items, selectedItem, onSelectItem }: WorkspaceStatusListProps) => (
  <div className="divide-y divide-slate-100">
    {items.map((item) => {
      const status = workspaceStatusStyles[item.status];
      const priority = workspacePriorityStyles[item.priority];
      const isSelected = selectedItem?.title === item.title;

      return (
        <button
          key={item.title}
          type="button"
          onClick={() => onSelectItem(item)}
          className={cn(
            'block w-full px-5 py-4 text-left transition-colors hover:bg-cyan-50/50',
            isSelected ? 'bg-cyan-50' : 'bg-white'
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h4 className="font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{item.owner}</span>
                <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">{item.meta}</span>
                <span className={cn('rounded px-2 py-1', priority.className)}>Ưu tiên {priority.label}</span>
              </div>
            </div>
            <span className={cn('inline-flex shrink-0 items-center rounded border px-2.5 py-1 text-xs font-semibold', status.className)}>
              {status.label}
            </span>
          </div>
        </button>
      );
    })}

    {items.length === 0 && (
      <div className="px-5 py-10 text-center">
        <p className="text-sm font-semibold text-slate-700">Không có mục phù hợp</p>
        <p className="mt-1 text-sm text-slate-500">Thử đổi bộ lọc trạng thái để xem dữ liệu khác.</p>
      </div>
    )}
  </div>
);
