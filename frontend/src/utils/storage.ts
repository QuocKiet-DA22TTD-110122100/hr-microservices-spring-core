export const storage = {
  getAccessToken: (): string | null => {
    return localStorage.getItem('accessToken');
  },

  setAccessToken: (token: string): void => {
    localStorage.setItem('accessToken', token);
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem('refreshToken');
  },

  setRefreshToken: (token: string): void => {
    localStorage.setItem('refreshToken', token);
  },

  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },

  getUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser: (user: unknown): void => {
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearUser: (): void => {
    localStorage.removeItem('user');
  },

  clear: (): void => {
    storage.clearTokens();
    storage.clearUser();
  },
};
