import { ReactNode } from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton = ({ 
  className = '', 
  variant = 'rectangular',
  width,
  height,
  animation = 'pulse'
}: SkeletonProps) => {
  const baseStyles = 'bg-slate-200';
  
  const variantStyles = {
    text: 'rounded h-4',
    rectangular: 'rounded-md',
    circular: 'rounded-full',
  };

  const animationStyles = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%]',
    none: '',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height || (variant === 'text' ? '1rem' : undefined),
  };

  return (
    <div
      className={`${baseStyles} ${variantStyles[variant]} ${animationStyles[animation]} ${className}`}
      style={style}
      aria-hidden="true"
      role="status"
      aria-label="Đang tải..."
    />
  );
};

// Skeleton Table Row Component
interface SkeletonTableRowProps {
  columns: number;
  rows?: number;
}

export const SkeletonTableRow = ({ columns, rows = 1 }: SkeletonTableRowProps) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <tr key={rowIndex} className="border-b border-slate-200">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <td key={colIndex} className="px-6 py-4">
              <Skeleton variant="text" width="100%" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// Skeleton Card Component
export const SkeletonCard = ({ children }: { children?: ReactNode }) => {
  return (
    <div className="space-y-4 rounded-xl border border-slate-200/80 bg-white/95 p-6 shadow-sm" aria-busy="true">
      {children || (
        <>
          <Skeleton variant="text" width="60%" height="1.5rem" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="100%" />
          <Skeleton variant="text" width="80%" />
        </>
      )}
    </div>
  );
};

// Skeleton Form Component
export const SkeletonForm = () => {
  return (
    <div className="space-y-4" aria-busy="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="30%" height="1rem" />
          <Skeleton variant="rectangular" width="100%" height="2.5rem" />
        </div>
      ))}
      <div className="flex gap-3 pt-4">
        <Skeleton variant="rectangular" width="120px" height="2.5rem" />
        <Skeleton variant="rectangular" width="80px" height="2.5rem" />
      </div>
    </div>
  );
};

// Skeleton List Component
export const SkeletonList = ({ items = 5 }: { items?: number }) => {
  return (
    <div className="space-y-3" aria-busy="true">
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm">
          <Skeleton variant="circular" width="2.5rem" height="2.5rem" />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  );
};
