import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { EmployeeFormPage } from '@/pages/EmployeeFormPage';
import { renderWithRouter, createMockAuthStore, createMockUIStore, mockAdminUser } from '@/test/utils';
import * as userApi from '@/api/user.api';
import * as roleApi from '@/api/role.api';
import * as employeeApi from '@/api/employee.api';
import * as organizationApi from '@/api/organization.api';
import * as departmentApi from '@/api/department.api';

/**
 * Integration Tests: API Error Handling
 * 
 * Tests error scenarios and recovery:
 * 1. Network errors (500, 503, timeout)
 * 2. Client errors (400, 401, 403, 404, 422)
 * 3. Validation errors
 * 4. Retry mechanisms
 * 5. Fallback data
 */

vi.mock('@/store/authStore');
vi.mock('@/store/uiStore');
vi.mock('@/api/user.api');
vi.mock('@/api/role.api');
vi.mock('@/api/employee.api');
vi.mock('@/api/organization.api');
vi.mock('@/api/department.api');
vi.mock('@/hooks/usePermissions', () => ({
  usePermissions: () => ({
    can: () => true,
    canAny: () => true,
    canAll: () => true,
    hasRole: () => true,
    isAdmin: () => true,
    permissions: mockAdminUser.permissions,
    roles: mockAdminUser.roles,
    isAuthenticated: true,
  }),
}));

