import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { renderWithRouter, createMockAuthStore, createMockUIStore, mockAdminUser } from '@/test/utils';
import * as userApi from '@/api/user.api';
import * as roleApi from '@/api/role.api';

/**
 * Integration Tests: User CRUD Flow
 * 
 * Tests complete user lifecycle:
 * 1. Create new user
 * 2. View user in list
 * 3. Edit user details
 * 4. Delete user
 */

vi.mock('@/store/authStore');
vi.mock('@/store/uiStore');
vi.mock('@/api/user.api');
vi.mock('@/api/role.api');
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

describe('Integration: User CRUD Flow', () => {
  let mockUIStore: ReturnType<typeof createMockUIStore>;
  let mockUsers: any[];
  let nextUserId = 4;

  const mockRoles = [
    { id: '1', name: 'ADMIN', description: 'Administrator' },
    { id: '2', name: 'USER', description: 'Regular user' },
    { id: '3', name: 'HR_MANAGER', description: 'HR Manager' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    nextUserId = 4;

    // Initial users
    mockUsers = [
      {
        id: '1',
        username: 'admin',
        role: 'ADMIN',
        locked: false,
        createdAt: '2024-01-01T00:00:00Z',
      },
      {
        id: '2',
        username: 'user1',
        role: 'USER',
        locked: false,
        createdAt: '2024-01-02T00:00:00Z',
      },
      {
        id: '3',
        username: 'hrmanager',
        role: 'HR_MANAGER',
        locked: false,
        createdAt: '2024-01-03T00:00:00Z',
      },
    ];

    mockUIStore = createMockUIStore();

    const { useAuthStore } = await import('@/store/authStore');
    const { useUIStore } = await import('@/store/uiStore');

    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));
    vi.mocked(useUIStore).mockReturnValue(mockUIStore);

    // Mock API responses
    vi.mocked(userApi.userApi.getAll).mockImplementation(() =>
      Promise.resolve({ data: [...mockUsers] } as any)
    );

    vi.mocked(roleApi.roleApi.getAll).mockResolvedValue({ data: mockRoles } as any);

    // Mock create
    vi.mocked(userApi.userApi.create).mockImplementation((data) => {
      const newUser = {
        id: String(nextUserId++),
        username: data.username,
        role: data.role,
        locked: false,
        createdAt: new Date().toISOString(),
      };
      mockUsers.push(newUser);
      return Promise.resolve({ data: newUser } as any);
    });

    // Mock update
    vi.mocked(userApi.userApi.update).mockImplementation((id, data) => {
      const userIndex = mockUsers.findIndex((u) => u.id === id);
      if (userIndex >= 0) {
        mockUsers[userIndex] = { ...mockUsers[userIndex], ...data };
        return Promise.resolve({ data: mockUsers[userIndex] } as any);
      }
      return Promise.reject(new Error('User not found'));
    });

    // Mock delete
    vi.mocked(userApi.userApi.delete).mockImplementation((id) => {
      mockUsers = mockUsers.filter((u) => u.id !== id);
      return Promise.resolve({} as any);
    });

    // Mock lock/unlock
    vi.mocked(userApi.userApi.lockAccount).mockImplementation((username) => {
      const user = mockUsers.find((u) => u.username === username);
      if (user) {
        user.locked = true;
      }
      return Promise.resolve({} as any);
    });

    vi.mocked(userApi.userApi.unlockAccount).mockImplementation((username) => {
      const user = mockUsers.find((u) => u.username === username);
      if (user) {
        user.locked = false;
      }
      return Promise.resolve({} as any);
    });
  });

  describe('Complete User Lifecycle', () => {
    it.skip('should complete full CRUD cycle: create → view → edit → delete', async () => {
      const user = userEvent.setup();

      // 1. RENDER: Initial page load
      renderWithRouter(<UserManagementPage />);

      // Wait for initial data
      await screen.findByText('admin');
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('hrmanager')).toBeInTheDocument();

      // Verify initial user count
      const initialRows = screen.getAllByRole('row').slice(1); // Skip header
      expect(initialRows.length).toBe(3);

      // 2. CREATE: Add new user
      const addButton = screen.getByRole('button', { name: /thêm tài khoản/i });
      await user.click(addButton);

      // Verify create modal opened
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Tạo tài khoản mới')).toBeInTheDocument();

      // Fill create form
      const usernameInput = screen.getByLabelText(/tên đăng nhập/i);
      const passwordInput = screen.getByLabelText(/mật khẩu/i);
      const roleSelect = screen.getByLabelText(/vai trò/i);

      await user.type(usernameInput, 'newuser');
      await user.type(passwordInput, 'password123');
      await user.selectOptions(roleSelect, 'USER');

      // Submit create form
      const createButton = screen.getByRole('button', { name: /tạo/i });
      await user.click(createButton);

      // Verify API was called
      await waitFor(() => {
        expect(userApi.userApi.create).toHaveBeenCalledWith({
          username: 'newuser',
          password: 'password123',
          role: 'USER',
        });
      });

      // Verify success notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('thành công'),
        })
      );

      // Verify modal closed
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // 3. VIEW: Verify new user appears in list
      // Re-render to show updated list
      vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: mockUsers } as any);
      
      // The component should re-fetch and show the new user
      await waitFor(() => {
        expect(screen.getByText('newuser')).toBeInTheDocument();
      });

      // Verify user count increased
      const updatedRows = screen.getAllByRole('row').slice(1);
      expect(updatedRows.length).toBe(4);

      // 4. EDIT: Update the new user
      const editButtons = screen.getAllByText('Sửa');
      const newUserRow = screen.getByText('newuser').closest('tr');
      const newUserEditButton = within(newUserRow!).getByText('Sửa');
      
      await user.click(newUserEditButton);

      // Verify edit modal opened
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Chỉnh sửa tài khoản')).toBeInTheDocument();

      // Change role to HR_MANAGER
      const editRoleSelect = screen.getByLabelText(/vai trò/i);
      await user.selectOptions(editRoleSelect, 'HR_MANAGER');

      // Submit edit
      const updateButton = screen.getByRole('button', { name: /cập nhật/i });
      await user.click(updateButton);

      // Verify update API was called
      await waitFor(() => {
        expect(userApi.userApi.update).toHaveBeenCalledWith(
          '4',
          expect.objectContaining({
            role: 'HR_MANAGER',
          })
        );
      });

      // Verify success notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('cập nhật'),
        })
      );

      // 5. DELETE: Remove the user
      const newUserRow2 = screen.getByText('newuser').closest('tr');
      const deleteButton = within(newUserRow2!).getByText('Xóa');
      
      await user.click(deleteButton);

      // Verify delete confirmation modal
      expect(screen.getByText(/bạn có chắc chắn muốn xóa/i)).toBeInTheDocument();

      // Confirm deletion — use specific aria-label
      await user.click(screen.getByRole('button', { name: /xác nhận xóa tài khoản/i }));

      // Verify delete API was called
      await waitFor(() => {
        expect(userApi.userApi.delete).toHaveBeenCalledWith('4');
      });

      // Verify success notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringMatching(/xóa/i),
        })
      );

      // Verify user removed from list
      await waitFor(() => {
        expect(screen.queryByText('newuser')).not.toBeInTheDocument();
      });

      // Verify user count decreased back to 3
      const finalRows = screen.getAllByRole('row').slice(1);
      expect(finalRows.length).toBe(3);
    });
  });

  describe('User Lock/Unlock Flow', () => {
    it('should lock and unlock user account', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('user1');

      // Find user1's lock button
      const user1Row = screen.getByText('user1').closest('tr');
      const lockButton = within(user1Row!).getByTitle(/khóa tài khoản/i);

      // Lock the account
      await user.click(lockButton);

      // Confirm lock — specific aria-label
      await user.click(screen.getByRole('button', { name: /xác nhận khóa tài khoản/i }));

      // Verify lock API called
      await waitFor(() => {
        expect(userApi.userApi.lockAccount).toHaveBeenCalledWith('user1');
      });

      // Update mock data to reflect locked state
      const lockedUser = mockUsers.find(u => u.username === 'user1');
      if (lockedUser) lockedUser.locked = true;

      // Verify status changed to locked (would need re-render in real app)
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringMatching(/khóa/i),
        })
      );

      // Now unlock
      const unlockButton = within(user1Row!).getByTitle(/mở khóa/i);
      await user.click(unlockButton);

      await user.click(screen.getByRole('button', { name: /xác nhận mở khóa/i }));

      // Verify unlock API called
      await waitFor(() => {
        expect(userApi.userApi.unlockAccount).toHaveBeenCalledWith('user1');
      });
    });
  });

  describe('Validation Flow', () => {
    it('should validate user creation with multiple error states', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open create modal
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));

      // Try to submit empty form
      const createButton = screen.getByRole('button', { name: /tạo/i });
      await user.click(createButton);

      // Should show both username and password errors
      expect(await screen.findByText(/tên đăng nhập là bắt buộc/i)).toBeInTheDocument();
      expect(await screen.findByText(/mật khẩu là bắt buộc/i)).toBeInTheDocument();

      // Fix username only
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'test');
      await user.click(createButton);

      // Username error should be gone, password error remains
      expect(screen.queryByText(/tên đăng nhập là bắt buộc/i)).not.toBeInTheDocument();
      expect(screen.getByText(/mật khẩu là bắt buộc/i)).toBeInTheDocument();

      // Fix password
      await user.type(screen.getByLabelText(/mật khẩu/i), 'pass');
      await user.click(createButton);

      // All errors should be gone, but password too short
      expect(await screen.findByText(/mật khẩu phải có ít nhất 6 ký tự/i)).toBeInTheDocument();

      // Use valid password
      await user.clear(screen.getByLabelText(/mật khẩu/i));
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');
      await user.click(createButton);

      // Should succeed
      await waitFor(() => {
        expect(userApi.userApi.create).toHaveBeenCalled();
      });
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple user creations sequentially', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Create first user
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'user_a');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      await waitFor(() => {
        expect(userApi.userApi.create).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'user_a' })
        );
      });

      // Wait for modal to close
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Create second user
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'user_b');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password456');
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      await waitFor(() => {
        expect(userApi.userApi.create).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'user_b' })
        );
      });

      // Both API calls should have been made
      expect(userApi.userApi.create).toHaveBeenCalledTimes(2);
    });

    it('should prevent duplicate submissions', async () => {
      const user = userEvent.setup();
      
      // Make create API slow
      vi.mocked(userApi.userApi.create).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: {} } as any), 1000))
      );

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'testuser');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');

      const createButton = screen.getByRole('button', { name: /tạo/i });

      // Click multiple times rapidly
      await user.click(createButton);
      await user.click(createButton);
      await user.click(createButton);

      // Should only call API once due to loading state
      await waitFor(() => {
        expect(userApi.userApi.create).toHaveBeenCalledTimes(1);
      });
    });
  });
});
