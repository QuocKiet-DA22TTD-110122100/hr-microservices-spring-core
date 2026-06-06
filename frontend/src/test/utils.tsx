import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

/**
 * Test utilities for rendering components with providers
 */

interface WrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper with Router
 */
export const RouterWrapper = ({ children }: WrapperProps) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

/**
 * Custom render with Router
 */
export const renderWithRouter = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return render(ui, { wrapper: RouterWrapper, ...options });
};

/**
 * Mock user data for testing
 */
export const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['USER'],
  permissions: ['employee:view', 'department:view', 'organization:view'],
  passwordExpiresAt: '2025-12-31T00:00:00Z',
  isLocked: false,
};

export const mockAdminUser = {
  id: '2',
  username: 'admin',
  email: 'admin@example.com',
  fullName: 'Admin User',
  roles: ['ADMIN'],
  permissions: [
    'user:view',
    'user:create',
    'user:update',
    'user:delete',
    'user:lock',
    'role:view',
    'role:create',
    'role:update',
    'role:delete',
    'employee:view',
    'employee:create',
    'employee:update',
    'employee:delete',
    'department:view',
    'department:create',
    'department:update',
    'department:delete',
    'organization:view',
    'organization:create',
    'organization:update',
    'organization:delete',
    'system:settings',
    'system:logs',
  ],
  passwordExpiresAt: '2025-12-31T00:00:00Z',
  isLocked: false,
};

/**
 * Mock authStore
 */
export const createMockAuthStore = (user = mockUser, isAuthenticated = true) => ({
  user,
  isAuthenticated,
  isLoading: false,
  setUser: vi.fn(),
  setTokens: vi.fn(),
  logout: vi.fn(),
  checkAuth: vi.fn(),
});

/**
 * Mock uiStore
 */
export const createMockUIStore = () => ({
  notifications: [],
  isLoading: false,
  errorModal: {
    isOpen: false,
    message: '',
  },
  addNotification: vi.fn(),
  removeNotification: vi.fn(),
  setLoading: vi.fn(),
  showErrorModal: vi.fn(),
  hideErrorModal: vi.fn(),
});

/**
 * Wait for async operations
 */
export const waitFor = (callback: () => void, timeout = 1000) => {
  return new Promise<void>((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      try {
        callback();
        clearInterval(interval);
        resolve();
      } catch (error) {
        if (Date.now() - startTime >= timeout) {
          clearInterval(interval);
          reject(error);
        }
      }
    }, 50);
  });
};

/**
 * Create mock API response
 */
export const createMockResponse = <T,>(data: T, delay = 0) => {
  return new Promise<{ data: T }>((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

/**
 * Create mock API error
 */
export const createMockError = (message: string, statusCode = 500, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        response: {
          status: statusCode,
          data: {
            message,
          },
        },
      });
    }, delay);
  });
};
