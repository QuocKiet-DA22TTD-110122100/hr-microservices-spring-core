import { useUIStore } from '@/store/uiStore';
import { ToastContainer } from './ToastContainer';
import { ErrorModal } from './ErrorModal';

/**
 * Global Error UI Component
 * 
 * Renders toast notifications and error modal at the application level.
 * Should be placed once in the root component (App.tsx).
 */
export const GlobalErrorUI = () => {
  const { errorModal, hideErrorModal } = useUIStore();

  return (
    <>
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Global Error Modal */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={hideErrorModal}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        onRetry={errorModal.onRetry}
        retryLabel={errorModal.retryLabel}
      />
    </>
  );
};
