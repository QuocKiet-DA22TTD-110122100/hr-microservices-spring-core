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
  title = 'đã xảy ra lỗi',
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
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle size={24} className="text-red-600" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <p className="mt-2 text-sm text-gray-700" role="alert">
              {message}
            </p>
          </div>
        </div>

        {/* Error Details (if provided) */}
        {details && details.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Chi tiết lỗi:</h4>
            <ul className="space-y-1">
              {details.map((detail, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 flex-shrink-0">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-end pt-2">
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
