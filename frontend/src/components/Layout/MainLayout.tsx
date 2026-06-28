import { ReactNode, useMemo, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Key, LogOut, Menu, Search, User, X } from 'lucide-react';
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
    'group relative interactive-lift flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-300/50',
    isActive
      ? 'bg-blue-50 text-blue-700 shadow-[inset_3px_0_0_#2563eb]'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 active:translate-y-px'
  );

const getInitials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';

const SidebarContent = ({ description, items, user, roleProfile, onLogout, onNavigate }: SidebarProps) => {
  const displayName = user?.fullName || user?.username || 'Người dùng';
  const contact = user?.email || user?.username || '--';
  const initials = getInitials(displayName);

  return (
    <>
      <div className="border-b border-slate-200 px-4 py-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold text-white shadow-sm ring-2 ring-white"
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="min-w-0">
            <p className="font-display truncate text-sm font-bold text-slate-950">{displayName}</p>
            <p className="truncate text-xs text-slate-600">{contact}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="info">{roleProfile.badge}</Badge>
        </div>
        <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      </div>

      <nav className="space-y-0.5 p-3">
        <p className="nav-section-label px-3 pb-2 pt-1">Menu</p>
        {items.map((item, index) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={navLinkClass}
            onClick={onNavigate}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <item.icon
              size={18}
              className="shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span className="truncate">{item.label}</span>
          </NavLink>
        ))}

        <div className="mt-4 border-t border-slate-200 pt-4">
          <p className="nav-section-label px-3 pb-2">Tài khoản</p>
          <NavLink to="/profile" className={navLinkClass} onClick={onNavigate}>
            <User size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span>Thông tin cá nhân</span>
          </NavLink>
          <NavLink to="/change-password" className={navLinkClass} onClick={onNavigate}>
            <Key size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
            <span>Đổi mật khẩu</span>
          </NavLink>
          <button
            type="button"
            onClick={() => { onNavigate?.(); onLogout(); }}
            className="group interactive-lift flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-rose-700 hover:bg-rose-50 hover:text-rose-800 active:translate-y-px focus:outline-none focus:ring-2 focus:ring-rose-300/40"
          >
            <LogOut size={18} className="shrink-0 transition-transform duration-200 group-hover:scale-110" />
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

  const currentPageTitle = useMemo(() => {
    const current = visibleMenuItems
      .slice()
      .sort((a, b) => b.path.length - a.path.length)
      .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
    return current?.label ?? 'Dashboard';
  }, [location.pathname, visibleMenuItems]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell text-slate-900">
      {/* ── Topbar ─────────────────────────────────────────── */}
      <header className="app-topbar fixed inset-x-0 top-0 z-20 border-b border-slate-200/80 backdrop-blur-xl">
        <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="interactive-lift inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:translate-y-px lg:hidden"
              aria-label="Mở menu"
            >
              <Menu size={20} />
            </button>

            {/* Desktop toggle */}
            <button
              type="button"
              onClick={() => setIsDesktopSidebarOpen((open) => !open)}
              className="interactive-lift hidden h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 active:translate-y-px lg:inline-flex"
              aria-label={isDesktopSidebarOpen ? 'Thu gọn menu' : 'Mở menu'}
            >
              <span className={cn('transition-transform duration-300', isDesktopSidebarOpen ? 'rotate-0' : 'rotate-180')}>
                {isDesktopSidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </span>
            </button>

            <Link to="/" className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-[-0.01em] text-slate-950 sm:text-lg">
                Hệ thống quản lý nhân sự
              </h1>
              <p className="hidden text-xs text-slate-500 sm:block">Workforce management</p>
            </Link>
          </div>

          {/* Search bar */}
          <div className="hidden min-w-0 flex-1 items-center justify-center lg:flex">
            <div className="flex w-full max-w-xl items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 transition-[border-color,background-color,box-shadow] duration-200 hover:border-blue-200 hover:bg-white hover:shadow-sm focus-within:border-blue-300 focus-within:bg-white focus-within:shadow-sm">
              <Search size={17} className="shrink-0 text-slate-400" />
              <span className="truncate">Tìm nhân viên, dự án, task hoặc phòng ban...</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden min-w-0 flex-col text-right sm:flex">
              <span className="truncate text-sm font-bold text-slate-950">{currentPageTitle}</span>
              <span className="truncate text-xs text-slate-500">{roleProfile.label}</span>
            </div>
            <button
              type="button"
              className="interactive-lift hidden h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 sm:inline-flex"
              aria-label="Thông báo"
            >
              <Bell size={18} />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 ring-1 ring-blue-100 transition-[box-shadow] duration-200 hover:ring-blue-300">
              <User size={18} />
            </div>
          </div>
        </div>
      </header>

      {/* ── Mobile sidebar overlay ─────────────────────────── */}
      {/* backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden',
          'transition-opacity duration-300',
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
        aria-hidden="true"
      />
      {/* panel */}
      <aside
        className={cn(
          'app-sidebar fixed bottom-0 left-0 top-0 z-50 flex w-80 max-w-[85vw] flex-col overflow-y-auto shadow-2xl lg:hidden',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <span className="font-semibold text-slate-950">HR Core</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-slate-700 hover:bg-slate-100 hover:text-slate-950"
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

      {/* ── Desktop sidebar ────────────────────────────────── */}
      <aside
        className={cn(
          'app-sidebar fixed bottom-0 left-0 top-16 z-10 hidden w-64 overflow-y-auto lg:block',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          isDesktopSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <SidebarContent
          description={roleProfile.description}
          items={visibleMenuItems}
          user={user}
          roleProfile={roleProfile}
          onLogout={handleLogout}
        />
      </aside>

      {/* ── Main content ───────────────────────────────────── */}
      <div className="flex overflow-x-hidden pt-16">
        <main
          className={cn(
            'relative z-0 min-w-0 flex-1 bg-transparent p-4 sm:p-6 lg:p-7',
            'will-change-transform transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
            isDesktopSidebarOpen && 'lg:translate-x-64'
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
