import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { employeeApi } from '@/api/employee.api';
import { Employee } from '@/types/employee';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';
import {
  ArrowLeft, Edit, Trash2, Mail, Phone, MapPin,
  Calendar, Briefcase, Building2, DollarSign, Hash, RefreshCw,
} from 'lucide-react';
import { cn } from '@/utils/cn';

const STATUS_META: Record<string, { label: string; variant: 'success' | 'danger' | 'muted' }> = {
  ACTIVE:   { label: 'Đang làm việc', variant: 'success' },
  INACTIVE: { label: 'Nghỉ việc',     variant: 'danger'  },
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
}

function InfoField({ icon: Icon, label, value, accent = 'blue' }: {
  icon: typeof Mail;
  label: string;
  value: string;
  accent?: string;
}) {
  const accentMap: Record<string, string> = {
    blue:    'bg-blue-50 text-blue-600',
    green:   'bg-emerald-50 text-emerald-600',
    purple:  'bg-purple-50 text-purple-600',
    amber:   'bg-amber-50 text-amber-600',
    rose:    'bg-rose-50 text-rose-600',
    cyan:    'bg-cyan-50 text-cyan-600',
    indigo:  'bg-indigo-50 text-indigo-600',
    slate:   'bg-slate-100 text-slate-600',
  };

  return (
    <div className="flex items-start gap-3">
      <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', accentMap[accent] ?? accentMap.blue)}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="mt-0.5 text-sm font-semibold text-slate-800 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-shimmer rounded-lg bg-slate-200', className)} />;
}

