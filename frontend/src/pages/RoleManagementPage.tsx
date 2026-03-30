import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';

interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
}

export const RoleManagementPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roleList, setRoleList] = useState<Role[]>([]);

  // Dữ liệu mẫu
  useState(() => {
    setRoleList([
      {
        id: '1',
        name: 'ADMIN',
        description: 'Quản trị viên hệ thống',
        permissions: ['ALL'],
        userCount: 2,
      },
      {
        id: '2',
        name: 'HR_MANAGER',
        description: 'Quản lý nhân sự',
        permissions: ['READ_EMPLOYEE', 'WRITE_EMPLOYEE', 'READ_DEPARTMENT', 'WRITE_DEPARTMENT'],
        userCount: 5,
      },
      {
        id: '3',
        name: 'USER',
        description: 'Người dùng thông thường',
        permissions: ['READ_EMPLOYEE', 'READ_DEPARTMENT'],
        userCount: 50,
      },
    ]);
  });

  const handleDeleteRole = (roleId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa vai trò này?')) {
      setRoleList(prev => prev.filter(role => role.id !== roleId));
    }
  };

  const handleEditRole = (roleId: string) => {
    alert(`Chức năng chỉnh sửa vai trò ${roleId} đang được phát triển`);
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Vai trò</h1>
            <p className="text-gray-600 text-sm mt-1">Quản lý vai trò và quyền hạn trong hệ thống</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={18} className="mr-2" />
            Thêm vai trò
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {roleList.map((role) => (
            <div key={role.id} className="bg-white rounded-lg border shadow-sm p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Shield className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{role.name}</h3>
                    <p className="text-sm text-gray-600">{role.userCount} người dùng</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEditRole(role.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Chỉnh sửa"
                  >
                    <Edit size={16} className="text-gray-600" />
                  </button>
                  <button 
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Xóa"
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{role.description}</p>

              <div>
                <p className="text-xs font-medium text-gray-700 mb-2">Quyền hạn:</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.map((permission) => (
                    <span
                      key={permission}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal thêm vai trò */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Thêm vai trò mới">
          <form className="space-y-4">
            <Input label="Tên vai trò" placeholder="Nhập tên vai trò" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mô tả
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Nhập mô tả vai trò"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quyền hạn
              </label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {['READ_EMPLOYEE', 'WRITE_EMPLOYEE', 'DELETE_EMPLOYEE', 'READ_DEPARTMENT', 'WRITE_DEPARTMENT', 'DELETE_DEPARTMENT', 'READ_USER', 'WRITE_USER', 'DELETE_USER'].map((permission) => (
                  <label key={permission} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">{permission}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit">Thêm vai trò</Button>
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                Hủy
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </MainLayout>
  );
};
