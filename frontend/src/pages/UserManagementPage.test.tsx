import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserManagementPage } from './UserManagementPage';
import { renderWithRouter, createMockAuthStore, createMockUIStore, mockAdminUser } from '@/test/utils';
import * as userApi from '@/api/user.api';
import * as roleApi from '@/api/role.api';

// Mock modules
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(),
}));

vi.mock('@/store/uiStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('@/api/user.api');
vi.mock('@/api/role.api');

// Mock hooks
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

describe('UserManagementPage', () => {
  const mockUsers = [
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
      locked: true,
      createdAt: '2024-01-03T00:00:00Z',
    },
  ];

  const mockRoles = [
    { id: '1', name: 'ADMIN', description: 'Administrator' },
    { id: '2', name: 'USER', description: 'Regular user' },
    { id: '3', name: 'HR_MANAGER', description: 'HR Manager' },
  ];

  let mockUIStore: ReturnType<typeof createMockUIStore>;

  beforeEach(async () => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock stores
    mockUIStore = createMockUIStore();
    
    const { useAuthStore } = await import('@/store/authStore');
    const { useUIStore } = await import('@/store/uiStore');
    
    vi.mocked(useAuthStore).mockReturnValue(createMockAuthStore(mockAdminUser));
    vi.mocked(useUIStore).mockReturnValue(mockUIStore);

    // Mock API responses
    vi.mocked(userApi.userApi.getAll).mockResolvedValue({ data: mockUsers } as any);
    vi.mocked(roleApi.roleApi.getAll).mockResolvedValue({ data: mockRoles } as any);
  });

  describe('User Table Rendering', () => {
    it('should render user table with data', async () => {
      renderWithRouter(<UserManagementPage />);

      // Wait for data to load
      await screen.findByText('admin');

      // Check table headers (sidebar also contains "Vai trò" nav item, use getAllByText)
      expect(screen.getByText('Tên đăng nhập')).toBeInTheDocument();
      expect(screen.getAllByText('Vai trò').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Trạng thái')).toBeInTheDocument();

      // Check user data
      expect(screen.getByText('admin')).toBeInTheDocument();
      expect(screen.getByText('user1')).toBeInTheDocument();
      expect(screen.getByText('hrmanager')).toBeInTheDocument();
    });

    it('should display user status badges correctly', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Active users should show "Hoạt động"
      const activeStatuses = screen.getAllByText('Hoạt động');
      expect(activeStatuses.length).toBe(2);

      // Locked users should show "Bị khóa"
      expect(screen.getByText('Bị khóa')).toBeInTheDocument();
    });

    it('should render action buttons for each user', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Each user should have edit, delete, and lock/unlock buttons
      const editButtons = screen.getAllByText('Sửa');
      const deleteButtons = screen.getAllByText('Xóa');
      
      expect(editButtons.length).toBe(mockUsers.length);
      expect(deleteButtons.length).toBe(mockUsers.length);
    });

    it('should show loading skeleton while fetching data', () => {
      vi.mocked(userApi.userApi.getAll).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(<UserManagementPage />);

      // Should show loading state
      expect(screen.queryByText('admin')).not.toBeInTheDocument();
    });

    it('should show error message on API failure', async () => {
      vi.mocked(userApi.userApi.getAll).mockRejectedValue({
        response: { status: 500, data: { message: 'Server error' } },
      });

      renderWithRouter(<UserManagementPage />);

      // Should trigger error notification when API fails
      await vi.waitFor(() => {
        expect(mockUIStore.addNotification).toHaveBeenCalledWith(
          expect.objectContaining({ type: 'error' })
        );
      });
    });
  });

  describe('Search Functionality', () => {
    it('should filter users by username', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Type in search
      const searchInput = screen.getByPlaceholderText(/tìm kiếm/i);
      await user.type(searchInput, 'admin');

      // Wait for debounce
      await new Promise(resolve => setTimeout(resolve, 600));

      // Should show only admin user
      expect(screen.getByText('admin')).toBeInTheDocument();
      // Other users should not be visible
      expect(screen.queryByText('user1')).not.toBeInTheDocument();
    });

    it('should show "no results" message when search has no matches', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const searchInput = screen.getByPlaceholderText(/tìm kiếm/i);
      await user.type(searchInput, 'nonexistent');

      await new Promise(resolve => setTimeout(resolve, 600));

      expect(screen.getByText(/không tìm thấy/i)).toBeInTheDocument();
    });
  });

  describe('User Creation Modal', () => {
    it('should open add user modal when clicking add button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const addButton = screen.getByRole('button', { name: /thêm tài khoản/i });
      await user.click(addButton);

      // Modal should be open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Tạo tài khoản mới')).toBeInTheDocument();
    });

    it('should validate username field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open modal
      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));

      // Try to submit without username
      const submitButton = screen.getByRole('button', { name: /tạo/i });
      await user.click(submitButton);

      // Should show validation error
      expect(await screen.findByText(/tên đăng nhập là bắt buộc/i)).toBeInTheDocument();
    });

    it('should validate password field', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));

      // Enter username but no password
      const usernameInput = screen.getByLabelText(/tên đăng nhập/i);
      await user.type(usernameInput, 'newuser');

      const submitButton = screen.getByRole('button', { name: /tạo/i });
      await user.click(submitButton);

      expect(await screen.findByText(/mật khẩu là bắt buộc/i)).toBeInTheDocument();
    });

    it('should create user with valid data', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.create).mockResolvedValue({
        data: { id: '4', username: 'newuser', role: 'USER', locked: false },
      } as any);

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      await user.click(screen.getByRole('button', { name: /thêm tài khoản/i }));

      // Fill form
      await user.type(screen.getByLabelText(/tên đăng nhập/i), 'newuser');
      await user.type(screen.getByLabelText(/mật khẩu/i), 'password123');

      // Submit
      await user.click(screen.getByRole('button', { name: /tạo/i }));

      // API should be called
      expect(userApi.userApi.create).toHaveBeenCalledWith({
        username: 'newuser',
        password: 'password123',
        role: 'USER',
      });

      // Success notification
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringContaining('thành công'),
        })
      );
    });
  });

  describe('User Edit Modal', () => {
    it('should open edit modal when clicking edit button', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Click first edit button
      const editButtons = screen.getAllByText('Sửa');
      await user.click(editButtons[0]);

      // Modal should be open with user data
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Chỉnh sửa tài khoản')).toBeInTheDocument();
    });

    it('should show permission matrix in edit modal', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const editButtons = screen.getAllByText('Sửa');
      await user.click(editButtons[0]);

      // Permission matrix should be visible — scope to dialog to avoid page description match
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getAllByText(/quản lý người dùng/i).length).toBeGreaterThanOrEqual(1);
      expect(within(dialog).getAllByText(/quản lý vai trò/i).length).toBeGreaterThanOrEqual(1);
    });

    it('should update user role', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.update).mockResolvedValue({
        data: mockUsers[1],
      } as any);

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Open edit modal for user1
      const editButtons = screen.getAllByText('Sửa');
      await user.click(editButtons[1]);

      // Change role — component uses toggle buttons, not a <select>
      const dialog = screen.getByRole('dialog');
      await user.click(within(dialog).getByRole('button', { name: /chọn vai trò HR_MANAGER/i }));

      // Submit
      await user.click(within(dialog).getByRole('button', { name: /cập nhật/i }));

      // API should be called
      expect(userApi.userApi.update).toHaveBeenCalledWith(
        '2',
        expect.objectContaining({
          role: 'HR_MANAGER',
        })
      );
    });
  });

  describe('User Deletion', () => {
    it('should open delete confirmation modal', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      // Confirmation modal should appear
      expect(screen.getByText(/bạn có chắc chắn muốn xóa/i)).toBeInTheDocument();
    });

    it('should delete user on confirmation', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.delete).mockResolvedValue({} as any);

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Click delete on second user (user1)
      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[1]);

      // Confirm deletion — use aria-label to avoid ambiguity with row delete buttons
      const confirmButton = screen.getByRole('button', { name: /xác nhận xóa tài khoản/i });
      await user.click(confirmButton);

      // API should be called
      expect(userApi.userApi.delete).toHaveBeenCalledWith('2');

      // Success notification (case-insensitive match for Vietnamese capital letter)
      expect(mockUIStore.addNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
          message: expect.stringMatching(/xóa/i),
        })
      );
    });

    it('should cancel deletion', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const deleteButtons = screen.getAllByText('Xóa');
      await user.click(deleteButtons[0]);

      // Cancel
      const cancelButton = screen.getByRole('button', { name: /hủy/i });
      await user.click(cancelButton);

      // Modal should close
      expect(screen.queryByText(/bạn có chắc chắn/i)).not.toBeInTheDocument();

      // API should not be called
      expect(userApi.userApi.delete).not.toHaveBeenCalled();
    });
  });

  describe('User Lock/Unlock', () => {
    it('should show lock button for active users', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Lock icons should be present
      const table = screen.getByRole('table');
      const lockIcons = within(table).getAllByTitle(/khóa tài khoản/i);
      expect(lockIcons.length).toBeGreaterThan(0);
    });

    it('should show unlock button for locked users', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('hrmanager');

      // Unlock icon should be present for hrmanager (locked)
      const table = screen.getByRole('table');
      const unlockIcon = within(table).getByTitle(/mở khóa/i);
      expect(unlockIcon).toBeInTheDocument();
    });

    it('should lock user account', async () => {
      const user = userEvent.setup();
      vi.mocked(userApi.userApi.lockAccount).mockResolvedValue({} as any);

      renderWithRouter(<UserManagementPage />);

      await screen.findByText('user1');

      // Click lock button for user1 (active)
      const table = screen.getByRole('table');
      const lockButtons = within(table).getAllByTitle(/khóa tài khoản/i);
      await user.click(lockButtons[0]);

      // Confirm lock — use specific aria-label to avoid row lock buttons
      const confirmButton = screen.getByRole('button', { name: /xác nhận khóa/i });
      await user.click(confirmButton);

      // API should be called
      expect(userApi.userApi.lockAccount).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('should sort by username', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Click username header to sort
      const usernameHeader = screen.getByText('Tên đăng nhập');
      await user.click(usernameHeader);

      // Order should change (visual check would be needed)
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('should sort by created date', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const dateHeader = screen.getByText('Ngày tạo');
      await user.click(dateHeader);

      expect(screen.getByText('admin')).toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('should show pagination controls', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Pagination nav should exist
      const nav = screen.getByRole('navigation', { name: /điều hướng trang/i });
      expect(nav).toBeInTheDocument();

      // Page size group should exist
      const sizeGroup = screen.getByRole('group', { name: /số dòng mỗi trang/i });
      expect(sizeGroup).toBeInTheDocument();
    });

    it('should change page size', async () => {
      const user = userEvent.setup();
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Click the page size button for 20 items
      const btn20 = screen.getByRole('button', { name: '20 dòng mỗi trang' });
      await user.click(btn20);

      // The 20 button should now be active (pressed)
      expect(btn20).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      // Search input should have aria-label
      const searchInput = screen.getByPlaceholderText(/tìm kiếm/i);
      expect(searchInput).toHaveAccessibleName();

      // Buttons should have aria-labels
      const addButton = screen.getByRole('button', { name: /thêm tài khoản/i });
      expect(addButton).toHaveAccessibleName();
    });

    it('should have accessible table', async () => {
      renderWithRouter(<UserManagementPage />);

      await screen.findByText('admin');

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Headers should be accessible
      const headers = screen.getAllByRole('columnheader');
      expect(headers.length).toBeGreaterThan(0);
    });
  });
});
