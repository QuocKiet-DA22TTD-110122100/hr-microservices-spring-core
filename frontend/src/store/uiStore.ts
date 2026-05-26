import { create } from 'zustand';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

interface UIState {
  notifications: Notification[];
  isLoading: boolean;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
}

const removeNotificationById = (notifications: Notification[], id: string) => {
  return notifications.filter((notification) => notification.id !== id);
};

export const useUIStore = create<UIState>((set, get) => ({
  notifications: [],
  isLoading: false,

  addNotification: (notification) => {
    const id = Date.now().toString();
    const newNotification = { ...notification, id };
    
    set((state) => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto remove after duration
    const duration = notification.duration || 5000;
    setTimeout(() => {
      get().removeNotification(id);
    }, duration);
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: removeNotificationById(state.notifications, id),
    }));
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