describe('Integration: API Error Handling', () => {
  let mockUIStore: ReturnType<typeof createMockUIStore>;

  const mockRoles = [
    { id: '1', name: 'ADMIN' },
    { id: '2', name: 'USER' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUIStore = createMockUIStore();

    const { useAuthStore } = await import('@/store/authStore');
    const { useUIStore } = await import('@/store/uiStore');

    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));
    vi.mocked(useUIStore).mockReturnValue(mockUIStore);

    vi.mocked(roleApi.roleApi.getAll).mockResolvedValue({ data: mockRoles } as any);
  });

  describe('Server Errors (5xx)', () => {
    it('should handle 500 Internal Server Error', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: {
          status: 500,
          data: {
            message: 'Internal server error',
          },
        },
      });

      renderWithRouter(<UserManagementPage />);

      // Should show fallback data
      await screen.findByText('admin');

      // Should show error notification with retry
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('máy chủ'),
          onRetry: expect.any(Function),
        })
      );
    });

    it('should handle 503 Service Unavailable', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: {
          status: 503,
          data: {
            message: 'Service temporarily unavailable',
          },
        },
      });

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Should show specific 503 message
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('không khả dụng'),
        })
      );
    });

    it('should handle network timeout', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        message: 'timeout of 5000ms exceeded',
        code: 'ECONNABORTED',
      });

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Should show timeout message
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('hết thời gian'),
        })
      );
    });

    it('should handle network error (no internet)', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        message: 'Network Error',
        code: 'ERR_NETWORK',
      });

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Should show network error message
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: expect.stringContaining('kết nối'),
        })
      );
    });
  });

  describe('Client Errors (4xx)', () => {
    it('should handle 400 Bad Request', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.create).mockRejectedValue({
        response: {
          status: 400,
          data: {
            message: 'Invalid request data',
          },
        },
      });

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      // Try to create user
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'test');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // Should show validation error
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('không hợp lệ'),
          })
        );
      });
    });

    it('should handle 401 Unauthorized', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: {
          status: 401,
          data: {
            message: 'Unauthorized',
          },
        },
      });

      renderWithRouter(<UserManagementPage />);

      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('đăng nhập'),
          })
        );
      });
    });

    it('should handle 403 Forbidden', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.delete).mockRejectedValue({
        response: {
          status: 403,
          data: {
            message: 'Forbidden',
          },
        },
      });

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({
        data: [{ id: '1', username: 'test', role: 'USER', locked: false, createdAt: '2024-01-01' }],
      } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('test');

      // Try to delete
      await user.click(screen.getByText('Xóa'));
      await user.click(screen.getByRole('button', { name: /xóa/i }));

      // Should show permission denied
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('không có quyền'),
          })
        );
      });
    });

    it('should handle 404 Not Found', async () => {
      vi.mocked(employeeApi.employeeApi.getById).mockRejectedValue({
        response: {
          status: 404,
          data: {
            message: 'Employee not found',
          },
        },
      });

      renderWithRouter(<EmployeeFormPage />);

      // Should show not found error
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('không tìm thấy'),
          })
        );
      });
    });

    it('should handle 422 Validation Error with field details', async () => {
      const user = userEvent.setup();
      
      vi.mocked(userApi.userApi.create).mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            details: [
              'username: Username already exists',
              'password: Password too short',
            ],
          },
        },
      });

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: [] } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('Quản lý Tài khoản');

      // Try to create user
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'existing');
      await user.type(screen.getByLabelText(/mật khẩu/i), '123');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          })
        );
      });
    });

    it('should handle 409 Conflict (duplicate)', async () => {
      const user = userEvent.setup();
      
      vi.mocked(userApi.userApi.create).mockRejectedValue({
        response: {
          status: 409,
          data: {
            message: 'Username already exists',
          },
        },
      });

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: [] } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('Quản lý Tài khoản');

      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'admin');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // Should show conflict error
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('xung đột'),
          })
        );
      });
    });

    it('should handle 429 Too Many Requests (rate limit)', async () => {
      const user = userEvent.setup();
      
      vi.mocked(userApi.userApi.create).mockRejectedValue({
        response: {
          status: 429,
          data: {
            message: 'Too many requests',
          },
        },
      });

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: [] } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('Quản lý Tài khoản');

      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'test');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // Should show rate limit error
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('quá nhi?u'),
          })
        );
      });
    });
  });

  describe('Form Validation Errors', () => {
    it('should map backend validation errors to form fields', async () => {
      const user = userEvent.setup();

      vi.mocked(employeeApi.employeeApi.create).mockRejectedValue({
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            details: [
              'email: Invalid email format',
              'phone: Phone number is invalid',
            ],
          },
        },
      });

      vi.mocked(organizationApi.organizationApi.getAll).mockResolvedValue({
        data: [{ id: 1, name: 'Org 1' }],
      } as any);

      vi.mocked(departmentApi.departmentApi.getByOrganizationUnitId).mockResolvedValue({
        data: { content: [{ id: 1, name: 'Dept 1' }] },
      } as any);

      renderWithRouter(<EmployeeFormPage />);

      // Wait for form to load
      await screen.findByText(/thêm nhân viên m?i/i);

      // Fill and submit form
      await user.type(screen.getByLabelText(/tên nhân viên/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');
      await user.type(screen.getByLabelText(/số điện thoại/i), '123');

      const submitButton = screen.getByRole('button', { name: /thêm nhân viên/i });
      await user.click(submitButton);

      // Should show inline validation errors
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
          })
        );
      });
    });
  });

  describe('Retry Mechanism', () => {
    it('should retry failed request when retry button is clicked', async () => {
      let callCount = 0;
      
      vi.mocked(userApi.userApi.getAll).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject({
            response: {
              status: 500,
              data: { message: 'Server error' },
            },
          });
        }
        return Promise.resolve({
          data: [{ id: '1', username: 'admin', role: 'ADMIN', locked: false, createdAt: '2024-01-01' }],
        } as any);
      });

      renderWithRouter(<UserManagementPage />);

      // First call should fail
      await screen.findByText('admin');

      // Should have retry in notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          onRetry: expect.any(Function),
        })
      );

      // Get retry function and call it
      const retryCall = mockUIStore.addNotification.mock.calls.find(
        call => call[0].onRetry
      );

      if (retryCall && retryCall[0].onRetry) {
        retryCall[0].onRetry();

        // Second call should succeed
        await waitFor(() => {
          expect(callCount).toBe(2);
        });
      }
    });
  });

  describe('Fallback Data', () => {
    it('should show fallback data when API fails', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Server error' },
        },
      });

      renderWithRouter(<UserManagementPage />);

      // Should show fallback users
      await screen.findByText('admin');
      expect(screen.getByText('user1')).toBeInTheDocument();
    });

    it('should show fallback warning banner', async () => {
      vi.mocked(roleApi.roleApi.getAll).mockResolvedValue({
        data: mockRoles,
        _fallback: true,
        _fallbackReason: 'API unavailable',
      } as any);

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: [] } as any);

      renderWithRouter(<UserManagementPage />);

      // Should show fallback warning
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'warning',
            message: expect.stringContaining('dữ liệu'),
          })
        );
      });
    });
  });

  describe('Optimistic Updates with Rollback', () => {
    it('should rollback on API failure after optimistic update', async () => {
      const user = userEvent.setup();

      const initialUsers = [
        { id: '1', username: 'user1', role: 'USER', locked: false, createdAt: '2024-01-01' },
      ];

      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: initialUsers } as any);
      
      vi.mocked(userApi.userApi.lockAccount).mockRejectedValue({
        response: {
          status: 500,
          data: { message: 'Failed to lock account' },
        },
      });

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('user1');

      // Verify initial state (unlocked)
      expect(screen.getByText('Hoạt động')).toBeInTheDocument();

      // Try to lock
      const lockButton = screen.getByTitle(/khóa tài khoản/i);
      await user.click(lockButton);
      await user.click(screen.getByRole('button', { name: /khóa/i }));

      // Should show error and rollback notification
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            message: expect.stringContaining('hoàn tác'),
          })
        );
      });

      // State should be rolled back (still unlocked)
      expect(screen.getByText('Hoạt động')).toBeInTheDocument();
    });
  });

  describe('Concurrent Error Handling', () => {
    it('should handle multiple simultaneous API errors gracefully', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: { status: 500, data: { message: 'Error 1' } },
      });

      vi.mocked(roleApi.roleApi.getAll).mockRejectedValue({
        response: { status: 500, data: { message: 'Error 2' } },
      });

      renderWithRouter(<UserManagementPage />);

      // Should handle both errors
      await waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalled();
      });

      // Should still show fallback data
      await screen.findByText('admin');
    });
  });
});
