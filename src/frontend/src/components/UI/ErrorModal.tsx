import { AlertCircle, RotateCw, X } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  details?: string[];
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorModal = ({
  isOpen,
  onClose,
  title = 'Đã xảy ra lỗi',
  message,
  details,
  onRetry,
  retryLabel = 'Thử lại',
}: ErrorModalProps) => {
  const handleRetry = () => {
    if (onRetry) {
      onRetry();
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="">
      <div className="space-y-4">
        {/* Error Icon and Title */}
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-rose-100 bg-rose-50 shadow-sm">
            <AlertCircle size={24} className="text-rose-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold tracking-[-0.01em] text-slate-950">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600" role="alert">
              {message}
            </p>
          </div>
        </div>

        {/* Error Details (if provided) */}
        {details && details.length > 0 && (
          <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
            <h4 className="mb-2 text-sm font-semibold text-slate-900">Chi tiết lỗi:</h4>
            <ul className="space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start gap-2 text-sm leading-6 text-slate-600">
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-rose-400" />
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          {onRetry && (
            <Button
              variant="primary"
              onClick={handleRetry}
              className="flex items-center gap-2"
              aria-label={retryLabel}
            >
              <RotateCw size={16} aria-hidden="true" />
              {retryLabel}
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={onClose}
            aria-label="Đóng hộp thoại lỗi"
          >
            <X size={16} className="mr-2" aria-hidden="true" />
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
};
