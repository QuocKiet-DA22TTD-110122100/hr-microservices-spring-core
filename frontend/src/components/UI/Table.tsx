import { ReactNode, memo } from 'react';
import { AlertCircle, ArrowUpDown, FileText } from 'lucide-react';
import { Button } from '@/components/UI/Button';
import { EmptyState } from '@/components/UI/EmptyState';
import { cn } from '@/utils/cn';

export interface ColumnBase<T, K extends keyof T> {
  key: K;
  title: string;
  sortable?: boolean;
  onSort?: (key: K) => void;
  renderHeader?: () => ReactNode;
}

export interface ColumnWithRender<T, K extends keyof T> extends ColumnBase<T, K> {
  render: (value: T[K], record: T) => ReactNode;
}

export type Column<T> = {
  [K in keyof T]: ColumnBase<T, K> | ColumnWithRender<T, K>;
}[keyof T];

interface TableProps<T extends object> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (record: T) => void;
}

const LoadingSkeleton = memo(({ columns, rows = 5 }: { columns: number; rows?: number }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full">
      <thead className="bg-slate-100/90">
        <tr>
          {Array.from({ length: columns }).map((_, index) => (
            <th key={index} className="border-b border-slate-200 px-6 py-3.5">
              <div className="h-4 w-24 rounded animate-shimmer" />
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <tr key={rowIndex}>
            {Array.from({ length: columns }).map((_, columnIndex) => (
              <td key={columnIndex} className="px-6 py-4">
                <div
                  className="h-4 rounded animate-shimmer"
                  style={{ width: `${60 + ((rowIndex * 3 + columnIndex * 7) % 40)}%` }}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
));

const ErrorState = memo(({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="animate-fade-in rounded-b-xl bg-rose-50/60 px-6 py-2">
    <EmptyState
      icon={AlertCircle}
      title="Có lỗi xảy ra"
      description={message}
      action={onRetry ? <Button onClick={onRetry}>Thử lại</Button> : undefined}
    />
  </div>
));

function TableComponent<T extends object>({
  columns,
  data,
  loading = false,
  error,
  onRetry,
  onRowClick,
}: TableProps<T>) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (loading) {
    return <LoadingSkeleton columns={columns.length} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="animate-fade-in py-2">
        <EmptyState
          icon={FileText}
          title="Không có dữ liệu"
          description="Chưa có bản ghi nào để hiển thị."
        />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="sticky top-0 z-[1] bg-slate-100/95 backdrop-blur">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                data-sortable={column.sortable ? 'true' : undefined}
                tabIndex={column.sortable ? 0 : undefined}
                className={cn(
                  'border-b border-slate-200/80 px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-[0.03em] text-slate-600',
                  column.sortable && 'cursor-pointer select-none transition-colors duration-150 hover:bg-slate-200/70'
                )}
                  onClick={() => column.sortable && column.onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.renderHeader ? column.renderHeader() : column.title}
                    {column.sortable && (
                      <ArrowUpDown size={14} className="text-slate-400 transition-colors group-hover:text-slate-600" />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((record, index) => {
              const recordKey = 'id' in record ? String(record.id) : index;
              const delay = Math.min(index * 40, 400);

              return (
                <tr
                  key={recordKey}
                  onClick={() => onRowClick?.(record)}
                  tabIndex={onRowClick ? 0 : undefined}
                  onKeyDown={(event) => {
                    if (!onRowClick) return;
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      onRowClick(record);
                    }
                  }}
                  className={cn(
                    'animate-fade-up focus:outline-none',
                    'transition-colors duration-150',
                    onRowClick
                      ? 'cursor-pointer hover:bg-blue-50/60 focus:bg-blue-50/60 focus:ring-2 focus:ring-inset focus:ring-blue-500/20'
                      : 'hover:bg-slate-50/80',
                    index % 2 === 1 && 'bg-slate-50/35'
                  )}
                  style={{ animationDelay: `${delay}ms` }}
                >
                  {columns.map((column) => {
                    const value = record[column.key];
                    const content =
                      'render' in column && column.render
                        ? column.render(value, record)
                        : String(value ?? '');

                    return (
                      <td key={String(column.key)} className="whitespace-nowrap px-6 py-4 text-sm text-slate-800">
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
    </div>
  );
}

export const Table = memo(TableComponent) as typeof TableComponent;
