import { User } from '@/types/auth';
import { AUTH_STORAGE_KEYS } from '@/utils/authSession';

export const storage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem(AUTH_STORAGE_KEYS.accessToken);
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem(AUTH_STORAGE_KEYS.accessToken, token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem(AUTH_STORAGE_KEYS.refreshToken);
  },

  setRefreshToken: (token: string): void => {
    if (!token) {
      localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
      return;
    }

    localStorage.setItem(AUTH_STORAGE_KEYS.refreshToken, token);
  },

  clearTokens: (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.accessToken);
    localStorage.removeItem(AUTH_STORAGE_KEYS.refreshToken);
  },

  getUser: (): User | null => {
    const userStr = localStorage.getItem(AUTH_STORAGE_KEYS.user);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr) as User;
    } catch {
      localStorage.removeItem(AUTH_STORAGE_KEYS.user);
      return null;
    }
  },

  setUser: (user: unknown): void => {
    localStorage.setItem(AUTH_STORAGE_KEYS.user, JSON.stringify(user));
  },

  clearUser: (): void => {
    localStorage.removeItem(AUTH_STORAGE_KEYS.user);
  },

  clear: (): void => {
    storage.clearTokens();
    storage.clearUser();
  },
};
