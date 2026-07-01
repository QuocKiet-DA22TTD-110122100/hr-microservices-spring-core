import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Edit2, Plus, Search, Trash2, Users, RefreshCw, AlertCircle } from 'lucide-react';
import { departmentApi } from '@/api/department.api';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { ConfirmModal } from '@/components/UI/ConfirmModal';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useUIStore } from '@/store/uiStore';
import { Department } from '@/types/department';
import { getApiErrorMessage } from '@/utils/error';
import { cn } from '@/utils/cn';

// Color palette for department avatars (cycle by index)
const DEPT_COLORS = [
  'bg-blue-100 text-blue-700 ring-blue-200',
  'bg-violet-100 text-violet-700 ring-violet-200',
  'bg-emerald-100 text-emerald-700 ring-emerald-200',
  'bg-amber-100 text-amber-700 ring-amber-200',
  'bg-rose-100 text-rose-700 ring-rose-200',
  'bg-cyan-100 text-cyan-700 ring-cyan-200',
  'bg-indigo-100 text-indigo-700 ring-indigo-200',
  'bg-teal-100 text-teal-700 ring-teal-200',
];

function getDeptColor(index: number) {
  return DEPT_COLORS[index % DEPT_COLORS.length];
}

function DeptAvatar({ code, name, index }: { code?: string; name: string; index: number }) {
  const label = code?.charAt(0) ?? name.charAt(0);
  return (
    <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ring-1', getDeptColor(index))}>
      {label.toUpperCase()}
    </span>
  );
}

export const DepartmentListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const confirmTarget = useMemo(
    () => departments.find((d) => d.id === confirmTargetId) ?? null,
    [departments, confirmTargetId]
  );

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi tải danh sách phòng ban.');
      setError(msg);
      addNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const handleDeleteConfirm = useCallback(async () => {
    if (confirmTargetId === null) return;
    setDeletingId(confirmTargetId);
    try {
      await departmentApi.delete(confirmTargetId);
      setDepartments((cur) => cur.filter((d) => d.id !== confirmTargetId));
      setConfirmTargetId(null);
      addNotification({ type: 'success', message: 'Xóa phòng ban thành công.' });
    } catch (err: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi xóa phòng ban.') });
    } finally {
      setDeletingId(null);
    }
  }, [confirmTargetId, addNotification]);

  const filteredDepartments = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return departments;
    return departments.filter((d) =>
      [d.code, d.name, d.organizationUnitName].filter(Boolean).some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [departments, searchKeyword]);

  const totalEmployees = useMemo(() => departments.reduce((s, d) => s + (d.employeeCount ?? 0), 0), [departments]);
  const maxEmployees   = useMemo(() => Math.max(...departments.map((d) => d.employeeCount ?? 0), 1), [departments]);

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-800 via-indigo-900 to-slate-950 px-6 py-7 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-indigo-400/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-violet-400/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/20 ring-1 ring-indigo-300/30">
                <Building2 size={22} className="text-indigo-200" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Quản lý phòng ban</h1>
                <p className="mt-0.5 text-sm text-indigo-300">Theo dõi đơn vị tổ chức và phân bổ nhân viên</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Phòng ban',   value: departments.length, icon: Building2, color: 'text-indigo-300' },
                { label: 'Nhân viên',   value: totalEmployees,     icon: Users,     color: 'text-emerald-300' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
                  <Icon size={16} className={color} />
                  <div>
                    <div className="text-xs text-indigo-300/80">{label}</div>
                    <div className="text-base font-bold leading-none text-white mt-0.5">{value}</div>
                  </div>
                </div>
              ))}

              <Button onClick={() => navigate('/departments/add')} size="sm" className="gap-1.5">
                <Plus size={16} />
                Thêm phòng ban
              </Button>
            </div>
          </div>
        </div>

        {/* ── Search + refresh bar ──────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo mã, tên phòng ban hoặc tổ chức..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchDepartments}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="flex-1 text-sm font-medium text-rose-800">{error}</p>
            <button type="button" onClick={fetchDepartments} className="text-xs font-semibold text-rose-600 underline-offset-2 hover:underline">
              Thử lại
            </button>
          </div>
        )}

        {/* ── Department table ──────────────────────────────────────────── */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={22} className="animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    {['Phòng ban', 'Mã', 'Tổ chức', 'Nhân viên', ''].map((h) => (
                      <th
                        key={h}
                        className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDepartments.map((dept, idx) => {
                    const empCount = dept.employeeCount ?? 0;
                    const pct = Math.round((empCount / maxEmployees) * 100);

                    return (
                      <tr
                        key={dept.id}
                        onClick={() => navigate(`/departments/edit/${dept.id}`)}
                        className={cn(
                          'group animate-fade-up cursor-pointer transition-colors duration-100 hover:bg-indigo-50/40',
                          idx % 2 === 1 && 'bg-slate-50/30'
                        )}
                        style={{ animationDelay: `${Math.min(idx * 40, 400)}ms` }}
                      >
                        {/* Name + avatar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <DeptAvatar code={dept.code} name={dept.name} index={idx} />
                            <div>
                              <div className="font-semibold text-slate-900">{dept.name}</div>
                              {dept.organizationUnitName && (
                                <div className="text-xs text-slate-400 mt-0.5">{dept.organizationUnitName}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-5 py-4">
                          {dept.code ? (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                              {dept.code}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>

                        {/* Org unit */}
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-600">{dept.organizationUnitName || '—'}</span>
                        </td>

                        {/* Employee count + bar */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200">
                              <Users size={11} />
                              {empCount}
                            </span>
                            <div className="hidden w-20 sm:block">
                              <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/departments/edit/${dept.id}`); }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-600"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setConfirmTargetId(dept.id); }}
                              disabled={deletingId === dept.id}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 text-rose-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                              title="Xóa"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredDepartments.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Building2 size={32} strokeWidth={1.5} />
                          <p className="text-sm">Không tìm thấy phòng ban nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredDepartments.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 text-right text-xs text-slate-400">
                  {filteredDepartments.length} phòng ban · {totalEmployees} nhân viên
                </div>
              )}
            </>
          )}
        </Card>
      </div>

      <ConfirmModal
        isOpen={confirmTarget !== null}
        title="Xóa phòng ban"
        message={`Bạn có chắc muốn xóa phòng ban "${confirmTarget?.name}"? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa phòng ban"
        variant="danger"
        isLoading={deletingId !== null}
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setConfirmTargetId(null)}
      />
    </MainLayout>
  );
};
