import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Building2, CheckCircle2, LucideIcon, ShieldCheck, Sparkles, UsersRound } from 'lucide-react';

interface AuthShellProps {
  title: string;
  description: string;
  icon: LucideIcon;
  children: ReactNode;
  footer?: ReactNode;
  eyebrow?: string;
}

const authHighlights = [
  {
    title: 'Vai trò rõ ràng',
    description: 'Dashboard, menu và quyền truy cập thay đổi theo USER, EMPLOYEE, MANAGER, HR và ADMIN.',
    icon: UsersRound,
  },
  {
    title: 'Phiên đăng nhập an toàn',
    description: 'JWT được kiểm tra trước khi mở workspace, tránh truy cập sai quyền.',
    icon: ShieldCheck,
  },
  {
    title: 'Sẵn sàng nối API',
    description: 'Giao diện tách lớp theo module để dễ nối project, task, nhân sự và audit.',
    icon: Sparkles,
  },
];

export const AuthShell = ({ title, description, icon: Icon, children, footer, eyebrow = 'HR Core Portal' }: AuthShellProps) => (
  <div className="min-h-screen text-slate-900">
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_500px]">
      <section className="relative hidden overflow-hidden bg-[#07111f] px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-[0.13]">
          <div className="h-full w-full bg-[linear-gradient(to_right,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
        </div>
        <div className="absolute left-[-8rem] top-[-8rem] h-80 w-80 rounded-full bg-cyan-500/12 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-cyan-950/60 to-transparent" />

        <div className="relative">
          <Link to="/login" className="inline-flex items-center gap-3 text-lg font-semibold">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-300 text-slate-950 shadow-[0_12px_30px_rgba(34,211,238,0.2)]">
              <Building2 size={22} />
            </span>
            HR Core
          </Link>
        </div>

        <div className="relative max-w-2xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-cyan-200/20 bg-cyan-200/10 px-3 py-1.5 text-sm font-semibold text-cyan-50">
            <ShieldCheck size={16} />
            Quản trị nhân sự theo quyền truy cập
          </div>
          <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-[-0.025em] text-balance">
            Một cổng làm việc gọn cho nhân viên, quản lý và đội ngũ nhân sự.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
            Tập trung tài khoản, phân quyền, dự án, task và hồ sơ nhân sự trong một giao diện thống nhất.
          </p>

          <div className="mt-8 grid gap-3">
            {authHighlights.map((item) => (
              <div key={item.title} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.045] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition duration-150 hover:bg-white/[0.07]">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-cyan-200">
                  <item.icon size={20} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-slate-400">
          <CheckCircle2 size={18} className="text-emerald-300" />
          Spring Boot microservices + React role workspace
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:bg-white/70">
        <div className="w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Link to="/login" className="inline-flex items-center gap-3 text-lg font-semibold text-slate-900">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-700 text-white">
                <Building2 size={22} />
              </span>
              HR Core
            </Link>
            <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
              Secure
            </span>
          </div>

          <div className="surface-panel rounded-xl">
            <div className="border-b border-slate-200 px-6 py-6 sm:px-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-50 text-cyan-800 ring-1 ring-cyan-100">
                  <Icon size={24} />
                </div>
                <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">{eyebrow}</span>
              </div>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 text-pretty">{description}</p>
            </div>

            <div className="px-6 py-6 sm:px-8">
              {children}
              {footer && <div className="mt-6 border-t border-slate-200 pt-5">{footer}</div>}
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
