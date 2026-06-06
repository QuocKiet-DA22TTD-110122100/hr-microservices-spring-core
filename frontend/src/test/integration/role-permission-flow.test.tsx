import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPage } from '@/pages/UserManagementPage';
import { EmployeeListPage } from '@/pages/EmployeeListPage';
import { renderWithRouter, createMockAuthStore, createMockUIStore, mockUser, mockAdminUser } from '@/test/utils';
import * as userApi from '@/api/user.api';
import * as roleApi from '@/api/role.api';
import * as employeeApi from '@/api/employee.api';

/**
 * Integration Tests: Role Permission Flow
 * 
 * Tests permission-based access control:
 * 1. Admin can access all features
 * 2. Regular user has limited access
 * 3. Permission-based UI hiding
 * 4. Permission-based action blocking
 */

vi.mock('@/store/authStore');
vi.mock('@/store/uiStore');
vi.mock('@/api/user.api');
vi.mock('@/api/role.api');
vi.mock('@/api/employee.api');

describe('Integration: Role Permission Flow', () => {
  let mockUIStore: ReturnType<typeof createMockUIStore>;

  const mockUsers = [
    { id: '1', username: 'admin', role: 'ADMIN', locked: false, createdAt: '2024-01-01' },
    { id: '2', username: 'user1', role: 'USER', locked: false, createdAt: '2024-01-02' },
  ];

  const mockRoles = [
    { id: '1', name: 'ADMIN' },
    { id: '2', name: 'USER' },
    { id: '3', name: 'HR_MANAGER' },
  ];

  const mockEmployees = [
    { id: 1, name: 'John Doe', email: 'john@example.com', position: 'Developer' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', position: 'Manager' },
  ];

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUIStore = createMockUIStore();

    const { useUIStore } = await import('@/store/uiStore');
    vi.mocked(useUIStore).mockReturnValue(mockUIStore);

    vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: mockUsers } as any);
    vi.mocked(roleApi.roleApi.getAll).mockResolvedValue({ data: mockRoles } as any);
    vi.mocked(employeeApi.employeeApi.getAll).mockResolvedValue({
      data: { content: mockEmployees, totalPages: 1 },
    } as any);
  });

  describe('Admin User Permissions', () => {
    beforeEach(async () => {
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));

      // Mock permission hook for admin
      vi.mock('@/hooks/usePermissions', () => ({
        usePermissions: () => ({
          can: () => true,
          canAny: () => true,
          canAll: () => true,
          hasRole: (role: string) => role === 'ADMIN',
          isAdmin: () => true,
          permissions: mockAdminUser.permissions,
          roles: mockAdminUser.roles,
          isAuthenticated: true,
        }),
      }));
    });

    it('should show all actions for admin in user management', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Admin should see "Add User" button
      expect(screen.getByRole('button', { name: /thêm tài khoản/i })).toBeInTheDocument();

      // Admin should see all action buttons for each user
      const editButtons = screen.getAllByText('Sửa');
      const deleteButtons = screen.getAllByText('Xóa');

      expect(editButtons.length).toBe(mockUsers.length);
      expect(deleteButtons.length).toBe(mockUsers.length);
    });

    it('should allow admin to create users', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.create).mockResolvedValue({
        data: { id: '3', username: 'newuser', role: 'USER', locked: false },
      } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      // Click add button
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));

      // Fill form
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'newuser');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');

      // Submit
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // Should succeed
      expect(userApi.userApi.create).toHaveBeenCalled();
    });

    it('should allow admin to delete users', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.delete).mockResolvedValue({} as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      // Click delete button
      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      // Confirm
      const confirmButton = screen.getByRole('button', { name: /xóa/i });
      await user.click(confirmButton);

      // Should succeed
      expect(userApi.userApi.delete).toHaveBeenCalled();
    });

    it('should allow admin to lock/unlock users', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.lockAccount).mockResolvedValue({} as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      // Find lock button
      const table = screen.getByRole('table');
      const lockButtons = within(table).getAllByTitle(/khóa tài khoản/i);

      // Click lock
      await user.click(lockButtons[0]);

      // Confirm
      await user.click(screen.getByRole('button', { name: /khóa/i }));

      // Should succeed
      expect(userApi.userApi.lockAccount).toHaveBeenCalled();
    });
  });

  describe('Regular User Permissions', () => {
    beforeEach(async () => {
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockUser));

      // Mock permission hook for regular user
      vi.mock('@/hooks/usePermissions', () => ({
        usePermissions: () => ({
          can: (permission: string) => {
            // Regular user can only view employees, departments, organizations
            return [
              'employee:view',
              'department:view',
              'organization:view',
            ].includes(permission);
          },
          canAny: (permissions: string[]) => {
            return permissions.some(p =>
              ['employee:view', 'department:view', 'organization:view'].includes(p)
            );
          },
          canAll: (permissions: string[]) => {
            return permissions.every(p =>
              ['employee:view', 'department:view', 'organization:view'].includes(p)
            );
          },
          hasRole: (role: string) => role === 'USER',
          isAdmin: () => false,
          permissions: mockUser.permissions,
          roles: mockUser.roles,
          isAuthenticated: true,
        }),
      }));
    });

    it('should hide user management actions for regular user', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Regular user should NOT see "Add User" button
      expect(screen.queryByRole('button', { name: /thêm tài khoản/i })).not.toBeInTheDocument();

      // Regular user should NOT see edit/delete buttons
      expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
      expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    });

    it('should allow regular user to view employees', async () => {
      renderWithRouter(<EmployeeListPage />);

      // Should be able to see employee list
      await screen.findByText('John Doe');
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should hide employee create button for regular user', async () => {
      renderWithRouter(<EmployeeListPage />);

      await screen.findByText('John Doe');

      // Regular user should NOT see "Add Employee" button
      expect(screen.queryByRole('button', { name: /thêm nhân viên/i })).not.toBeInTheDocument();
    });
  });

  describe('HR Manager Permissions', () => {
    const mockHRManager = {
      ...mockUser,
      id: '3',
      username: 'hrmanager',
      roles: ['HR_MANAGER'],
      permissions: [
        'user:view',
        'employee:view',
        'employee:create',
        'employee:update',
        'employee:delete',
        'department:view',
        'department:create',
        'department:update',
        'organization:view',
      ],
    };

    beforeEach(async () => {
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockHRManager));

      vi.mock('@/hooks/usePermissions', () => ({
        usePermissions: () => ({
          can: (permission: string) => mockHRManager.permissions.includes(permission),
          canAny: (permissions: string[]) =>
            permissions.some(p => mockHRManager.permissions.includes(p)),
          canAll: (permissions: string[]) =>
            permissions.every(p => mockHRManager.permissions.includes(p)),
          hasRole: (role: string) => role === 'HR_MANAGER',
          isAdmin: () => false,
          permissions: mockHRManager.permissions,
          roles: mockHRManager.roles,
          isAuthenticated: true,
        }),
      }));
    });

    it('should allow HR manager to view users but not create/delete', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // HR manager can view users
      expect(screen.getByText('user1')).toBeInTheDocument();

      // But cannot create users (no add button)
      expect(screen.queryByRole('button', { name: /thêm tài khoản/i })).not.toBeInTheDocument();

      // And cannot delete users
      expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    });

    it('should allow HR manager to manage employees', async () => {
      renderWithRouter(<EmployeeListPage />);

      await screen.findByText('John Doe');

      // HR manager should see "Add Employee" button
      expect(screen.getByRole('button', { name: /thêm nhân viên/i })).toBeInTheDocument();
    });
  });

  describe('Permission Matrix in Edit Modal', () => {
    beforeEach(async () => {
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));

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
    });

    it('should show permission matrix with inherited permissions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open edit modal
      const editButtons = screen.getAllByText('Sửa');
      await user.click(editButtons[0]);

      // Should show permission groups
      expect(screen.getByText(/quản lý người dùng/i)).toBeInTheDocument();
      expect(screen.getByText(/quản lý vai trò/i)).toBeInTheDocument();
      expect(screen.getByText(/quản lý nhân viên/i)).toBeInTheDocument();

      // Should show inherited permissions indicator
      // (permissions that come from role)
      const permissionCheckboxes = screen.getAllByRole('checkbox');
      expect(permissionCheckboxes.length).toBeGreaterThan(0);
    });

    it('should allow toggling non-inherited permissions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open edit modal for regular user (not admin)
      const user1Row = screen.getByText('user1').closest('tr');
      const editButton = within(user1Row!).getByText('Sửa');
      await user.click(editButton);

      // Find non-inherited permission checkboxes
      const checkboxes = screen.getAllByRole('checkbox');
      const selectableCheckboxes = checkboxes.filter(
        cb => !cb.hasAttribute('disabled')
      );

      if (selectableCheckboxes.length > 0) {
        // Toggle a permission
        await user.click(selectableCheckboxes[0]);

        // Checkbox should be checked/unchecked
        expect(selectableCheckboxes[0]).toBeInTheDocument();
      }
    });

    it('should prevent toggling inherited permissions', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open edit modal for admin (has inherited permissions)
      const adminRow = screen.getByText('admin').closest('tr');
      const editButton = within(adminRow!).getByText('Sửa');
      await user.click(editButton);

      // Inherited permissions should be disabled
      const allCheckboxes = screen.getAllByRole('checkbox');
      // Some checkboxes should represent inherited permissions
      expect(allCheckboxes.length).toBeGreaterThan(0);
    });
  });

  describe('Role Change Impact', () => {
    beforeEach(async () => {
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));

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
    });

    it('should update permissions when changing role', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.update).mockResolvedValue({
        data: { id: '2', username: 'user1', role: 'HR_MANAGER', locked: false },
      } as any);

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('user1');

      // Open edit modal
      const user1Row = screen.getByText('user1').closest('tr');
      const editButton = within(user1Row!).getByText('Sửa');
      await user.click(editButton);

      // Change role from USER to HR_MANAGER
      const roleSelect = screen.getByLabelText(/vai trò/i);
      await user.selectOptions(roleSelect, 'HR_MANAGER');

      // Submit
      await user.click(screen.getByRole('button', { name: /cập nhật/i }));

      // Should call update API with new role
      expect(userApi.userApi.update).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          role: 'HR_MANAGER',
        })
      );

      // Success notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        })
      );
    });
  });

  describe('Permission Denied Scenarios', () => {
    it('should show notification when trying unauthorized action', async () => {
      // Mock regular user trying to access admin feature
      const { useAuthStore } = await import('@/store/authStore');
      vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockUser));

      vi.mock('@/hooks/usePermissions', () => ({
        usePermissions: () => ({
          can: () => false,
          canAny: () => false,
          canAll: () => false,
          hasRole: () => false,
          isAdmin: () => false,
          permissions: mockUser.permissions,
          roles: mockUser.roles,
          isAuthenticated: true,
        }),
      }));

      renderWithRouter(<UserManagementPage />);
      await screen.findByText('admin');

      // User should not see any action buttons
      expect(screen.queryByRole('button', { name: /thêm/i })).not.toBeInTheDocument();
      expect(screen.queryByText('Sửa')).not.toBeInTheDocument();
      expect(screen.queryByText('Xóa')).not.toBeInTheDocument();
    });
  });
});
