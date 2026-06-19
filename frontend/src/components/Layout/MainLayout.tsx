import { ReactNode, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Key, LogOut, Menu, User, X } from 'lucide-react';
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
import { User as AuthUser } from '@/types/auth';
import { cn } from '@/utils/cn';

interface MainLayoutProps {
  children: ReactNode;
}

interface SidebarProps {
  description: string;
  items: NavigationItem[];
  user: AuthUser | null;
  roleProfile: (typeof roleProfiles)[ReturnType<typeof resolveWorkspaceRole>];
  onLogout: () => void;
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
    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-cyan-300/40',
    isActive
      ? 'bg-cyan-300 text-slate-950 shadow-[0_8px_18px_rgba(8,145,178,0.18)]'
      : 'text-slate-300 hover:bg-white/8 hover:text-white active:translate-y-px'
  );

const SidebarContent = ({ description, items, user, roleProfile, onLogout, onNavigate }: SidebarProps) => {
  const displayName = user?.fullName || user?.username || 'Người dùng';
  const contact = user?.email || user?.username || '--';

  return (
    <>
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-100 text-cyan-900 ring-1 ring-cyan-200">
            <User size={24} strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">{displayName}</p>
            <p className="truncate text-xs text-slate-400">{contact}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="info">{roleProfile.badge}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-300">{description}</p>
      </div>

      <nav className="space-y-1 p-3">
        {items.map((item) => (
          <NavLink key={item.path} to={item.path} className={navLinkClass} onClick={onNavigate}>
            <item.icon size={18} className="shrink-0" />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-4 border-t border-white/10 pt-4">
          <NavLink to="/profile" className={navLinkClass} onClick={onNavigate}>
            <User size={18} className="shrink-0" />
            <span>Thông tin cá nhân</span>
          </NavLink>
          <NavLink to="/change-password" className={navLinkClass} onClick={onNavigate}>
            <Key size={18} className="shrink-0" />
            <span>Đổi mật khẩu</span>
          </NavLink>
          <button
            type="button"
            onClick={() => {
              onNavigate?.();
              onLogout();
            }}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-rose-200 transition duration-150 hover:bg-rose-500/10 hover:text-rose-100 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-rose-300/30"
          >
            <LogOut size={18} className="shrink-0" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </nav>
    </>
  );
};

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const { can } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();

  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];

  const visibleMenuItems = useMemo(
    () => workspaceNavigation.filter((item) => canShowNavItem(item, workspaceRole, can)),
    [can, workspaceRole]
  );

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed inset-x-0 top-0 z-20 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_2px_rgba(15,23,42,0.05)] backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 active:translate-y-px lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>

            <button
              type="button"
              onClick={() => setIsDesktopSidebarOpen((open) => !open)}
              className="hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-100 active:translate-y-px lg:inline-flex"
              aria-label={isDesktopSidebarOpen ? 'Thu gọn menu' : 'Mở menu'}
            >
              {isDesktopSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <Link to="/" className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-[-0.01em] text-slate-950 sm:text-lg">
                Hệ thống quản lý nhân sự
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">{roleProfile.label}</p>
            </Link>
          </div>

          <div className="hidden rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold text-slate-700 sm:block">
            {roleProfile.label}
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
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
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
              user={user}
              roleProfile={roleProfile}
              onLogout={handleLogout}
              onNavigate={() => setIsMobileSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      <div className="flex pt-16">
        {isDesktopSidebarOpen && (
          <aside className="fixed bottom-0 left-0 top-16 z-10 hidden w-64 overflow-y-auto border-r border-white/10 bg-[linear-gradient(180deg,#020617_0%,#0f172a_100%)] shadow-[8px_0_24px_rgba(15,23,42,0.14)] lg:block">
            <SidebarContent
              description={roleProfile.description}
              items={visibleMenuItems}
              user={user}
              roleProfile={roleProfile}
              onLogout={handleLogout}
            />
          </aside>
        )}

        <main
          className={cn(
            'relative z-0 min-w-0 flex-1 bg-transparent p-4 transition-[margin] duration-200 sm:p-6',
            isDesktopSidebarOpen && 'lg:ml-64'
          )}
        >
          <div key={location.pathname} className="page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
