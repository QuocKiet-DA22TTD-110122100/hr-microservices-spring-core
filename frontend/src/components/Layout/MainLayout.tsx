import { ReactNode, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Menu, X, LogOut, User, Key, Home, Users, Building2 } from 'lucide-react';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: Home, label: 'Trang chủ', path: '/' },
    { icon: Users, label: 'Nhân viên', path: '/employees' },
    { icon: Building2, label: 'Phòng ban', path: '/departments' },
    { icon: User, label: 'Tài khoản', path: '/users' },
    { icon: Key, label: 'Vai trò', path: '/roles' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-10 border-b">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isSidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Hệ thống Quản lý Nhân sự</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-md border">
              <User className="text-gray-500" size={16} />
              <span className="text-sm text-gray-700">{user?.fullName}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md border transition-colors"
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="flex pt-14">
        {/* Sidebar - Dark Blue/Slate Background */}
        {isSidebarOpen && (
          <aside className="w-56 bg-slate-800 fixed left-0 top-14 bottom-0 overflow-y-auto shadow-lg">
            <nav className="p-3 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-slate-700 rounded-lg transition-all text-sm group"
                >
                  <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}

              <div className="pt-3 mt-3 border-t border-slate-700">
                <Link
                  to="/profile"
                  className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-slate-700 rounded-lg transition-all text-sm group"
                >
                  <User size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Thông tin cá nhân</span>
                </Link>
                <Link
                  to="/change-password"
                  className="flex items-center gap-3 px-3 py-2.5 text-white hover:bg-slate-700 rounded-lg transition-all text-sm group"
                >
                  <Key size={18} className="group-hover:scale-110 transition-transform" />
                  <span className="font-medium">Đổi mật khẩu</span>
                </Link>
              </div>
            </nav>
          </aside>
        )}

        {/* Main Content - White Background */}
        <main className={`flex-1 p-6 transition-all ${isSidebarOpen ? 'ml-56' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};
