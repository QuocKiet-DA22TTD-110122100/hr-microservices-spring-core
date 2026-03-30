import { useState } from 'react';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Table } from '@/components/UI/Table';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { Plus, Search, Lock, Unlock } from 'lucide-react';

interface User extends Record<string, unknown> {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roles: string[];
  status: 'ACTIVE' | 'LOCKED';
  lastLogin: string;
}

export const UserManagementPage = () => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [userList, setUserList] = useState<User[]>([]);

  // Dữ liệu mẫu
  useState(() => {
    setUserList([
      {
        id: '1',
        username: 'admin',
        email: 'admin@company.com',
        fullName: 'Quản trị viên',
        roles: ['ADMIN', 'USER'],
        status: 'ACTIVE',
        lastLogin: '2024-03-09 10:30',
      },
      {
        id: '2',
        username: 'user1',
        email: 'user1@company.com',
        fullName: 'Nguyễn Văn A',
        roles: ['USER'],
        status: 'ACTIVE',
        lastLogin: '2024-03-09 09:15',
      },
      {
        id: '3',
        username: 'user2',
        email: 'user2@company.com',
        fullName: 'Trần Thị B',
        roles: ['USER', 'HR_MANAGER'],
        status: 'LOCKED',
        lastLogin: '2024-03-08 14:20',
      },
    ]);
  });

  const handleToggleLock = (userId: string) => {
    setUserList(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, status: user.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE' as 'ACTIVE' | 'LOCKED' }
        : user
    ));
  };

  const columns: Array<{
    key: string;
    title: string;
    render?: (value: User[keyof User], record: User) => React.ReactNode;
  }> = [
    { key: 'username', title: 'Tên đăng nhập' },
    { key: 'fullName', title: 'Họ và tên' },
    { key: 'email', title: 'Email' },
    {
      key: 'roles',
      title: 'Vai trò',
      render: (value: User[keyof User]) => (
        <div className="flex flex-wrap gap-1">
          {(value as string[]).map((role) => (
            <span
              key={role}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium"
            >
              {role}
            </span>
          ))}
        </div>
      ),
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (value: User[keyof User]) => (
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            value === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {value === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
        </span>
      ),
    },
    { key: 'lastLogin', title: 'Đăng nhập lần cuối' },
    {
      key: 'id',
      title: 'Thao tác',
      render: (_value: User[keyof User], record: User) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleLock(record.id);
            }}
            className="p-1 hover:bg-gray-100 rounded"
            title={record.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa'}
          >
            {record.status === 'ACTIVE' ? (
              <Lock size={16} className="text-red-600" />
            ) : (
              <Unlock size={16} className="text-green-600" />
            )}
          </button>
        </div>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Tài khoản</h1>
            <p className="text-gray-600 text-sm mt-1">Quản lý người dùng và phân quyền</p>
          </div>
          <Button onClick={() => alert('Chức năng thêm tài khoản đang được phát triển')}>
            <Plus size={18} className="mr-2" />
            Thêm tài khoản
          </Button>
        </div>

        <div className="bg-white p-4 rounded-lg border shadow-sm">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Tìm kiếm theo tên, email, username..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
            </div>
            <Button>
              <Search size={18} className="mr-2" />
              Tìm kiếm
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table columns={columns} data={userList} loading={false} />
        </div>
      </div>
    </MainLayout>
  );
};
