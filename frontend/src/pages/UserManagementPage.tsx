import { FormEvent, useEffect, useMemo, useState, useCallback } from 'react';
import { type Column } from '@/components/UI/Table';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { Input } from '@/components/UI/Input';
import { Modal } from '@/components/UI/Modal';
import { DataListPage } from '@/components/UI/DataListPage';
import { Plus, Search, Lock, Unlock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Shield, CheckSquare, Square, MinusSquare, Edit, Trash2 } from 'lucide-react';
import { userApi, UserAccount } from '@/api/user.api';
import { roleApi } from '@/api/role.api';
import { getApiErrorMessage } from '@/utils/error';
import { useUIStore } from '@/store/uiStore';
import { PermissionGate } from '@/components/Auth/PermissionGate';
import { PERMISSIONS } from '@/utils/permissions';

type User = UserAccount;

type SortField = 'username' | 'createdAt';
type SortOrder = 'asc' | 'desc';

// Permission types
type Permission = {
  id: string;
  name: string;
  description: string;
  category: string;
  inherited?: boolean;
};

type PermissionGroup = {
  category: string;
  permissions: Permission[];
};

export const UserManagementPage = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [debouncedSearchKeyword, setDebouncedSearchKeyword] = useState('');
  const [userList, setUserList] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [isLockModalOpen, setIsLockModalOpen] = useState(false);
  const [lockingUserId, setLockingUserId] = useState<string | null>(null);
  const [lockAction, setLockAction] = useState<'lock' | 'unlock'>('lock');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editLocked, setEditLocked] = useState(false);
  const [editRoleError, setEditRoleError] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { addNotification } = useUIStore();
  const [loading, setLoading] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<string[]>([
    'ADMIN',
    'HR_MANAGER',
    'PAYROLL_OFFICER',
    'DEPARTMENT_HEAD',
    'MANAGER',
    'EMPLOYEE',
    'USER',
  ]);
  
  // Button loading states for preventing duplicate submissions
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingLock, setIsTogglingLock] = useState(false);
  
  // Permission Matrix state
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set());
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>([]);
  
  // Memoize sort icon component to prevent recreation
  const SortIcon = useCallback(({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="text-slate-400" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp size={14} className="text-cyan-700" />
    ) : (
      <ArrowDown size={14} className="text-cyan-700" />
    );
  }, [sortField, sortOrder]);

  // Memoize status badge component
  const UserStatusBadge = useCallback(({ locked }: { locked: boolean | undefined | null }) => {
    const isLocked = locked === true;
    const isUnknown = locked === undefined || locked === null;

    if (isUnknown) {
      return (
        <span className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-sm">
          Không xác định
        </span>
      );
    }

    if (isLocked) {
      return (
        <span className="inline-flex items-center rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 shadow-sm">
          <Lock size={12} className="mr-1" />
          Bị khóa
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm">
        <Unlock size={12} className="mr-1" />
        Hoạt động
      </span>
    );
  }, []);

  // Debounce search input (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchKeyword(searchKeyword);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchKeyword]);

  const fetchRoles = async () => {
    try {
      const response = await roleApi.getAll();
      setAvailableRoles(response.data.map((role) => role.name));
    } catch (error) {
      addNotification({ 
        type: 'error', 
        message: getApiErrorMessage(error, 'Không thể tải danh sách vai trò')
      });
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await userApi.getAll();
      setUserList(response.data);
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Không thể tải danh sách tài khoản');
      setError(errorMessage);
      
      // Show error notification with retry option
      addNotification({
        type: 'error',
        message: errorMessage,
        onRetry: () => fetchUsers(),
        duration: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredUsers = useMemo(() => {
    const keyword = debouncedSearchKeyword.trim().toLowerCase();
    if (!keyword) return userList;
    
    return userList.filter((user) => 
      user.username.toLowerCase().includes(keyword)
    );
  }, [debouncedSearchKeyword, userList]);

  // Sorting logic
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    
    sorted.sort((a, b) => {
      let aValue: string | undefined;
      let bValue: string | undefined;
      
      if (sortField === 'username') {
        aValue = a.username.toLowerCase();
        bValue = b.username.toLowerCase();
      } else if (sortField === 'createdAt') {
        aValue = a.createdAt || '';
        bValue = b.createdAt || '';
      }
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });
    
    return sorted;
  }, [filteredUsers, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle sort order if clicking the same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default descending order
      setSortField(field);
      setSortOrder('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Pagination calculations
  const totalPages = Math.ceil(sortedUsers.length / pageSize);
  
  // Handle empty last page - reset to last valid page if current page is out of bounds
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedUsers.slice(startIndex, endIndex);
  }, [sortedUsers, currentPage, pageSize]);

  const userStats = useMemo(() => {
    const lockedCount = userList.filter((user) => user.locked).length;
    const activeCount = userList.length - lockedCount;
    const roleCounts = userList.reduce<Record<string, number>>((acc, user) => {
      const role = user.role || 'USER';
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});
    const topRole = Object.entries(roleCounts).sort((a, b) => b[1] - a[1])[0];

    return [
      {
        label: 'Tổng tài khoản',
        value: userList.length.toString(),
        hint: 'Tài khoản đang có trong hệ thống',
        tone: 'bg-cyan-50 text-cyan-700',
        icon: Shield,
      },
      {
        label: 'Đang hoạt động',
        value: activeCount.toString(),
        hint: 'Có thể đăng nhập bình thường',
        tone: 'bg-emerald-50 text-emerald-700',
        icon: Unlock,
      },
      {
        label: 'Bị khóa',
        value: lockedCount.toString(),
        hint: 'Cần admin mở khóa khi phù hợp',
        tone: 'bg-rose-50 text-rose-700',
        icon: Lock,
      },
      {
        label: 'Role phổ biến',
        value: topRole?.[0] || '--',
        hint: topRole ? `${topRole[1]} tài khoản` : 'Chưa có dữ liệu role',
        tone: 'bg-slate-100 text-slate-700',
        icon: CheckSquare,
      },
    ];
  }, [userList]);

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1); // Reset to first page when page size changes
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleToggleLock = (userId: string) => {
    const targetUser = userList.find((user) => user.id === userId);
    if (!targetUser) return;

    const action = targetUser.locked ? 'unlock' : 'lock';
    setLockingUserId(userId);
    setLockAction(action);
    setIsLockModalOpen(true);
  };

  const handleConfirmLock = async () => {
    if (!lockingUserId) return;

    // Prevent duplicate submissions
    if (isTogglingLock) return;

    const targetUser = userList.find((user) => user.id === lockingUserId);
    if (!targetUser) return;

    const updatedLocked = lockAction === 'lock';
    const previousLocked = targetUser.locked;

    // Optimistic update - update UI instantly
    setUserList((prev) =>
      prev.map((user) =>
        user.id === lockingUserId ? { ...user, locked: updatedLocked } : user
      )
    );

    setIsTogglingLock(true);
    setIsLockModalOpen(false);

    try {
      if (updatedLocked) {
        await userApi.lockAccount(targetUser.username);
      } else {
        await userApi.unlockAccount(targetUser.username);
      }
      addNotification({ 
        type: 'success', 
        message: updatedLocked ? 'Đã khóa tài khoản thành công.' : 'Đã mở khóa tài khoản thành công.' 
      });
    } catch (error: unknown) {
      // Rollback on API failure
      setUserList((prev) =>
        prev.map((user) =>
          user.id === lockingUserId ? { ...user, locked: previousLocked } : user
        )
      );
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Không thể cập nhật trạng thái tài khoản. Đã hoàn tác thay đổi.'),
      });
    } finally {
      setIsTogglingLock(false);
      setLockingUserId(null);
    }
  };

  const handleCancelLock = () => {
    setLockingUserId(null);
    setIsLockModalOpen(false);
  };

  // Validation functions
  const validateUsername = (username: string): string => {
    if (!username.trim()) {
      return 'Tên đăng nhập là bắt buộc';
    }
    if (username.trim().length < 3) {
      return 'Tên đăng nhập phải có ít nhất 3 ký tự';
    }
    if (username.trim().length > 50) {
      return 'Tên đăng nhập không được vượt quá 50 ký tự';
    }
    // Allow alphanumeric, underscore, dot, and dash
    if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) {
      return 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu chấm, gạch dưới và gạch ngang';
    }
    return '';
  };

  const validatePassword = (password: string): string => {
    if (!password.trim()) {
      return 'Mật khẩu là bắt buộc';
    }
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (password.length > 100) {
      return 'Mật khẩu không được vượt quá 100 ký tự';
    }
    return '';
  };

  const resetAddUserForm = () => {
    setNewUsername('');
    setNewPassword('');
    setNewRole('USER');
    setUsernameError('');
    setPasswordError('');
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Prevent duplicate submissions
    if (isCreating) return;

    // Validate fields
    const usernameValidationError = validateUsername(newUsername);
    const passwordValidationError = validatePassword(newPassword);

    setUsernameError(usernameValidationError);
    setPasswordError(passwordValidationError);

    // Stop if validation fails
    if (usernameValidationError || passwordValidationError) {
      return;
    }

    const offlineUser: User = {
      id: `${Date.now()}`,
      username: newUsername.trim(),
      role: newRole,
      locked: false,
      createdAt: new Date().toISOString(),
    };

    setIsCreating(true);
    try {
      const response = await userApi.create({
        username: offlineUser.username,
        password: newPassword,
        role: offlineUser.role,
      });
      setUserList((prev) => [response.data, ...prev]);
      addNotification({ type: 'success', message: 'Tạo tài khoản thành công.' });
      resetAddUserForm(); // Reset form after success
      setIsAddModalOpen(false);
    } catch (error: unknown) {
      setUserList((prev) => [offlineUser, ...prev]);
      addNotification({
        type: 'warning',
        message: getApiErrorMessage(error, 'Không thể tạo tài khoản trên server. Dữ liệu đã được lưu tạm trên trình duyệt.'),
      });
      // Still close modal and reset form even on error since data is saved locally
      resetAddUserForm();
      setIsAddModalOpen(false);
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (user: User) => {
    setEditingUserId(user.id);
    setEditUsername(user.username);
    setEditRole(user.role);
    setEditLocked(user.locked);
    setEditRoleError(''); // Clear any previous errors
    loadPermissionsForUser(user);
    setIsEditModalOpen(true);
  };

  // Load permissions for the selected user
  const loadPermissionsForUser = (user: User) => {
    // TODO: Replace with API call to fetch user permissions
    const mockPermissionGroups: PermissionGroup[] = [
      {
        category: 'Quản lý người dùng',
        permissions: [
          { id: 'user:create', name: 'Tạo người dùng', description: 'Cho phép tạo tài khoản mới', category: 'Quản lý người dùng', inherited: user.role === 'ADMIN' },
          { id: 'user:read', name: 'Xem người dùng', description: 'Cho phép xem danh sách người dùng', category: 'Quản lý người dùng', inherited: true },
          { id: 'user:update', name: 'Cập nhật người dùng', description: 'Cho phép chỉnh sửa thông tin người dùng', category: 'Quản lý người dùng', inherited: user.role === 'ADMIN' || user.role === 'HR_MANAGER' },
          { id: 'user:delete', name: 'Xóa người dùng', description: 'Cho phép xóa tài khoản', category: 'Quản lý người dùng', inherited: user.role === 'ADMIN' },
        ]
      },
      {
        category: 'Quản lý vai trò',
        permissions: [
          { id: 'role:create', name: 'Tạo vai trò', description: 'Cho phép tạo vai trò mới', category: 'Quản lý vai trò', inherited: user.role === 'ADMIN' },
          { id: 'role:read', name: 'Xem vai trò', description: 'Cho phép xem danh sách vai trò', category: 'Quản lý vai trò', inherited: true },
          { id: 'role:update', name: 'Cập nhật vai trò', description: 'Cho phép chỉnh sửa vai trò', category: 'Quản lý vai trò', inherited: user.role === 'ADMIN' },
          { id: 'role:delete', name: 'Xóa vai trò', description: 'Cho phép xóa vai trò', category: 'Quản lý vai trò', inherited: user.role === 'ADMIN' },
        ]
      },
      {
        category: 'Quản lý nhân viên',
        permissions: [
          { id: 'employee:create', name: 'Tạo nhân viên', description: 'Cho phép thêm nhân viên mới', category: 'Quản lý nhân viên', inherited: user.role === 'ADMIN' || user.role === 'HR_MANAGER' },
          { id: 'employee:read', name: 'Xem nhân viên', description: 'Cho phép xem thông tin nhân viên', category: 'Quản lý nhân viên', inherited: true },
          { id: 'employee:update', name: 'Cập nhật nhân viên', description: 'Cho phép chỉnh sửa thông tin nhân viên', category: 'Quản lý nhân viên', inherited: user.role === 'ADMIN' || user.role === 'HR_MANAGER' },
          { id: 'employee:delete', name: 'Xóa nhân viên', description: 'Cho phép xóa nhân viên', category: 'Quản lý nhân viên', inherited: user.role === 'ADMIN' },
        ]
      },
      {
        category: 'Báo cáo',
        permissions: [
          { id: 'report:view', name: 'Xem báo cáo', description: 'Cho phép xem các báo cáo', category: 'Báo cáo', inherited: user.role !== 'USER' },
          { id: 'report:export', name: 'Xuất báo cáo', description: 'Cho phép xuất báo cáo ra file', category: 'Báo cáo', inherited: user.role === 'ADMIN' || user.role === 'HR_MANAGER' },
          { id: 'report:create', name: 'Tạo báo cáo', description: 'Cho phép tạo báo cáo mới', category: 'Báo cáo', inherited: user.role === 'ADMIN' },
        ]
      },
    ];
    
    setPermissionGroups(mockPermissionGroups);
    
    // Set inherited permissions as selected by default
    const inheritedPermissions = mockPermissionGroups
      .flatMap(group => group.permissions)
      .filter(p => p.inherited)
      .map(p => p.id);
    setSelectedPermissions(new Set(inheritedPermissions));
  };

  // Permission handlers
  const handleTogglePermission = (permissionId: string, inherited: boolean) => {
    if (inherited) return; // Can't toggle inherited permissions
    
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(permissionId)) {
        newSet.delete(permissionId);
      } else {
        newSet.add(permissionId);
      }
      return newSet;
    });
  };

  const handleSelectAllInGroup = (group: PermissionGroup) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      group.permissions.forEach(p => {
        if (!p.inherited) {
          newSet.add(p.id);
        }
      });
      return newSet;
    });
  };

  const handleDeselectAllInGroup = (group: PermissionGroup) => {
    setSelectedPermissions(prev => {
      const newSet = new Set(prev);
      group.permissions.forEach(p => {
        if (!p.inherited) {
          newSet.delete(p.id);
        }
      });
      return newSet;
    });
  };

  const isGroupFullySelected = (group: PermissionGroup): boolean => {
    const nonInheritedPerms = group.permissions.filter(p => !p.inherited);
    if (nonInheritedPerms.length === 0) return false;
    return nonInheritedPerms.every(p => selectedPermissions.has(p.id));
  };

  const isGroupPartiallySelected = (group: PermissionGroup): boolean => {
    const nonInheritedPerms = group.permissions.filter(p => !p.inherited);
    if (nonInheritedPerms.length === 0) return false;
    const selectedCount = nonInheritedPerms.filter(p => selectedPermissions.has(p.id)).length;
    return selectedCount > 0 && selectedCount < nonInheritedPerms.length;
  };

  const resetEditUserForm = () => {
    setEditingUserId(null);
    setEditUsername('');
    setEditRole('USER');
    setEditLocked(false);
    setEditRoleError('');
    setSelectedPermissions(new Set());
  };

  const validateRole = (role: string): string => {
    if (!role || !availableRoles.includes(role)) {
      return 'Vai trò không hợp lệ';
    }
    return '';
  };

  const handleUpdateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingUserId) return;

    // Prevent duplicate submissions
    if (isUpdating) return;

    // Validate role
    const roleValidationError = validateRole(editRole);
    setEditRoleError(roleValidationError);

    if (roleValidationError) {
      return;
    }

    const payload = {
      role: editRole,
      locked: editLocked,
    };

    setIsUpdating(true);
    try {
      const response = await userApi.update(editingUserId, payload);
      setUserList((prev) =>
        prev.map((user) => (user.id === editingUserId ? response.data : user))
      );
      addNotification({ type: 'success', message: 'Cập nhật tài khoản thành công.' });
      resetEditUserForm(); // Reset form after success
      setIsEditModalOpen(false);
    } catch (error: unknown) {
      setUserList((prev) =>
        prev.map((user) =>
          user.id === editingUserId
            ? { ...user, role: editRole, locked: editLocked }
            : user
        )
      );
      addNotification({
        type: 'warning',
        message: getApiErrorMessage(error, 'Không thể cập nhật trên server. Thay đổi đã được lưu tạm trên trình duyệt.'),
      });
      // Still close modal and reset form even on error
      resetEditUserForm();
      setIsEditModalOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  const openDeleteModal = (userId: string) => {
    setDeletingUserId(userId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingUserId) return;
    
    // Prevent duplicate submissions
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      await userApi.delete(deletingUserId);
      addNotification({ type: 'success', message: 'Xóa tài khoản thành công.' });
    } catch (error: unknown) {
      addNotification({
        type: 'warning',
        message: getApiErrorMessage(error, 'Không thể xóa trên server. Thay đổi đã được lưu tạm trên trình duyệt.'),
      });
    } finally {
      setUserList((prev) => prev.filter((user) => user.id !== deletingUserId));
      setDeletingUserId(null);
      setIsDeleteModalOpen(false);
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingUserId(null);
    setIsDeleteModalOpen(false);
  };

  // Column definition for the shared data-list table.
  const columns: Column<UserAccount>[] = [
    { 
      key: 'username', 
      title: 'Tên đăng nhập',
      sortable: true,
      onSort: () => handleSort('username'),
      renderHeader: () => (
        <div className="flex items-center gap-2">
          <span>Tên đăng nhập</span>
          <SortIcon field="username" />
        </div>
      ),
    },
    { key: 'role', title: 'Vai trò' },
    {
      key: 'locked',
      title: 'Trạng thái',
      render: (_value, record) => <UserStatusBadge locked={record.locked} />,
    },
    { 
      key: 'createdAt', 
      title: 'Ngày tạo',
      sortable: true,
      onSort: () => handleSort('createdAt'),
      renderHeader: () => (
        <div className="flex items-center gap-2">
          <span>Ngày tạo</span>
          <SortIcon field="createdAt" />
        </div>
      ),
    },
    {
      key: 'id',
      title: 'Thao tác',
      render: (_value, record) => (
        <div className="flex flex-wrap gap-2" role="group" aria-label={`Thao tác cho tài khoản ${record.username}`}>
          <PermissionGate permission={PERMISSIONS.USER_UPDATE}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openEditModal(record);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 active:translate-y-px"
              title="Chỉnh sửa"
              aria-label={`Chỉnh sửa tài khoản ${record.username}`}
            >
              <Edit size={14} aria-hidden="true" />
              Sửa
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.USER_DELETE}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openDeleteModal(record.id);
              }}
              className="inline-flex h-8 items-center gap-1.5 rounded-md border border-rose-200 bg-white px-2.5 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:translate-y-px"
              title="Xóa"
              aria-label={`Xóa tài khoản ${record.username}`}
            >
              <Trash2 size={14} aria-hidden="true" />
              Xóa
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.USER_LOCK}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleLock(record.id);
              }}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 active:translate-y-px ${
                record.locked
                  ? 'border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 focus:ring-emerald-500'
                  : 'border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800 focus:ring-amber-500'
              }`}
              title={record.locked ? 'Mở khóa' : 'Khóa tài khoản'}
              aria-label={`${record.locked ? 'Mở khóa' : 'Khóa'} tài khoản ${record.username}`}
            >
              {record.locked ? (
                <>
                  <Unlock size={14} aria-hidden="true" />
                  Mở khóa
                </>
              ) : (
                <>
                  <Lock size={14} aria-hidden="true" />
                  Khóa
                </>
              )}
            </button>
          </PermissionGate>
        </div>
      ),
    },
  ];

  return (
    <>
      <DataListPage
        title="Quản lý tài khoản"
        description="Quản lý người dùng, trạng thái khóa và phân quyền theo vai trò."
        actions={
          <PermissionGate permission={PERMISSIONS.USER_CREATE}>
            <Button onClick={() => setIsAddModalOpen(true)} aria-label="Mở form thêm tài khoản mới">
              <Plus size={18} aria-hidden="true" />
              Thêm tài khoản
            </Button>
          </PermissionGate>
        }
        summary={
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {userStats.map((stat) => (
              <Card key={stat.label} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className="mt-1 truncate text-2xl font-semibold text-slate-900">{stat.value}</p>
                    <p className="mt-2 text-sm text-slate-500">{stat.hint}</p>
                  </div>
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${stat.tone}`}>
                    <stat.icon size={22} />
                  </div>
                </div>
              </Card>
            ))}
          </section>
        }
        filters={
          <div className="space-y-3">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <Input
                placeholder="Tìm kiếm theo tên đăng nhập..."
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
                className="pl-10"
                aria-label="Tìm kiếm tài khoản theo tên đăng nhập"
              />
            </div>
            {debouncedSearchKeyword && filteredUsers.length === 0 && !loading && (
              <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
                <AlertCircle size={16} aria-hidden="true" />
                Không tìm thấy tài khoản nào phù hợp với "{debouncedSearchKeyword}"
              </div>
            )}
          </div>
        }
        columns={columns}
        data={paginatedUsers}
        loading={loading}
        error={error}
        onRetry={fetchUsers}
        pagination={
          sortedUsers.length > 0
            ? {
                currentPage,
                totalPages,
                onPageChange: handlePageChange,
                totalItems: sortedUsers.length,
                pageSize,
                pageSizeOptions: [5, 10, 20, 50],
                onPageSizeChange: handlePageSizeChange,
                itemLabel: 'tài khoản',
              }
            : undefined
        }
      />

      <Modal isOpen={isAddModalOpen} onClose={() => { setIsAddModalOpen(false); resetAddUserForm(); }} title="Thêm tài khoản mới">
        <form className="space-y-4" onSubmit={handleCreateUser} aria-label="Form thêm tài khoản mới">
          <Input
            label="Username"
            placeholder="Nhập tên đăng nhập (3-50 ký tự)"
            required
            value={newUsername}
            onChange={(e) => {
              setNewUsername(e.target.value);
              if (usernameError) {
                setUsernameError(validateUsername(e.target.value));
              }
            }}
            onBlur={() => setUsernameError(validateUsername(newUsername))}
            error={usernameError}
            aria-required="true"
          />
          <Input
            label="Mật khẩu"
            type="password"
            placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
            required
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              if (passwordError) {
                setPasswordError(validatePassword(e.target.value));
              }
            }}
            onBlur={() => setPasswordError(validatePassword(newPassword))}
            error={passwordError}
            aria-required="true"
          />
          <div>
            <label htmlFor="add-user-role" className="mb-2 block text-sm font-semibold text-slate-700">
              Vai trò <span className="text-rose-500">*</span>
            </label>
            <div role="group" aria-labelledby="add-user-role" aria-required="true" className="flex flex-wrap gap-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setNewRole(role)}
                  aria-pressed={newRole === role}
                  aria-label={`Chọn vai trò ${role}`}
                    className={`rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 active:translate-y-px ${
                      newRole === role
                        ? 'border-slate-950 bg-slate-950 text-white'
                        : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950'
                    }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isCreating || !newUsername.trim() || !newPassword.trim() || !!usernameError || !!passwordError}
              isLoading={isCreating}
              aria-label={isCreating ? 'Đang tạo tài khoản' : 'Lưu tài khoản mới'}
            >
              {isCreating ? 'Đang tạo...' : 'Lưu tài khoản'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => { setIsAddModalOpen(false); resetAddUserForm(); }}
              disabled={isCreating}
              aria-label="Hủy và đóng form"
            >
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isEditModalOpen} onClose={() => { setIsEditModalOpen(false); resetEditUserForm(); }} title="Chỉnh sửa tài khoản" size="xl">
        <form className="space-y-4" onSubmit={handleUpdateUser} aria-label="Form chỉnh sửa tài khoản">
          <Input
            label="Username"
            placeholder="Tên đăng nhập"
            value={editUsername}
            disabled
          />
          <div>
            <label htmlFor="edit-user-role" className="mb-2 block text-sm font-semibold text-slate-700">
              Vai trò <span className="text-rose-500">*</span>
            </label>
            <div role="group" aria-labelledby="edit-user-role" aria-required="true" className="flex flex-wrap gap-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setEditRole(role);
                    if (editRoleError) {
                      setEditRoleError(validateRole(role));
                    }
                  }}
                  disabled={isUpdating}
                  aria-pressed={editRole === role}
                  aria-label={`Chọn vai trò ${role}`}
                  className={`rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2 active:translate-y-px ${
                    editRole === role
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950'
                  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {role}
                </button>
              ))}
            </div>
            {editRoleError && (
              <p className="mt-1 text-sm text-rose-600" role="alert" aria-live="polite">{editRoleError}</p>
            )}
          </div>

          <div>
            <span id="edit-user-status" className="mb-2 block text-sm font-semibold text-slate-700">
              Trạng thái <span className="text-rose-500">*</span>
            </span>
            <div role="group" aria-labelledby="edit-user-status" aria-required="true" className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditLocked(false)}
                disabled={isUpdating}
                aria-pressed={!editLocked}
                aria-label="Đặt trạng thái hoạt động"
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 active:translate-y-px ${
                  editLocked
                    ? 'border-slate-200 bg-white text-slate-700'
                    : 'border-emerald-700 bg-emerald-700 text-white'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : editLocked ? 'hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950' : ''}`}
              >
                Hoạt động
              </button>
              <button
                type="button"
                onClick={() => setEditLocked(true)}
                disabled={isUpdating}
                aria-pressed={editLocked}
                aria-label="Đặt trạng thái bị khóa"
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 active:translate-y-px ${
                  editLocked
                    ? 'border-rose-700 bg-rose-700 text-white'
                    : 'border-slate-200 bg-white text-slate-700'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : editLocked ? '' : 'hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950'}`}
              >
                Bị khóa
              </button>
            </div>
          </div>

          {/* Permission Matrix UI */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Shield size={18} className="text-cyan-700" aria-hidden="true" />
              <span id="permission-matrix-heading" className="block text-sm font-semibold text-slate-700">
                Ma trận phân quyền
              </span>
            </div>
            
            <div 
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              role="region"
              aria-labelledby="permission-matrix-heading"
            >
              {permissionGroups.map((group, groupIndex) => (
                <div key={group.category} className={groupIndex !== 0 ? 'border-t border-slate-200' : ''}>
                  {/* Group Header */}
                  <div className="flex items-center justify-between bg-slate-50/90 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (isGroupFullySelected(group)) {
                            handleDeselectAllInGroup(group);
                          } else {
                            handleSelectAllInGroup(group);
                          }
                        }}
                        aria-label={`${isGroupFullySelected(group) ? 'Bỏ chọn' : 'Chọn'} tất cả quyền trong nhóm ${group.category}`}
                        className="rounded-md transition hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-cyan-600 focus:ring-offset-2"
                        disabled={isUpdating || group.permissions.every(p => p.inherited)}
                      >
                        {isGroupFullySelected(group) ? (
                          <CheckSquare size={18} className="text-cyan-700" aria-hidden="true" />
                        ) : isGroupPartiallySelected(group) ? (
                          <MinusSquare size={18} className="text-cyan-500" aria-hidden="true" />
                        ) : (
                          <Square size={18} className="text-slate-400" aria-hidden="true" />
                        )}
                      </button>
                      <span className="text-sm font-semibold text-slate-900">{group.category}</span>
                    </div>
                    <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200" aria-label={`${group.permissions.filter(p => selectedPermissions.has(p.id)).length} trên ${group.permissions.length} quyền được chọn`}>
                      {group.permissions.filter(p => selectedPermissions.has(p.id)).length} / {group.permissions.length}
                    </span>
                  </div>

                  {/* Permissions List */}
                  <div className="bg-white" role="group" aria-label={`Danh sách quyền ${group.category}`}>
                    {group.permissions.map((permission) => {
                      const permissionInputId = `permission-${permission.id}`;
                      return (
                        <div
                          key={permission.id}
                          className="border-t border-slate-100 px-4 py-3 transition hover:bg-slate-50 first:border-t-0"
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <input
                                type="checkbox"
                                id={permissionInputId}
                                checked={selectedPermissions.has(permission.id)}
                                onChange={() => handleTogglePermission(permission.id, permission.inherited || false)}
                                disabled={isUpdating || permission.inherited}
                                aria-describedby={`${permissionInputId}-description`}
                                className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-700 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                              />
                            </div>
                            <label htmlFor={permissionInputId} className="flex-1 min-w-0 cursor-pointer">
                              <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">
                                  {permission.name}
                                </span>
                                {permission.inherited && (
                                  <span 
                                    className="inline-flex items-center rounded-md bg-cyan-100 px-2 py-0.5 text-xs font-semibold text-cyan-800"
                                    aria-label="Quyền này được kế thừa từ vai trò"
                                  >
                                    Kế thừa
                                  </span>
                                )}
                              </div>
                              <p id={`${permissionInputId}-description`} className="mt-0.5 text-xs leading-5 text-slate-500">
                                {permission.description}
                              </p>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-2 flex items-start gap-1 text-xs leading-5 text-slate-500" role="note">
              <AlertCircle size={12} className="mt-0.5 flex-shrink-0" aria-hidden="true" />
              <span>
                Quyền "Kế thừa" được gắn tự động từ vai trò và không thể thay đổi trực tiếp.
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button 
              type="submit" 
              disabled={isUpdating || !!editRoleError}
              isLoading={isUpdating}
              aria-label={isUpdating ? 'Đang cập nhật tài khoản' : 'Lưu thay đổi tài khoản'}
            >
              {isUpdating ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => { setIsEditModalOpen(false); resetEditUserForm(); }}
              disabled={isUpdating}
              aria-label="Hủy và đóng form"
            >
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isLockModalOpen} onClose={handleCancelLock} title="Xác nhận thay Đổi trạng thái">
        <div className="space-y-4">
          <p role="alert">
            {lockAction === 'lock' 
              ? 'Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập sau khi bị khóa.'
              : 'Bạn có chắc chắn muốn mở khóa tài khoản này? Người dùng sẽ có thể đăng nhập lại sau khi được mở khóa.'
            }
          </p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant={lockAction === 'lock' ? 'danger' : 'primary'}
              onClick={handleConfirmLock}
              disabled={isTogglingLock}
              isLoading={isTogglingLock}
              aria-label={isTogglingLock ? 'đang xử lý' : (lockAction === 'lock' ? 'Xác nhận khóa tài khoản' : 'Xác nhận m? khóa tài khoản')}
            >
              {isTogglingLock ? 'Đang xử lý...' : (lockAction === 'lock' ? 'Khóa tài khoản' : 'Mở khóa')}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCancelLock}
              disabled={isTogglingLock}
              aria-label="H?y thao tác"
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isDeleteModalOpen} onClose={handleCancelDelete} title="Xác nhận xóa">
        <div className="space-y-4">
          <p role="alert">Bạn có chỉc chọn mu?n xóa tài khoản này? Hành động này không thể hoàn tác.</p>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="danger" 
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              isLoading={isDeleting}
              aria-label="Xác nhận xóa tài khoản"
            >
              {isDeleting ? 'Đang xóa...' : 'Xóa'}
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleCancelDelete}
              disabled={isDeleting}
              aria-label="Hủy xóa"
            >
              Hủy
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