function LoadingSkeleton() {
  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="h-48 rounded-2xl animate-shimmer bg-slate-200" />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3 rounded-2xl border border-slate-100 bg-white p-5">
            <SkeletonBlock className="mx-auto h-24 w-24 rounded-full" />
            <SkeletonBlock className="mx-auto h-4 w-32" />
            <SkeletonBlock className="mx-auto h-3 w-20" />
          </div>
          <div className="lg:col-span-2 space-y-5">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-4 rounded-2xl border border-slate-100 bg-white p-5">
                <SkeletonBlock className="h-4 w-40" />
                <div className="grid grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, j) => <SkeletonBlock key={j} className="h-10" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) {
        addNotification({ type: 'error', message: 'Thiếu mã nhân viên.' });
        navigate('/employees');
        return;
      }
      setIsLoading(true);
      try {
        const res = await employeeApi.getById(Number(id));
        setEmployee(res.data);
      } catch (err: unknown) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi tải chi tiết nhân viên.') });
        navigate('/employees');
      } finally {
        setIsLoading(false);
      }
    };
    void fetch();
  }, [id, navigate, addNotification]);

  const handleDelete = async () => {
    if (!id || !employee) return;
    if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa nhân viên "${employee.name}"?`)) return;
    setIsDeleting(true);
    try {
      await employeeApi.delete(Number(id));
      addNotification({ type: 'success', message: 'Xóa nhân viên thành công.' });
      navigate('/employees');
    } catch (err: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi xóa nhân viên.') });
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <LoadingSkeleton />;
  if (!employee) return null;

  const avatarText    = employee.name?.charAt(0)?.toUpperCase() ?? 'N';
  const employeeCode  = typeof employee.employeeCode === 'string' ? employee.employeeCode : `NV-${employee.id}`;
  const email         = typeof employee.email === 'string' ? employee.email : '';
  const phone         = typeof employee.phone === 'string' ? employee.phone : '';
  const dateOfBirth   = typeof employee.dateOfBirth === 'string' ? employee.dateOfBirth : '';
  const address       = typeof employee.address === 'string' ? employee.address : '';
  const hireDate      = typeof employee.hireDate === 'string' ? employee.hireDate : '';
  const salary        = typeof employee.salary === 'number' ? employee.salary : (typeof employee.baseSalary === 'number' ? employee.baseSalary : 0);
  const status        = typeof employee.status === 'string' ? employee.status : 'ACTIVE';
  const statusMeta    = STATUS_META[status] ?? { label: status, variant: 'muted' as const };

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-blue-900 to-slate-900 px-6 py-8 shadow-xl">
          <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-blue-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/4 h-40 w-40 rounded-full bg-indigo-400/10 blur-2xl" />

          {/* Back + actions row */}
          <div className="relative flex items-center justify-between mb-6">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/20 transition hover:bg-white/20"
            >
              <ArrowLeft size={16} />
              Quay lại
            </button>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/employees/edit/${id}`)}>
                <Edit size={14} className="mr-1" />
                Chỉnh sửa
              </Button>
              <Button size="sm" variant="danger" onClick={() => void handleDelete()} isLoading={isDeleting}>
                <Trash2 size={14} className="mr-1" />
                Xóa
              </Button>
            </div>
          </div>

          {/* Profile identity */}
          <div className="relative flex items-center gap-5">
            {/* Large avatar */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 text-3xl font-bold text-white shadow-lg ring-2 ring-white/20">
              {avatarText}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-white">{employee.name}</h1>
                <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              </div>
              <p className="mt-1 text-sm text-blue-200">{employee.position || 'Chưa có chức vụ'}</p>
              {employee.departmentName && (
                <p className="mt-0.5 text-xs text-slate-400">{employee.departmentName}</p>
              )}
              <div className="mt-2 flex items-center gap-1.5">
                <Hash size={12} className="text-slate-400" />
                <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-slate-300">{employeeCode}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Detail grid ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

          {/* Left: quick stats */}
          <div className="space-y-4">
            <Card>
              <CardContent className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700 border-b border-slate-100 pb-2">Tóm tắt</h3>
                {[
                  { label: 'Mã nhân viên',  value: employeeCode,              icon: Hash,      accent: 'slate' },
                  { label: 'Phòng ban',      value: employee.departmentName ?? '', icon: Building2, accent: 'indigo' },
                  { label: 'Chức vụ',        value: employee.position ?? '',      icon: Briefcase, accent: 'blue'   },
                  { label: 'Ngày vào làm',   value: hireDate,                 icon: Calendar,  accent: 'green'  },
                ].map((item) => (
                  <InfoField key={item.label} icon={item.icon} label={item.label} value={item.value} accent={item.accent} />
                ))}
              </CardContent>
            </Card>

            {/* Salary highlight */}
            <Card>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 ring-1 ring-emerald-200">
                    <DollarSign size={18} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Mức lương</p>
                    <p className="text-base font-bold text-emerald-700">{formatCurrency(salary)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: detailed info */}
          <div className="lg:col-span-2 space-y-5">

            {/* Contact info */}
            <Card>
              <CardContent>
                <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold text-slate-700">
                  Thông tin liên lạc
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoField icon={Mail}   label="Email"           value={email}       accent="green"  />
                  <InfoField icon={Phone}  label="Số điện thoại"   value={phone}       accent="purple" />
                  <InfoField icon={Calendar} label="Ngày sinh"     value={dateOfBirth} accent="amber"  />
                  <div className="sm:col-span-2">
                    <InfoField icon={MapPin} label="Địa chỉ"       value={address}     accent="rose"   />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Work info */}
            <Card>
              <CardContent>
                <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-semibold text-slate-700">
                  Thông tin công việc
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <InfoField icon={Briefcase}  label="Chức vụ"      value={employee.position ?? ''} accent="blue"   />
                  <InfoField icon={Building2}  label="Phòng ban"     value={employee.departmentName ?? ''} accent="indigo" />
                  <InfoField icon={Calendar}   label="Ngày vào làm"  value={hireDate}                accent="green"  />
                  <InfoField icon={DollarSign} label="Mức lương"     value={formatCurrency(salary)}  accent="cyan"   />
                  {employee.username && (
                    <InfoField icon={RefreshCw} label="Tài khoản hệ thống" value={employee.username} accent="slate" />
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>

      </div>
    </MainLayout>
  );
};
