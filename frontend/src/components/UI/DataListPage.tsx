import { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { Table, type Column } from '@/components/UI/Table';
import { cn } from '@/utils/cn';

export interface PaginationConfig {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  pageSize?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (pageSize: number) => void;
  itemLabel?: string;
}

interface DataListPageProps<T extends object> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: ReactNode;
  summary?: ReactNode;
  filters?: ReactNode;
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  onRowClick?: (record: T) => void;
  pagination?: PaginationConfig;
  className?: string;
}

export const TablePagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  itemLabel = 'bản ghi',
}: PaginationConfig) => {
  if (totalPages <= 1 && !onPageSizeChange) return null;

  const startItem = totalItems && pageSize ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : undefined;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : undefined;
  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    if (totalPages <= 5) return index + 1;
    if (currentPage <= 3) return index + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + index;
    return currentPage - 2 + index;
  });

  return (
    <nav
      className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 md:flex-row md:items-center md:justify-between"
      aria-label="Điều hướng trang"
    >
      <div className="flex flex-wrap items-center gap-3">
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined && (
          <span className="text-sm text-slate-600" role="status" aria-live="polite">
            Hiển thị {startItem} - {endItem} trong tổng số {totalItems} {itemLabel}
          </span>
        )}
        {onPageSizeChange && pageSize && pageSizeOptions && (
          <div className="flex items-center gap-2">
            <label htmlFor="page-size-select" className="text-sm text-slate-600">
              Số dòng/trang:
            </label>
            <select
              id="page-size-select"
              value={pageSize}
              onChange={(event) => onPageSizeChange(Number(event.target.value))}
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              aria-label="Chọn số dòng trên mỗi trang"
            >
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Điều hướng phân trang">
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(1)}>
            Đầu
          </Button>
          <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>
            Trước
          </Button>
          <div className="flex items-center gap-1">
            {visiblePages.map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? 'primary' : 'outline'}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-label={`Đi đến trang ${page}`}
                aria-current={currentPage === page ? 'page' : undefined}
              >
                {page}
              </Button>
            ))}
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          >
            Sau
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
          >
            Cuối
          </Button>
        </div>
      )}
    </nav>
  );
};

export function DataListPage<T extends object>({
  icon,
  title,
  description,
  actions,
  summary,
  filters,
  columns,
  data,
  loading = false,
  error,
  onRetry,
  onRowClick,
  pagination,
  className,
}: DataListPageProps<T>) {
  return (
    <MainLayout>
      <div className={cn('space-y-5', className)}>
        <PageHeader icon={icon} title={title} description={description} actions={actions} />

        {summary}

        {filters && (
          <Card>
            <CardContent>{filters}</CardContent>
          </Card>
        )}

        <Card className="overflow-hidden">
          <Table columns={columns} data={data} loading={loading} error={error} onRetry={onRetry} onRowClick={onRowClick} />
          {!loading && !error && pagination && <TablePagination {...pagination} />}
        </Card>
      </div>
    </MainLayout>
  );
}
