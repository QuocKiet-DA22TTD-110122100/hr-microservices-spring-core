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
            'block w-full px-5 py-4 text-left transition-colors',
            'hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-cyan-500/20',
            isSelected ? 'bg-cyan-50/60' : 'bg-white'
          )}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              {/* Title */}
              <h4 className="font-semibold text-slate-900">{item.title}</h4>
              <p className="mt-1 text-sm leading-6 text-slate-500">{item.description}</p>

              {/* Meta tags + assignee row */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {item.meta}
                </span>
                <span className={cn('rounded px-2 py-1 text-xs font-semibold', priority.className)}>
                  Ưu tiên {priority.label}
                </span>
                <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">
                  Hạn: {item.due}
                </span>

                {/* Member avatar badge */}
                {item.assignee && (
                  <span className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white',
                        item.assignee.color
                      )}
                      title={item.assignee.name}
                    >
                      {item.assignee.initial}
                    </span>
                    <span className="text-xs text-slate-600">{item.assignee.name}</span>
                  </span>
                )}
              </div>

              {/* Progress bar — only for inProgress items with progress defined */}
              {item.status === 'inProgress' && item.progress !== undefined && (
                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-500">
                    <span>Tiến độ</span>
                    <span className="font-semibold text-cyan-700">{item.progress}%</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-cyan-600 transition-all duration-500"
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Status badge */}
            <span
              className={cn(
                'inline-flex shrink-0 items-center self-start rounded border px-2.5 py-1 text-xs font-semibold',
                status.className
              )}
            >
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
