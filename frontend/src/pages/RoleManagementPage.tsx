import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { DataListPage } from '@/components/UI/DataListPage';
import { RowActions } from '@/components/UI/RowActions';
import { type Column } from '@/components/UI/Table';
import { Plus, Edit, Trash2, Shield, AlertCircle, Search } from 'lucide-react';
import { roleApi, RoleDefinition, RolePermission } from '@/api/role.api';
import { getApiErrorMessage } from '@/utils/error';
import { useUIStore } from '@/store/uiStore';

export const RoleManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [roleList, setRoleList] = useState<RoleDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [sortKey, setSortKey] = useState<keyof RoleDefinition>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  // Add role form state
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDescription, setNewRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [roleNameError, setRoleNameError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  
  // Edit role form state
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editRoleDescription, setEditRoleDescription] = useState('');
  const [editPermissions, setEditPermissions] = useState<string[]>([]);
  const [editDescriptionError, setEditDescriptionError] = useState('');
  
  // Delete role state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null);
  
  const { addNotification } = useUIStore();

  // System roles that cannot be deleted
  const SYSTEM_ROLES = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER', 'EMPLOYEE', 'USER'];

  // TASK 3.7: Grouped permissions for matrix UI
  const permissionGroups = {
    'Nhân viên': [
      { value: 'READ_EMPLOYEE', label: 'Xem nhân viên' },
      { value: 'WRITE_EMPLOYEE', label: 'Thêm/Sửa nhân viên' },
      { value: 'DELETE_EMPLOYEE', label: 'Xóa nhân viên' },
    ],
    'Phòng ban': [
      { value: 'READ_DEPARTMENT', label: 'Xem phòng ban' },
      { value: 'WRITE_DEPARTMENT', label: 'Thêm/Sửa phòng ban' },
      { value: 'DELETE_DEPARTMENT', label: 'Xóa phòng ban' },
    ],
    'Người dùng': [
      { value: 'READ_USER', label: 'Xem người dùng' },
      { value: 'WRITE_USER', label: 'Thêm/Sửa người dùng' },
      { value: 'DELETE_USER', label: 'Xóa người dùng' },
    ],
  };

  const allPermissions = Object.values(permissionGroups).flat().map((p) => p.value);

  // Fetch roles with loading and error handling
  const fetchRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await roleApi.getAll();
      setRoleList(response.data);
    } catch (error: unknown) {
      const errorMessage = getApiErrorMessage(error, 'Không thể tải danh sách vai trò');
      setError(errorMessage);
      
      addNotification({
        type: 'error',
        message: errorMessage,
        onRetry: () => fetchRoles(),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // TASK 3.4: Validation functions
  const validateRoleName = (name: string): string => {
    if (!name.trim()) {
      return 'Tên vai trò là bắt buộc';
    }
    
    if (name.trim().length < 2) {
      return 'Tên vai trò phải có ít nhất 2 ký tự';
    }
    
    if (name.trim().length > 50) {
      return 'Tên vai trò không được vượt quá 50 ký tự';
    }
    
    // Check uniqueness
    const normalizedName = name.trim().toUpperCase();
    const exists = roleList.some(
      (role) => role.name.toUpperCase() === normalizedName
    );
    
    if (exists) {
      return 'Tên vai trò đã tồn tại trong hệ thống';
    }
    
    // Check valid characters
    if (!/^[a-zA-Z0-9_\s]+$/.test(name.trim())) {
      return 'Tên vai trò chỉ được chứa chữ cái, số, dấu gạch dưới và khoảng trắng';
    }
    
    return '';
  };

  const validateDescription = (description: string): string => {
    if (!description.trim()) {
      return 'Mô tả là bắt buộc';
    }
    
    if (description.trim().length < 10) {
      return 'Mô tả phải có ít nhất 10 ký tự';
    }
    
    if (description.trim().length > 500) {
      return 'Mô tả không được vượt quá 500 ký tự';
    }
    
    return '';
  };

  const resetAddRoleForm = () => {
    setNewRoleName('');
    setNewRoleDescription('');
    setSelectedPermissions([]);
    setRoleNameError('');
    setDescriptionError('');
  };

  const handleDeleteRole = (roleId: string) => {
    const role = roleList.find((r) => r.id === roleId);
    
    if (!role) {
      addNotification({
        type: 'error',
        message: 'Không tìm thấy vai trò cần xóa',
      });
      return;
    }

    // TASK 3.6: Prevent deletion of system roles
    if (SYSTEM_ROLES.includes(role.name.toUpperCase())) {
      addNotification({
        type: 'error',
        message: `Không thể xóa vai trò hệ thống "${role.name}". Vai trò này được bảo vệ.`,
      });
      return;
    }

    // TASK 3.6: Handle dependency validation
    if (role.userCount > 0) {
      addNotification({
        type: 'warning',
        message: `Vai trò "${role.name}" đang được sử dụng bởi ${role.userCount} người dùng. Vui lòng chuyển các người dùng này sang vai trò khác trước khi xóa.`,
      });
      return;
    }

    // TASK 3.6: Show confirmation modal
    setDeletingRoleId(roleId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingRoleId) return;

    const role = roleList.find((r) => r.id === deletingRoleId);
    if (!role) return;

    setLoading(true);

    try {
      await roleApi.remove(role.name);
      await fetchRoles();

      addNotification({
        type: 'success',
        message: `Vai trò "${role.name}" đã được xóa thành công`,
      });

      setDeletingRoleId(null);
      setIsDeleteModalOpen(false);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Không thể xóa vai trò'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingRoleId(null);
    setIsDeleteModalOpen(false);
  };

  const handleEditRole = (roleId: string) => {
    // TASK 3.5: Prefill existing role
    const role = roleList.find((r) => r.id === roleId);
    
    if (!role) {
      addNotification({
        type: 'error',
        message: 'Không tìm thấy vai trò cần chỉnh sửa',
      });
      return;
    }

    setEditingRoleId(role.id);
    setEditRoleName(role.name);
    setEditRoleDescription(role.description);
    setEditPermissions([...role.permissions]);
    setEditDescriptionError('');
    setIsEditModalOpen(true);
  };

  const handleEditPermissionToggle = (permission: string) => {
    setEditPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  // TASK 3.7: Permission Matrix Component
  const PermissionMatrix = ({ 
    selectedPerms, 
    onToggle, 
    isAdd = true 
  }: { 
    selectedPerms: string[]; 
    onToggle: (perm: string) => void; 
    isAdd?: boolean;
  }) => {
    return (
      <div className="space-y-4">
        {/* Select All Button */}
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selectedPerms.length === allPermissions.length}
              onChange={() => handleSelectAllPermissions(isAdd)}
              className="rounded"
            />
            <span className="font-medium text-blue-900">
              Chọn tất cả quyền ({selectedPerms.length}/{allPermissions.length})
            </span>
          </label>
        </div>

        {/* Grouped Permissions */}
        {Object.entries(permissionGroups).map(([groupName, permissions]) => {
          const groupPerms = permissions.map((p) => p.value);
          const allGroupSelected = groupPerms.every((p) => selectedPerms.includes(p));
          const someGroupSelected = groupPerms.some((p) => selectedPerms.includes(p)) && !allGroupSelected;

          return (
            <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Group Header */}
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allGroupSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someGroupSelected;
                    }}
                    onChange={() => handleSelectAllInGroup(groupName, isAdd)}
                    className="rounded"
                  />
                  <span className="font-medium text-gray-900">{groupName}</span>
                </label>
                <span className="text-xs text-gray-600">
                  {groupPerms.filter((p) => selectedPerms.includes(p)).length}/{groupPerms.length}
                </span>
              </div>

              {/* Group Permissions */}
              <div className="p-3 space-y-2">
                {permissions.map((perm) => (
                  <label
                    key={perm.value}
                    className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPerms.includes(perm.value)}
                      onChange={() => onToggle(perm.value)}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{perm.label}</div>
                      <div className="text-xs text-gray-500">{perm.value}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const resetEditRoleForm = () => {
    setEditingRoleId(null);
    setEditRoleName('');
    setEditRoleDescription('');
    setEditPermissions([]);
    setEditDescriptionError('');
  };

  const handleUpdateRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!editingRoleId) return;

    const descError = validateDescription(editRoleDescription);
    setEditDescriptionError(descError);

    if (descError) {
      return;
    }

    if (editPermissions.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Vui lòng chọn ít nhất một quyền cho vai trò',
      });
      return;
    }

    setLoading(true);

    try {
      const updatedRole = await roleApi.update(editRoleName, {
        description: editRoleDescription.trim(),
        permissions: editPermissions as RolePermission[],
      });
      await fetchRoles();

      addNotification({
        type: 'success',
        message: `Vai trò "${updatedRole.name}" đã được cập nhật thành công`,
      });

      resetEditRoleForm();
      setIsEditModalOpen(false);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Không thể cập nhật vai trò'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permission: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((item) => item !== permission)
        : [...prev, permission]
    );
  };

  // TASK 3.7: Select all permissions in a group
  const handleSelectAllInGroup = (groupName: string, isAdd: boolean = true) => {
    const groupPermissions = permissionGroups[groupName as keyof typeof permissionGroups].map((p) => p.value);
    
    if (isAdd) {
      setSelectedPermissions((prev) => {
        const allSelected = groupPermissions.every((perm) => prev.includes(perm));
        if (allSelected) {
          // Unselect all in group
          return prev.filter((perm) => !groupPermissions.includes(perm));
        } else {
          // Select all in group
          return [...new Set([...prev, ...groupPermissions])];
        }
      });
    } else {
      setEditPermissions((prev) => {
        const allSelected = groupPermissions.every((perm) => prev.includes(perm));
        if (allSelected) {
          return prev.filter((perm) => !groupPermissions.includes(perm));
        } else {
          return [...new Set([...prev, ...groupPermissions])];
        }
      });
    }
  };

  // TASK 3.7: Select all permissions globally
  const handleSelectAllPermissions = (isAdd: boolean = true) => {
    if (isAdd) {
      if (selectedPermissions.length === allPermissions.length) {
        setSelectedPermissions([]);
      } else {
        setSelectedPermissions([...allPermissions]);
      }
    } else {
      if (editPermissions.length === allPermissions.length) {
        setEditPermissions([]);
      } else {
        setEditPermissions([...allPermissions]);
      }
    }
  };

  const handleAddRole = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nameError = validateRoleName(newRoleName);
    const descError = validateDescription(newRoleDescription);

    setRoleNameError(nameError);
    setDescriptionError(descError);

    if (nameError || descError) {
      return;
    }

    if (selectedPermissions.length === 0) {
      addNotification({
        type: 'warning',
        message: 'Vui lòng chọn ít nhất một quyền cho vai trò',
      });
      return;
    }

    setLoading(true);

    try {
      const newRole = await roleApi.create({
        name: newRoleName.trim(),
        description: newRoleDescription.trim(),
        permissions: selectedPermissions as RolePermission[],
      });
      await fetchRoles();

      addNotification({
        type: 'success',
        message: `Vai trò "${newRole.name}" đã được tạo thành công`,
      });

      resetAddRoleForm();
      setIsModalOpen(false);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Không thể tạo vai trò'),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [pageSize, searchKeyword]);

  const handleSort = (key: keyof RoleDefinition) => {
    setSortKey(key);
    setSortDirection((current) => (sortKey === key && current === 'asc' ? 'desc' : 'asc'));
  };

  const filteredRoles = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    const filtered = keyword
      ? roleList.filter((role) =>
          [role.name, role.description, ...(Array.isArray(role.permissions) ? role.permissions : [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(keyword))
        )
      : roleList;

    return [...filtered].sort((a, b) => {
      const first = a[sortKey];
      const second = b[sortKey];
      const compare = String(first ?? '').localeCompare(String(second ?? ''), 'vi', { numeric: true });

      return sortDirection === 'asc' ? compare : -compare;
    });
  }, [roleList, searchKeyword, sortDirection, sortKey]);

  const totalPages = Math.max(1, Math.ceil(filteredRoles.length / pageSize));
  const pagedRoles = filteredRoles.slice((page - 1) * pageSize, page * pageSize);

  const columns: Column<RoleDefinition>[] = [
      { key: 'name', title: 'Tên vai trò', sortable: true, onSort: handleSort },
      { key: 'description', title: 'Mô tả', sortable: true, onSort: handleSort },
      {
        key: 'permissions',
        title: 'Quyền hạn',
        render: (value): ReactNode => {
          const permissions = Array.isArray(value) ? value : [];
          return (
            <div className="flex flex-wrap gap-1">
              {permissions.slice(0, 4).map((permission) => (
                <span key={permission} className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-700">
                  {permission}
                </span>
              ))}
              {permissions.length > 4 && (
                <span className="rounded bg-cyan-50 px-2 py-1 text-xs font-medium text-cyan-700">
                  +{permissions.length - 4}
                </span>
              )}
              {permissions.length === 0 && <span className="text-sm text-slate-400">--</span>}
            </div>
          );
        },
      },
      { key: 'userCount', title: 'Người dùng', sortable: true, onSort: handleSort },
      {
        key: 'id',
        title: 'Thao tác',
        render: (_value, record): ReactNode => (
          <RowActions
            label="Thao tác vai trò"
            actions={[
              {
                icon: <Edit size={16} />,
                label: 'Chỉnh sửa',
                onClick: () => handleEditRole(record.id),
              },
              {
                icon: <Trash2 size={16} />,
                label: 'Xóa',
                tone: 'danger',
                onClick: () => handleDeleteRole(record.id),
              },
            ]}
          />
        ),
      },
  ];

  return (
    <>
      <DataListPage
        icon={Shield}
        title="Quản lý vai trò"
        description="Quản lý vai trò, quyền hạn và phạm vi truy cập trong hệ thống."
        actions={
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} />
            Thêm vai trò
          </Button>
        }
        filters={
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <Input
              placeholder="Tìm theo tên, mô tả hoặc quyền hạn..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
              className="pl-10"
            />
          </div>
        }
        columns={columns}
        data={pagedRoles}
        loading={loading}
        error={error}
        onRetry={fetchRoles}
        pagination={{
          currentPage: page,
          totalPages,
          totalItems: filteredRoles.length,
          pageSize,
          pageSizeOptions: [10, 20, 50],
          itemLabel: 'vai trò',
          onPageChange: setPage,
          onPageSizeChange: setPageSize,
        }}
      />

        <Modal 
          isOpen={isModalOpen} 
          onClose={() => { setIsModalOpen(false); resetAddRoleForm(); }} 
          title="Thêm vai trò mới"
        >
          <form className="space-y-4" onSubmit={handleAddRole}>
            <Input
              label="Tên vai trò"
              placeholder="Nhập tên vai trò (VD: MANAGER, EMPLOYEE)"
              required
              value={newRoleName}
              onChange={(e) => {
                setNewRoleName(e.target.value);
                if (roleNameError) {
                  setRoleNameError(validateRoleName(e.target.value));
                }
              }}
              onBlur={() => setRoleNameError(validateRoleName(newRoleName))}
              error={roleNameError}
            />
            
            <div>
              <label htmlFor="roleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="roleDescription"
                value={newRoleDescription}
                onChange={(e) => {
                  setNewRoleDescription(e.target.value);
                  if (descriptionError) {
                    setDescriptionError(validateDescription(e.target.value));
                  }
                }}
                onBlur={() => setDescriptionError(validateDescription(newRoleDescription))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  descriptionError ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Nhập mô tả vai trò (tối thiểu 10 ký tự)"
              />
              {descriptionError && (
                <p className="mt-1 text-sm text-red-500">{descriptionError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {newRoleDescription.length}/500 ký tự
              </p>
            </div>

            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Quyền hạn <span className="text-red-500">*</span>
              </div>
              
              {/* TASK 3.7: Use Permission Matrix */}
              <PermissionMatrix
                selectedPerms={selectedPermissions}
                onToggle={handlePermissionToggle}
                isAdd={true}
              />
              
              {selectedPermissions.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Vui lòng chọn ít nhất một quyền
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  !newRoleName.trim() || 
                  !newRoleDescription.trim() ||
                  !!roleNameError || 
                  !!descriptionError ||
                  selectedPermissions.length === 0
                }
              >
                {loading ? 'Đang tạo...' : 'Tạo vai trò'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => { setIsModalOpen(false); resetAddRoleForm(); }}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Modal>

        {/* TASK 3.5: Edit Role Modal */}
        <Modal 
          isOpen={isEditModalOpen} 
          onClose={() => { setIsEditModalOpen(false); resetEditRoleForm(); }} 
          title="Chỉnh sửa vai trò"
        >
          <form className="space-y-4" onSubmit={handleUpdateRole}>
            {/* Role name (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tên vai trò
              </label>
              <input
                type="text"
                value={editRoleName}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Tên vai trò không thể thay đổi
              </p>
            </div>

            {/* Description (editable) */}
            <div>
              <label htmlFor="editRoleDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả <span className="text-red-500">*</span>
              </label>
              <textarea
                id="editRoleDescription"
                value={editRoleDescription}
                onChange={(e) => {
                  setEditRoleDescription(e.target.value);
                  if (editDescriptionError) {
                    setEditDescriptionError(validateDescription(e.target.value));
                  }
                }}
                onBlur={() => setEditDescriptionError(validateDescription(editRoleDescription))}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  editDescriptionError ? 'border-red-500' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Nhập mô tả vai trò (tối thiểu 10 ký tự)"
              />
              {editDescriptionError && (
                <p className="mt-1 text-sm text-red-500">{editDescriptionError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {editRoleDescription.length}/500 ký tự
              </p>
            </div>

            {/* Permissions (editable) */}
            <div>
              <div className="block text-sm font-medium text-gray-700 mb-2">
                Quyền hạn <span className="text-red-500">*</span>
              </div>
              
              {/* TASK 3.7: Use Permission Matrix */}
              <PermissionMatrix
                selectedPerms={editPermissions}
                onToggle={handleEditPermissionToggle}
                isAdd={false}
              />
              
              {editPermissions.length === 0 && (
                <p className="mt-2 text-xs text-red-500">
                  Vui lòng chọn ít nhất một quyền
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="submit" 
                disabled={
                  loading || 
                  !editRoleDescription.trim() ||
                  !!editDescriptionError ||
                  editPermissions.length === 0
                }
              >
                {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => { setIsEditModalOpen(false); resetEditRoleForm(); }}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </form>
        </Modal>

        {/* TASK 3.6: Delete Confirmation Modal */}
        <Modal 
          isOpen={isDeleteModalOpen} 
          onClose={handleCancelDelete} 
          title="Xác nhận xóa vai trò"
        >
          <div className="space-y-4">
            {deletingRoleId && (() => {
              const role = roleList.find((r) => r.id === deletingRoleId);
              if (!role) return null;

              return (
                <>
                  <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <div>
                      <h3 className="font-medium text-red-900 mb-1">
                        Bạn có chắc chắn muốn xóa vai trò này?
                      </h3>
                      <p className="text-sm text-red-800">
                        Hành động này không thể hoàn tác. Vai trò "<strong>{role.name}</strong>" sẽ bị xóa vĩnh viễn khỏi hệ thống.
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Thông tin vai trò:</h4>
                    <ul className="space-y-1 text-sm text-gray-700">
                      <li>• <strong>Tên:</strong> {role.name}</li>
                      <li>• <strong>Mô tả:</strong> {role.description}</li>
                      <li>• <strong>Số người dùng:</strong> {role.userCount}</li>
                      <li>• <strong>Số quyền:</strong> {role.permissions.length}</li>
                    </ul>
                  </div>
                </>
              );
            })()}

            <div className="flex gap-3 justify-end pt-4">
              <Button 
                variant="danger" 
                onClick={handleConfirmDelete}
                disabled={loading}
              >
                {loading ? 'đang xóa...' : 'Xác nhận xóa'}
              </Button>
              <Button 
                variant="secondary" 
                onClick={handleCancelDelete}
                disabled={loading}
              >
                Hủy
              </Button>
            </div>
          </div>
        </Modal>
    </>
  );
};
