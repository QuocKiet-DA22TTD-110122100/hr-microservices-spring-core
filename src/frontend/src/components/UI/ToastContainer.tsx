import { useUIStore } from '@/store/uiStore';
import { Toast } from './Toast';

export const ToastContainer = () => {
  const { notifications, removeNotification } = useUIStore();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none"
      aria-live="polite"
      aria-atomic="false"
    >
      <div className="pointer-events-auto">
        {notifications.map((notification) => (
          <div key={notification.id} className="mb-3">
            <Toast
              id={notification.id}
              type={notification.type}
              message={notification.message}
              duration={notification.duration}
              onClose={removeNotification}
              onRetry={notification.onRetry}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
