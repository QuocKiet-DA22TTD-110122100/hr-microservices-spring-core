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
  <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead className="bg-slate-50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="border-b border-slate-200 px-5 py-3">
                <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, columnIndex) => (
                <td key={columnIndex} className="px-5 py-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
));

const ErrorState = memo(({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="rounded-lg border border-rose-200 bg-white">
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

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white">
        <EmptyState
          icon={FileText}
          title="Không có dữ liệu"
          description="Chưa có bản ghi nào để hiển thị."
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={cn(
                    'border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                    column.sortable && 'cursor-pointer select-none hover:bg-slate-100'
                  )}
                  onClick={() => column.sortable && column.onSort?.(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.renderHeader ? column.renderHeader() : column.title}
                    {column.sortable && <ArrowUpDown size={14} className="text-slate-400" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((record, index) => {
              const recordKey = 'id' in record ? String(record.id) : index;

              return (
                <tr
                  key={recordKey}
                  onClick={() => onRowClick?.(record)}
                  className={cn(onRowClick && 'cursor-pointer hover:bg-cyan-50/50')}
                >
                  {columns.map((column) => {
                    const value = record[column.key];
                    const content = 'render' in column && column.render ? column.render(value, record) : String(value ?? '');

                    return (
                      <td key={String(column.key)} className="whitespace-nowrap px-5 py-4 text-sm text-slate-800">
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
    </div>
  );
}

export const Table = memo(TableComponent) as typeof TableComponent;
