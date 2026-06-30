import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, LucideIcon } from 'lucide-react';
import { MainLayout } from '@/components/Layout/MainLayout';
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
  headerCentered?: boolean;
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
  const hasContent = totalPages > 1 || !!onPageSizeChange || totalItems !== undefined;
  if (!hasContent) return null;

  const startItem = totalItems && pageSize ? Math.min((currentPage - 1) * pageSize + 1, totalItems) : undefined;
  const endItem = totalItems && pageSize ? Math.min(currentPage * pageSize, totalItems) : undefined;

  const visiblePages = Array.from({ length: Math.min(5, totalPages) }, (_, index) => {
    if (totalPages <= 5) return index + 1;
    if (currentPage <= 3) return index + 1;
    if (currentPage >= totalPages - 2) return totalPages - 4 + index;
    return currentPage - 2 + index;
  });

  const navBtnBase =
    'flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-800 disabled:pointer-events-none disabled:opacity-40';

  const pageBtnBase =
    'h-8 min-w-[2rem] rounded-lg px-2 text-xs font-medium transition-colors border';

  return (
    <nav
      className="flex flex-col gap-3 border-t border-slate-100 bg-white px-5 py-3.5 sm:flex-row sm:items-center sm:justify-end"
      aria-label="Điều hướng trang"
    >
      <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-4">
        {/* Status text */}
        {totalItems !== undefined && startItem !== undefined && endItem !== undefined && (
          <span className="text-xs text-slate-600" role="status" aria-live="polite">
            Hiển thị{' '}
            <span className="font-semibold text-slate-700">{startItem}–{endItem}</span>{' '}
            trong{' '}
            <span className="font-semibold text-slate-700">{totalItems}</span>{' '}
            {itemLabel}
          </span>
        )}

        {/* Page size button group */}
        {onPageSizeChange && pageSize && pageSizeOptions && (
          <>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div
              className="flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
              role="group"
              aria-label="Số dòng mỗi trang"
            >
              {pageSizeOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onPageSizeChange(option)}
                  className={cn(
                    'h-7 min-w-[2.25rem] rounded-md px-2 text-xs font-medium transition-colors',
                    pageSize === option
                      ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-600 hover:text-slate-800'
                  )}
                  aria-label={`${option} dòng mỗi trang`}
                  aria-pressed={pageSize === option}
                >
                  {option}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Page navigation */}
        {totalPages > 1 && (
          <>
            <div className="hidden h-4 w-px bg-slate-200 sm:block" aria-hidden="true" />
            <div className="flex items-center gap-1" role="group" aria-label="Điều hướng phân trang">
              <button
                type="button"
                className={navBtnBase}
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
                aria-label="Trang trước"
              >
                <ChevronLeft size={15} />
              </button>

              {visiblePages.map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => onPageChange(page)}
                  className={cn(
                    pageBtnBase,
                    currentPage === page
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                  )}
                  aria-label={`Trang ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                className={navBtnBase}
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
                aria-label="Trang sau"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </>
        )}
      </div>
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
  headerCentered = false,
}: DataListPageProps<T>) {
  return (
    <MainLayout>
      <div className={cn('space-y-5', className)}>
        <PageHeader
          icon={icon}
          title={title}
          description={description}
          actions={actions}
          centered={headerCentered}
        />

        {summary && <div className="relative">{summary}</div>}

        {filters && (
          <Card className="overflow-hidden bg-white/95">
            <div className="h-1 bg-blue-700" />
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
