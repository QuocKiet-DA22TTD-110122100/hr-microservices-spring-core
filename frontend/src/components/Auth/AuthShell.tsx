import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, LucideIcon, ShieldCheck } from 'lucide-react';

interface AuthShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
}

const authHighlights = [
  'Dashboard tự đổi theo vai trò',
  'Token được xác thực trước khi vào hệ thống',
  'Sidebar chỉ hiển chức năng được cấp quyền',
];

export const AuthShell = ({ title, description, icon: Icon, children, footer }: AuthShellProps) => (
  <div className="min-h-screen bg-slate-950 text-slate-900">
    <div className="grid min-h-screen lg:grid-cols-[1fr_480px]">
      <section className="hidden bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <Link to="/login" className="inline-flex items-center gap-3 text-lg font-semibold">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
            <Building2 size={22} />
          </span>
          HR Core
        </Link>

        <div className="max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-cyan-100">
            <ShieldCheck size={16} />
            Truy cập bảo mật theo vai trò
          </div>
          <h1 className="text-4xl font-semibold leading-tight">
            Một cổng truy cập cho nhân viên, quản lý, trưởng phòng, nhân sự và quản trị.
          </h1>
          <div className="mt-8 grid gap-3 text-sm text-slate-200">
            {authHighlights.map((item) => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle2 size={18} className="text-cyan-300" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-slate-400">Spring Boot microservices + React portal</p>
      </section>

      <main className="flex items-center justify-center bg-slate-50 px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Link to="/login" className="inline-flex items-center gap-3 text-lg font-semibold text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500 text-slate-950">
                <Building2 size={22} />
              </span>
              HR Core
            </Link>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                <Icon size={24} />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
            </div>

            {children}

            {footer && <div className="mt-6">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  </div>
);
