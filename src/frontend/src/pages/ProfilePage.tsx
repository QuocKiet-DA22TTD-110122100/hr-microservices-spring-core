import { Link } from 'react-router-dom';
import { Calendar, Key, Mail, Shield, User, UserRoundCheck } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { MainLayout } from '@/components/Layout/MainLayout';
import { resolveWorkspaceRole, roleProfiles } from '@/config/roleExperience';
import { useAuthStore } from '@/store/authStore';
import { PermissionDescriptor } from '@/types/auth';
import { formatDate } from '@/utils/format';

const permissionLabels: Record<string, string> = {
  'hr.read': 'Đọc thông tin nhân sự',
  'hr.write': 'Ghi thông tin nhân sự',
  'employee:view': 'Xem nhân viên',
  'employee:create': 'Tạo nhân viên',
  'employee:update': 'Cập nhật nhân viên',
  'project:view': 'Xem dự án',
  'task:view': 'Xem công việc',
  'user:view': 'Xem tài khoản',
  'role:view': 'Xem vai trò',
};

const toPermissionDescriptor = (permission: string): PermissionDescriptor => ({
  key: permission,
  name: permissionLabels[permission] ?? permission,
  type: permission.includes(':') || permission.includes('.') ? 'system' : 'custom',
});

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];

  const roles = user?.roles || [];
  const permissions = (user?.permissions || []).map(toPermissionDescriptor);

  const profileRows = [
    { icon: User, label: 'Tên đăng nhập', value: user?.username || '--' },
    { icon: Mail, label: 'Email', value: user?.email || '--' },
    { icon: Shield, label: 'Không gian', value: roleProfile.label },
    {
      icon: Calendar,
      label: 'Hạn mật khẩu',
      value: user?.passwordExpiresAt ? formatDate(user.passwordExpiresAt, 'dd/MM/yyyy') : '--',
    },
  ];

  return (
    <MainLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="overflow-hidden rounded-xl bg-slate-950 text-white shadow-[0_18px_40px_rgba(15,23,42,0.18)]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20">
                  <UserRoundCheck size={32} />
                </div>
                <div className="min-w-0">
                  <p className="font-display text-sm font-bold uppercase text-blue-100">{roleProfile.badge}</p>
                  <h1 className="mt-1 truncate font-display text-2xl font-bold tracking-[-0.01em]">
                    {user?.fullName || user?.username || 'Người dùng'}
                  </h1>
                  <p className="mt-2 max-w-[68ch] text-sm leading-6 text-slate-200">{roleProfile.description}</p>
                </div>
              </div>

              <Link
                to="/change-password"
                className="interactive-lift inline-flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-950 shadow-sm ring-1 ring-white/20 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:ring-offset-slate-950"
              >
                <Key size={16} />
                Đổi mật khẩu
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <section className="space-y-4">
            <div>
              <h2 className="font-display text-xl font-bold tracking-[-0.01em] text-slate-950">Thông tin tài khoản</h2>
              <p className="mt-2 max-w-[70ch] text-sm leading-6 text-slate-700">
                Thông tin nhận diện, phạm vi làm việc và trạng thái bảo mật của tài khoản hiện tại.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {profileRows.map((row) => (
                <div key={row.label} className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-900">
                    <row.icon size={19} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-700">{row.label}</p>
                    <p className="mt-1 break-words font-semibold text-slate-950">{row.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="space-y-5">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-lg font-bold text-slate-950">Vai trò</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <Badge key={role} variant="info" className="bg-blue-100 text-blue-950">
                      {role}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="muted" className="bg-slate-200 text-slate-900">Chưa có vai trò</Badge>
                )}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-display text-lg font-bold text-slate-950">Quyền trực tiếp</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {permissions.length > 0
                  ? `${permissions.length} quyền được trả về từ token hoặc /api/v1/auth/profile.`
                  : 'Không có quyền trực tiếp trong token.'}
              </p>
              {permissions.length > 0 && (
                <div className="mt-4 flex max-h-56 flex-wrap gap-2 overflow-y-auto pr-1">
                  {permissions.map((permission) => (
                    <Badge
                      key={permission.key}
                      variant={permission.type === 'system' ? 'info' : 'muted'}
                      className={permission.type === 'system' ? 'bg-blue-100 text-blue-950' : 'bg-slate-200 text-slate-900'}
                      title={permission.key}
                    >
                      {permission.name}
                    </Badge>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </section>
      </div>
    </MainLayout>
  );
};
