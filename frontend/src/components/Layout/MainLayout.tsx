import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ChevronDown, Key, LogOut, Menu, User, X } from 'lucide-react';
import {
  NavigationItem,
  resolveWorkspaceRole,
  roleProfiles,
  workspaceNavigation,
} from '@/config/roleExperience';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/utils/cn';

interface MainLayoutProps {
  children: ReactNode;
}

interface SidebarProps {
  description: string;
  items: NavigationItem[];
  onNavigate?: () => void;
}

const canShowNavItem = (
  item: NavigationItem,
  workspaceRole: ReturnType<typeof resolveWorkspaceRole>,
  can: (permission: string) => boolean
) => {
  const roleAllowed = !item.roles || item.roles.includes(workspaceRole);
  const permissionAllowed = !item.permission || can(item.permission);

  return roleAllowed && permissionAllowed;
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-cyan-400 text-slate-950 shadow-sm' : 'text-slate-200 hover:bg-slate-800 hover:text-white'
  );

const SidebarContent = ({ description, items, onNavigate }: SidebarProps) => (
  <>
    <div className="border-b border-slate-800 px-4 py-4">
      <p className="text-xs font-semibold uppercase text-cyan-300">Không gian làm việc</p>
      <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
    </div>

    <nav className="space-y-1 p-3">
      {items.map((item) => (
        <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={onNavigate}>
          <item.icon size={18} />
          <span>{item.label}</span>
        </NavLink>
      ))}

      <div className="mt-4 border-t border-slate-800 pt-4">
        <NavLink to="/profile" className={navLinkClass} onClick={onNavigate}>
          <User size={18} />
          <span>Thông tin cá nhân</span>
        </NavLink>
        <NavLink to="/change-password" className={navLinkClass} onClick={onNavigate}>
          <Key size={18} />
          <span>Đổi mật khẩu</span>
        </NavLink>
      </div>
    </nav>
  </>
);

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const { user, logout } = useAuthStore();
  const { can } = usePermissions();
  const navigate = useNavigate();

  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];

  const visibleMenuItems = useMemo(
    () => workspaceNavigation.filter((item) => canShowNavItem(item, workspaceRole, can)),
    [can, workspaceRole]
  );

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    await logout();
    setIsAccountMenuOpen(false);
    navigate('/login');
  };

  const displayName = user?.fullName || user?.username || 'Người dùng';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>

            <button
              type="button"
              onClick={() => setIsDesktopSidebarOpen((open) => !open)}
              className="hidden h-10 w-10 items-center justify-center rounded-md border border-slate-200 text-slate-700 transition-colors hover:bg-slate-100 lg:inline-flex"
              aria-label={isDesktopSidebarOpen ? 'Thu gọn menu' : 'Mở menu'}
            >
              {isDesktopSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
                Hệ thống quản lý nhân sự
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">{roleProfile.label}</p>
            </Link>
          </div>

          <div ref={accountMenuRef} className="relative flex min-w-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((open) => !open)}
              className="inline-flex h-10 min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 sm:px-3"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                <User size={16} />
              </span>
              <span className="hidden max-w-44 truncate md:inline">{displayName}</span>
              <Badge variant="info" className="hidden lg:inline-flex">
                {roleProfile.badge}
              </Badge>
              <ChevronDown size={16} className="text-slate-400" />
            </button>

            {isAccountMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-12 w-72 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl"
              >
                <div className="border-b border-slate-200 p-4">
                  <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || user?.username || '--'}</p>
                  <div className="mt-3">
                    <Badge variant="info">{roleProfile.badge}</Badge>
                  </div>
                </div>

                <div className="p-2">
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <User size={16} />
                    Thông tin cá nhân
                  </Link>
                  <Link
                    to="/change-password"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    <Key size={16} />
                    Đổi mật khẩu
                  </Link>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut size={16} />
                    Đăng xuất
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 cursor-default bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Đóng menu"
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-80 max-w-[85vw] flex-col overflow-y-auto bg-slate-950 shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
              <span className="font-semibold text-white">HR Core</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-slate-200 hover:bg-slate-800 hover:text-white"
                onClick={() => setIsMobileSidebarOpen(false)}
                aria-label="Đóng menu"
              >
                <X size={20} />
              </Button>
            </div>
            <SidebarContent
              description={roleProfile.description}
              items={visibleMenuItems}
              onNavigate={() => setIsMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex pt-16">
        {isDesktopSidebarOpen && (
          <aside className="fixed bottom-0 left-0 top-16 z-10 hidden w-64 overflow-y-auto border-r border-slate-800 bg-slate-950 shadow-xl lg:block">
            <SidebarContent description={roleProfile.description} items={visibleMenuItems} />
          </aside>
        )}

        <main
          className={cn(
            'min-w-0 flex-1 p-4 transition-[margin] duration-200 sm:p-6',
            isDesktopSidebarOpen && 'lg:ml-64'
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
