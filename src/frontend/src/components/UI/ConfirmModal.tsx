import { AlertTriangle, Trash2 } from 'lucide-react';
import { Button } from './Button';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) => {
  if (!isOpen) return null;

  const iconBg = variant === 'danger' ? 'bg-rose-50 border-rose-100' : 'bg-amber-50 border-amber-100';
  const iconColor = variant === 'danger' ? 'text-rose-600' : 'text-amber-500';
  const accentBar = variant === 'danger'
    ? 'from-rose-500 via-rose-400 to-transparent'
    : 'from-amber-500 via-amber-400 to-transparent';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="fixed inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
        aria-label="Đóng hộp thoại"
        disabled={isLoading}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
        className="relative w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.14)]"
      >
        <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentBar}`} />

        <div className="p-6">
          <div className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl border ${iconBg}`}>
            {variant === 'danger' ? (
              <Trash2 size={26} className={iconColor} />
            ) : (
              <AlertTriangle size={26} className={iconColor} />
            )}
          </div>

          <h2 id="confirm-title" className="text-center text-lg font-semibold text-slate-900">
            {title}
          </h2>
          <p id="confirm-message" className="mt-2 text-center text-sm leading-6 text-slate-500">
            {message}
          </p>
        </div>

        <div className="flex gap-3 border-t border-slate-100 px-6 pb-6 pt-4">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            className="flex-1"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};
