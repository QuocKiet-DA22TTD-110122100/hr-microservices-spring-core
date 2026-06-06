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
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <CheckCircle size={20} className="text-green-600" aria-hidden="true" />,
      progressBg: 'bg-green-500',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle size={20} className="text-red-600" aria-hidden="true" />,
      progressBg: 'bg-red-500',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: <AlertTriangle size={20} className="text-yellow-600" aria-hidden="true" />,
      progressBg: 'bg-yellow-500',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info size={20} className="text-blue-600" aria-hidden="true" />,
      progressBg: 'bg-blue-500',
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
        border rounded-lg shadow-lg
        min-w-[320px] max-w-[480px]
        transition-all duration-300 ease-out
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <div className="p-4 flex items-start gap-3">
        <div className="flex-shrink-0 pt-0.5">{variant.icon}</div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium break-words">{message}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
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
            className={`h-full ${variant.progressBg} transition-all duration-50 ease-linear`}
            style={{ width: `${progress}%` }}
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
