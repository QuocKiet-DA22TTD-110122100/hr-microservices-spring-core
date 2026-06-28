import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info, RotateCw } from 'lucide-react';

interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  onRetry?: () => void;
}

export const Toast = ({ id, type, message, duration = 5000, onClose, onRetry }: ToastProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (duration === 0) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress > 0 ? newProgress : 0;
      });
    }, 50);

    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onClose(id);
    }, 300);
  };

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      handleClose();
    }
  };

  const variants = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      icon: <CheckCircle size={20} className="text-emerald-600" aria-hidden="true" />,
      progressBg: 'bg-emerald-500',
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      icon: <AlertCircle size={20} className="text-rose-600" aria-hidden="true" />,
      progressBg: 'bg-rose-500',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: <AlertTriangle size={20} className="text-amber-600" aria-hidden="true" />,
      progressBg: 'bg-amber-500',
    },
    info: {
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      text: 'text-cyan-900',
      icon: <Info size={20} className="text-cyan-700" aria-hidden="true" />,
      progressBg: 'bg-cyan-600',
    },
  };

  const variant = variants[type];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`
        relative overflow-hidden
        ${variant.bg} ${variant.border} ${variant.text}
        border rounded-xl shadow-[0_18px_45px_rgba(15,23,42,0.14)]
        min-w-[320px] max-w-[480px]
        transition-[opacity,transform] duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="flex items-start gap-3 p-4">
        <div className="flex-shrink-0 pt-0.5">{variant.icon}</div>

        <div className="min-w-0 flex-1">
          <p className="break-words text-sm font-medium leading-6">{message}</p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onRetry && type === 'error' && (
            <button
              onClick={handleRetry}
              className="p-1 hover:bg-black/5 rounded transition-colors"
              title="Thử lại"
              aria-label="Thử lại thao tác"
            >
              <RotateCw size={16} />
            </button>
          )}

          <button
            onClick={handleClose}
            className="p-1 hover:bg-black/5 rounded transition-colors"
            aria-label="Đóng thông báo"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {duration > 0 && (
        <div className="h-1 bg-black/10">
          <div
            className={`h-full w-full origin-left ${variant.progressBg} transition-transform duration-50 ease-linear`}
            style={{ transform: `scaleX(${progress / 100})` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Thời gian còn lại"
          />
        </div>
      )}
    </div>
  );
};
