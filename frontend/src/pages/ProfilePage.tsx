import { Link } from 'react-router-dom';
import { Calendar, Key, Mail, Shield, User, UserRoundCheck } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { resolveWorkspaceRole, roleProfiles } from '@/config/roleExperience';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/format';

export const ProfilePage = () => {
  const { user } = useAuthStore();
  const workspaceRole = resolveWorkspaceRole(user?.roles);
  const roleProfile = roleProfiles[workspaceRole];

  const roles = user?.roles || [];
  const permissions = user?.permissions || [];

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
        <section className={`overflow-hidden rounded-lg bg-gradient-to-r ${roleProfile.toneClass} text-white shadow-sm`}>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                  <UserRoundCheck size={32} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold uppercase text-cyan-100">{roleProfile.badge}</p>
                  <h1 className="truncate text-2xl font-semibold">{user?.fullName || user?.username || 'Người dùng'}</h1>
                  <p className="mt-1 text-sm text-white/80">{roleProfile.description}</p>
                </div>
              </div>

              <Link
                to="/change-password"
                className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-cyan-50"
              >
                <Key size={16} />
                Đổi mật khẩu
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {profileRows.map((row) => (
                  <div key={row.label} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white text-cyan-700 shadow-sm">
                        <row.icon size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">{row.label}</p>
                        <p className="mt-1 break-words font-semibold text-slate-900">{row.value}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vai trò</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <Badge key={role} variant="info">
                        {role}
                      </Badge>
                    ))
                  ) : (
                    <Badge variant="muted">Chưa có vai trò</Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quyền trực tiếp</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  {permissions.length > 0
                    ? `${permissions.length} quyền được trả về từ token.`
                    : 'Không có quyền trực tiếp trong token.'}
                </p>
                {permissions.length > 0 && (
                  <div className="mt-4 max-h-48 space-y-2 overflow-y-auto pr-1">
                    {permissions.map((permission) => (
                      <div key={permission} className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                        {permission}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </MainLayout>
  );
};
