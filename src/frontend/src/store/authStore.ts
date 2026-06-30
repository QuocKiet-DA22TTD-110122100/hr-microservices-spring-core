import { create } from 'zustand';
import { User } from '@/types/auth';
import { authApi } from '@/api/auth.api';
import { storage } from '@/utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => Promise<void>;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: storage.getUser(),
  isAuthenticated: !!storage.getAccessToken(),
  isLoading: false,

  setUser: (user) => {
    if (user) {
      storage.setUser(user);
    } else {
      storage.clearUser();
    }
    set({ user, isAuthenticated: !!user });
  },

  setTokens: (accessToken, refreshToken) => {
    storage.setAccessToken(accessToken);
    storage.setRefreshToken(refreshToken);
    set({ isAuthenticated: true });
  },

  logout: async () => {
    const accessToken = storage.getAccessToken();

    try {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
    } catch {
      // Always clear local session even if revoke request fails.
    } finally {
      storage.clear();
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: () => {
    const token = storage.getAccessToken();
    const user = storage.getUser();
    set({ isAuthenticated: !!token, user });
  },
}));
