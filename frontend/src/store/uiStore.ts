import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
  onRetry?: () => void;
}

interface ErrorModalState {
  isOpen: boolean;
  title?: string;
  message: string;
  details?: string[];
  onRetry?: () => void;
  retryLabel?: string;
}

interface UIState {
  notifications: Notification[];
  isLoading: boolean;
  errorModal: ErrorModalState;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  showErrorModal: (config: Omit<ErrorModalState, 'isOpen'>) => void;
  hideErrorModal: () => void;
}

const removeNotificationById = (notifications: Notification[], id: string) => {
  return notifications.filter((notification) => notification.id !== id);
};

export const useUIStore = create<UIState>((set, get) => ({
  notifications: [],
  isLoading: false,
  errorModal: {
    isOpen: false,
    message: '',
  },

  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration (default 5 seconds, 0 for persistent)
    const duration = notification.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: removeNotificationById(state.notifications, id),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),

  showErrorModal: (config) => {
    set({
      errorModal: {
        ...config,
        isOpen: true,
      },
    });
  },

  hideErrorModal: () => {
    set((state) => ({
      errorModal: {
        ...state.errorModal,
        isOpen: false,
      },
    }));
  },
}));
