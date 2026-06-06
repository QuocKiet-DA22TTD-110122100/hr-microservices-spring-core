import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage, getApiErrorDetails } from './error';

/**
 * Helper function to show error notification with optional retry
 * 
 * @example
 * try {
 *   await api.operation();
 * } catch (error) {
 *   showErrorNotification(error, 'Không thể thực hiện', () => handleRetry());
 * }
 */
export const showErrorNotification = (
  error: unknown,
  fallbackMessage: string,
  onRetry?: () => void,
  duration?: number
) => {
  const message = getApiErrorMessage(error, fallbackMessage);
  useUIStore.getState().addNotification({
    type: 'error',
    message,
    onRetry,
    duration,
  });
};

/**
 * Helper function to show success notification
 */
export const showSuccessNotification = (message: string, duration?: number) => {
  useUIStore.getState().addNotification({
    type: 'success',
    message,
    duration,
  });
};

/**
 * Helper function to show warning notification
 */
export const showWarningNotification = (message: string, duration?: number) => {
  useUIStore.getState().addNotification({
    type: 'warning',
    message,
    duration,
  });
};

/**
 * Helper function to show info notification
 */
export const showInfoNotification = (message: string, duration?: number) => {
  useUIStore.getState().addNotification({
    type: 'info',
    message,
    duration,
  });
};

/**
 * Helper function to show error modal with detailed information
 * 
 * @example
 * try {
 *   await api.criticalOperation();
 * } catch (error) {
 *   showErrorModal(error, 'Lỗi nghiêm trọng', () => handleRetry());
 * }
 */
export const showErrorModal = (
  error: unknown,
  fallbackMessage: string,
  onRetry?: () => void,
  customTitle?: string
) => {
  const errorDetails = getApiErrorDetails(error);
  
  useUIStore.getState().showErrorModal({
    title: customTitle || 'đã xảy ra lỗi',
    message: errorDetails.message || fallbackMessage,
    details: errorDetails.details,
    onRetry,
    retryLabel: onRetry ? 'Thử lại' : undefined,
  });
};

/**
 * Helper function to hide error modal
 */
export const hideErrorModal = () => {
  useUIStore.getState().hideErrorModal();
};
