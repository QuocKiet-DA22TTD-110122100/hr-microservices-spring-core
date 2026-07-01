import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/UI/Button';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Badge } from '@/components/UI/Badge';
import { Card } from '@/components/UI/Card';
import { MainLayout } from '@/components/Layout/MainLayout';
import {
  Plus, Edit, Trash2, Shield, AlertCircle, Search,
  Users, Lock, CheckCircle2, Minus, ShieldCheck,
  Grid3X3, List, RefreshCw, UserCog,
} from 'lucide-react';
import { roleApi, RoleDefinition, RolePermission } from '@/api/role.api';
import { getApiErrorMessage } from '@/utils/error';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';

// ─── Constants ────────────────────────────────────────────────────────────────

type ViewMode = 'matrix' | 'list';

const MOCK_USER_COUNTS: Record<string, number> = {
  ADMIN: 3, HR_MANAGER: 5, DEPARTMENT_HEAD: 8,
  MANAGER: 12, EMPLOYEE: 67, USER: 124,
};

const SYSTEM_ROLES = ['ADMIN', 'HR_MANAGER', 'DEPARTMENT_HEAD', 'MANAGER', 'EMPLOYEE', 'USER'];

const ROLE_COLORS: Record<string, string> = {
  ADMIN:           'bg-purple-100 text-purple-700 ring-purple-200',
  HR_MANAGER:      'bg-blue-100   text-blue-700   ring-blue-200',
  DEPARTMENT_HEAD: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  MANAGER:         'bg-emerald-100 text-emerald-700 ring-emerald-200',
  EMPLOYEE:        'bg-amber-100  text-amber-700  ring-amber-200',
  USER:            'bg-slate-100  text-slate-600  ring-slate-200',
  PAYROLL:         'bg-rose-100   text-rose-700   ring-rose-200',
};

const GROUP_COLORS: Record<string, string> = {
  'Nhân viên':  'bg-blue-600',
  'Phòng ban':  'bg-indigo-600',
  'Tổ chức':    'bg-violet-600',
  'Dự án':      'bg-emerald-600',
  'Công việc':  'bg-teal-600',
  'Bảng lương': 'bg-rose-600',
  'Vai trò':    'bg-purple-600',
  'Người dùng': 'bg-cyan-600',
};

const permissionGroups: Record<string, { value: string; label: string }[]> = {
  'Nhân viên': [
    { value: 'READ_EMPLOYEE',   label: 'Xem' },
    { value: 'WRITE_EMPLOYEE',  label: 'Sửa' },
    { value: 'DELETE_EMPLOYEE', label: 'Xóa' },
  ],
  'Phòng ban': [
    { value: 'READ_DEPARTMENT',   label: 'Xem' },
    { value: 'WRITE_DEPARTMENT',  label: 'Sửa' },
    { value: 'DELETE_DEPARTMENT', label: 'Xóa' },
  ],
  'Tổ chức': [
    { value: 'READ_ORGANIZATION',   label: 'Xem' },
    { value: 'WRITE_ORGANIZATION',  label: 'Sửa' },
    { value: 'DELETE_ORGANIZATION', label: 'Xóa' },
  ],
  'Dự án': [
    { value: 'READ_PROJECT',   label: 'Xem' },
    { value: 'WRITE_PROJECT',  label: 'Sửa' },
    { value: 'DELETE_PROJECT', label: 'Xóa' },
  ],
  'Công việc': [
    { value: 'READ_TASK',   label: 'Xem' },
    { value: 'WRITE_TASK',  label: 'Sửa' },
    { value: 'DELETE_TASK', label: 'Xóa' },
  ],
  'Bảng lương': [
    { value: 'READ_PAYROLL',  label: 'Xem' },
    { value: 'WRITE_PAYROLL', label: 'Sửa' },
  ],
  'Vai trò': [
    { value: 'READ_ROLE',   label: 'Xem' },
    { value: 'WRITE_ROLE',  label: 'Sửa' },
    { value: 'DELETE_ROLE', label: 'Xóa' },
  ],
  'Người dùng': [
    { value: 'READ_USER',   label: 'Xem' },
    { value: 'WRITE_USER',  label: 'Sửa' },
    { value: 'DELETE_USER', label: 'Xóa' },
  ],
};

const allPermissions = Object.values(permissionGroups).flat().map((p) => p.value);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRoleKey(name: string) {
  return name.toUpperCase().replace(/[\s-]+/g, '_');
}

function getRoleColor(name: string) {
  return ROLE_COLORS[getRoleKey(name)] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
}

function hasPermission(role: RoleDefinition, perm: string): boolean {
  return (
    role.permissions.includes('ALL' as RolePermission) ||
    role.permissions.includes(perm as RolePermission)
  );
}

function permCoverage(role: RoleDefinition): number {
  if (role.permissions.includes('ALL' as RolePermission)) return 100;
  const count = role.permissions.filter((p) => allPermissions.includes(p)).length;
  return Math.round((count / allPermissions.length) * 100);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RoleAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const color = getRoleColor(name);
  const dim = size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';
  return (
    <span className={cn('flex shrink-0 items-center justify-center rounded-full font-bold ring-1', dim, color)}>
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function PermCell({ granted, isAll }: { granted: boolean; isAll: boolean }) {
  if (isAll || granted) {
    return (
      <td className="border-b border-l border-slate-100 py-3 text-center align-middle">
        <CheckCircle2
          size={15}
          className={cn('mx-auto transition-colors', isAll ? 'text-purple-400' : 'text-blue-500')}
          aria-label="Có quyền"
        />
      </td>
    );
  }
  return (
    <td className="border-b border-l border-slate-100 py-3 text-center align-middle">
      <Minus size={14} className="mx-auto text-slate-200" aria-label="Không có quyền" />
    </td>
  );
}

// ─── Permission Matrix (in Add/Edit modals) ────────────────────────────────

function PermissionMatrix({
  selectedPerms,
  onToggle,
  onSelectAll,
  onSelectGroup,
}: {
  selectedPerms: string[];
  onToggle: (perm: string) => void;
  onSelectAll: () => void;
  onSelectGroup: (group: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Select all */}
      <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 p-3 transition hover:bg-cyan-100/60">
        <input
          type="checkbox"
          checked={selectedPerms.length === allPermissions.length}
          onChange={onSelectAll}
          className="rounded border-cyan-300 text-cyan-700 focus:ring-cyan-500"
        />
        <span className="text-sm font-semibold text-cyan-900">
          Chọn tất cả quyền ({selectedPerms.length}/{allPermissions.length})
        </span>
      </label>

      {/* Groups */}
      {Object.entries(permissionGroups).map(([group, perms]) => {
        const groupVals = perms.map((p) => p.value);
        const allSel = groupVals.every((v) => selectedPerms.includes(v));
        const someSel = groupVals.some((v) => selectedPerms.includes(v)) && !allSel;
        const barColor = GROUP_COLORS[group] ?? 'bg-slate-500';

        return (
          <div key={group} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className={cn('h-0.5 w-full', barColor)} />
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={allSel}
                  ref={(el) => { if (el) el.indeterminate = someSel; }}
                  onChange={() => onSelectGroup(group)}
                  className="rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                />
                <span className="text-sm font-semibold text-slate-800">{group}</span>
              </label>
              <span className="rounded bg-white px-2 py-0.5 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                {groupVals.filter((v) => selectedPerms.includes(v)).length}/{groupVals.length}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 p-3">
              {perms.map((perm) => (
                <label
                  key={perm.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-cyan-50/70"
                >
                  <input
                    type="checkbox"
                    checked={selectedPerms.includes(perm.value)}
                    onChange={() => onToggle(perm.value)}
                    className="rounded border-slate-300 text-cyan-700 focus:ring-cyan-500"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-800">{perm.label}</div>
                    <div className="text-[10px] leading-4 text-slate-400">{perm.value}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const RoleManagementPage = () => {
  const [view, setView]                             = useState<ViewMode>('matrix');
  const [roleList, setRoleList]                     = useState<RoleDefinition[]>([]);
  const [loading, setLoading]                       = useState(false);
  const [error, setError]                           = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword]           = useState('');
  const [sortKey, setSortKey]                       = useState<keyof RoleDefinition>('name');
  const [sortDir, setSortDir]                       = useState<'asc' | 'desc'>('asc');

  // Add modal
  const [isAddOpen, setIsAddOpen]                   = useState(false);
  const [newName, setNewName]                       = useState('');
  const [newDesc, setNewDesc]                       = useState('');
  const [newPerms, setNewPerms]                     = useState<string[]>([]);
  const [nameErr, setNameErr]                       = useState('');
  const [descErr, setDescErr]                       = useState('');

  // Edit modal
  const [isEditOpen, setIsEditOpen]                 = useState(false);
  const [editId, setEditId]                         = useState<string | null>(null);
  const [editName, setEditName]                     = useState('');
  const [editDesc, setEditDesc]                     = useState('');
  const [editPerms, setEditPerms]                   = useState<string[]>([]);
  const [editDescErr, setEditDescErr]               = useState('');

  // Delete modal
  const [isDeleteOpen, setIsDeleteOpen]             = useState(false);
  const [deletingId, setDeletingId]                 = useState<string | null>(null);

  const { addNotification } = useUIStore();

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await roleApi.getAll();
      setRoleList(
        response.data.map((r) => ({
          ...r,
          userCount: MOCK_USER_COUNTS[getRoleKey(r.name)] ?? r.userCount,
        }))
      );
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Không thể tải danh sách vai trò');
      setError(msg);
      addNotification({ type: 'error', message: msg, onRetry: fetchRoles });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Validation ───────────────────────────────────────────────────────────

  const validateName = (v: string): string => {
    if (!v.trim())                               return 'Tên vai trò là bắt buộc';
    if (v.trim().length < 2)                     return 'Tối thiểu 2 ký tự';
    if (v.trim().length > 50)                    return 'Tối đa 50 ký tự';
    if (!/^[a-zA-Z0-9_\s]+$/.test(v.trim()))    return 'Chỉ chữ, số, dấu gạch dưới';
    if (roleList.some((r) => r.name.toUpperCase() === v.trim().toUpperCase()))
      return 'Tên vai trò đã tồn tại';
    return '';
  };

  const validateDesc = (v: string): string => {
    if (!v.trim())           return 'Mô tả là bắt buộc';
    if (v.trim().length < 10) return 'Tối thiểu 10 ký tự';
    if (v.trim().length > 500) return 'Tối đa 500 ký tự';
    return '';
  };

  // ── Add handlers ─────────────────────────────────────────────────────────

  const resetAdd = () => { setNewName(''); setNewDesc(''); setNewPerms([]); setNameErr(''); setDescErr(''); };

  const toggleNewPerm = (p: string) =>
    setNewPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const selectAllNew = () =>
    setNewPerms((prev) => prev.length === allPermissions.length ? [] : [...allPermissions]);

  const selectGroupNew = (group: string) => {
    const gv = permissionGroups[group].map((p) => p.value);
    setNewPerms((prev) => {
      const allSel = gv.every((v) => prev.includes(v));
      return allSel ? prev.filter((v) => !gv.includes(v)) : [...new Set([...prev, ...gv])];
    });
  };

  const handleAddRole = async (e: FormEvent) => {
    e.preventDefault();
    const ne = validateName(newName);
    const de = validateDesc(newDesc);
    setNameErr(ne); setDescErr(de);
    if (ne || de) return;
    if (newPerms.length === 0) {
      addNotification({ type: 'warning', message: 'Chọn ít nhất một quyền' });
      return;
    }
    setLoading(true);
    try {
      const created = await roleApi.create({ name: newName.trim(), description: newDesc.trim(), permissions: newPerms as RolePermission[] });
      await fetchRoles();
      addNotification({ type: 'success', message: `Đã tạo vai trò "${created.name}"` });
      resetAdd(); setIsAddOpen(false);
    } catch (err: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Không thể tạo vai trò') });
    } finally { setLoading(false); }
  };

  // ── Edit handlers ─────────────────────────────────────────────────────────

  const resetEdit = () => { setEditId(null); setEditName(''); setEditDesc(''); setEditPerms([]); setEditDescErr(''); };

  const openEdit = (id: string) => {
    const role = roleList.find((r) => r.id === id);
    if (!role) return;
    setEditId(role.id); setEditName(role.name); setEditDesc(role.description);
    setEditPerms([...role.permissions]); setEditDescErr(''); setIsEditOpen(true);
  };

  const toggleEditPerm = (p: string) =>
    setEditPerms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);

  const selectAllEdit = () =>
    setEditPerms((prev) => prev.length === allPermissions.length ? [] : [...allPermissions]);

  const selectGroupEdit = (group: string) => {
    const gv = permissionGroups[group].map((p) => p.value);
    setEditPerms((prev) => {
      const allSel = gv.every((v) => prev.includes(v));
      return allSel ? prev.filter((v) => !gv.includes(v)) : [...new Set([...prev, ...gv])];
    });
  };

  const handleUpdateRole = async (e: FormEvent) => {
    e.preventDefault();
    if (!editId) return;
    const de = validateDesc(editDesc);
    setEditDescErr(de);
    if (de) return;
    if (editPerms.length === 0) {
      addNotification({ type: 'warning', message: 'Chọn ít nhất một quyền' });
      return;
    }
    setLoading(true);
    try {
      const updated = await roleApi.update(editName, { description: editDesc.trim(), permissions: editPerms as RolePermission[] });
      await fetchRoles();
      addNotification({ type: 'success', message: `Đã cập nhật vai trò "${updated.name}"` });
      resetEdit(); setIsEditOpen(false);
    } catch (err: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Không thể cập nhật vai trò') });
    } finally { setLoading(false); }
  };

  // ── Delete handlers ───────────────────────────────────────────────────────

  const handleDeleteRole = (id: string) => {
    const role = roleList.find((r) => r.id === id);
    if (!role) return;
    if (SYSTEM_ROLES.includes(getRoleKey(role.name))) {
      addNotification({ type: 'error', message: `Không thể xóa vai trò hệ thống "${role.name}"` });
      return;
    }
    if (role.userCount > 0) {
      addNotification({ type: 'warning', message: `Vai trò đang có ${role.userCount} người dùng, không thể xóa` });
      return;
    }
    setDeletingId(id); setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingId) return;
    const role = roleList.find((r) => r.id === deletingId);
    if (!role) return;
    setLoading(true);
    try {
      await roleApi.remove(role.name);
      await fetchRoles();
      addNotification({ type: 'success', message: `Đã xóa vai trò "${role.name}"` });
      setDeletingId(null); setIsDeleteOpen(false);
    } catch (err: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Không thể xóa vai trò') });
    } finally { setLoading(false); }
  };

  // ── Filter + sort ─────────────────────────────────────────────────────────

  const handleSort = (key: keyof RoleDefinition) => {
    setSortKey(key);
    setSortDir((d) => (sortKey === key && d === 'asc' ? 'desc' : 'asc'));
  };

  const filteredRoles = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    const filtered = kw
      ? roleList.filter((r) =>
          [r.name, r.description, ...(Array.isArray(r.permissions) ? r.permissions : [])]
            .some((v) => String(v).toLowerCase().includes(kw))
        )
      : roleList;
    return [...filtered].sort((a, b) => {
      const cmp = String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), 'vi', { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [roleList, searchKeyword, sortDir, sortKey]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalUsers    = roleList.reduce((s, r) => s + r.userCount, 0);
  const systemCount   = roleList.filter((r) => SYSTEM_ROLES.includes(getRoleKey(r.name))).length;
  const customCount   = roleList.length - systemCount;

  // ── Render ────────────────────────────────────────────────────────────────

  const deletingRole = roleList.find((r) => r.id === deletingId);

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 px-6 py-7 shadow-xl">
          {/* Decorative orbs */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-purple-500/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            {/* Title */}
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/20 ring-1 ring-blue-400/30">
                <Shield size={22} className="text-blue-300" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white">Quản lý phân quyền</h1>
                <p className="mt-0.5 text-sm text-slate-400">Cấu hình vai trò và quyền truy cập tài nguyên hệ thống</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-3 sm:shrink-0">
              {[
                { icon: ShieldCheck, label: 'Vai trò', value: roleList.length, color: 'text-blue-300' },
                { icon: Users,       label: 'Người dùng', value: totalUsers,  color: 'text-emerald-300' },
                { icon: Lock,        label: 'Hệ thống',   value: systemCount, color: 'text-amber-300' },
                { icon: UserCog,     label: 'Tùy chỉnh',  value: customCount, color: 'text-purple-300' },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10 backdrop-blur-sm">
                  <Icon size={16} className={color} />
                  <div>
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="text-base font-bold text-white leading-none mt-0.5">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Controls bar ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm vai trò, mô tả, quyền hạn..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5">
              {([['matrix', Grid3X3, 'Ma trận'], ['list', List, 'Danh sách']] as const).map(([mode, Icon, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setView(mode)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
                    view === mode
                      ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200/80'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                  title={label}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchRoles}
              disabled={loading}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
              title="Làm mới"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* Add */}
            <Button onClick={() => setIsAddOpen(true)} size="sm" className="gap-1.5">
              <Plus size={16} />
              Thêm vai trò
            </Button>
          </div>
        </div>

        {/* ── Error state ───────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-rose-800">{error}</p>
            </div>
            <button
              type="button"
              onClick={fetchRoles}
              className="text-xs font-semibold text-rose-600 underline-offset-2 hover:underline"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* ── Matrix view ───────────────────────────────────────────────── */}
        {view === 'matrix' && (
          <Card className="overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw size={22} className="animate-spin text-slate-400" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-slate-400">
                <Shield size={32} strokeWidth={1.5} />
                <p className="text-sm">Không tìm thấy vai trò nào</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-sm">
                  <thead>
                    {/* Row 1: Group headers */}
                    <tr>
                      <th
                        rowSpan={2}
                        className="sticky left-0 z-20 min-w-[220px] border-b border-r border-slate-200 bg-slate-800 px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-widest text-slate-300"
                      >
                        Vai trò
                      </th>
                      {Object.entries(permissionGroups).map(([group, perms]) => (
                        <th
                          key={group}
                          colSpan={perms.length}
                          className={cn(
                            'border-b border-l border-slate-600/40 px-3 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-white',
                            GROUP_COLORS[group] ?? 'bg-slate-700'
                          )}
                        >
                          {group}
                        </th>
                      ))}
                      <th
                        rowSpan={2}
                        className="sticky right-0 z-20 border-b border-l border-slate-600/40 bg-slate-800 px-4 py-3.5 text-xs font-semibold uppercase tracking-widest text-slate-300"
                      >
                        <span className="sr-only">Thao tác</span>
                      </th>
                    </tr>
                    {/* Row 2: Permission labels */}
                    <tr>
                      {Object.entries(permissionGroups).map(([, perms]) =>
                        perms.map((perm) => (
                          <th
                            key={perm.value}
                            title={perm.value}
                            className="border-b border-l border-slate-600/20 bg-slate-700 px-3 py-2 text-center text-[10px] font-semibold uppercase tracking-widest text-slate-300"
                          >
                            {perm.label}
                          </th>
                        ))
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRoles.map((role, idx) => {
                      const rkey    = getRoleKey(role.name);
                      const isSystem = SYSTEM_ROLES.includes(rkey);
                      const isAll   = role.permissions.includes('ALL' as RolePermission);
                      const cov     = permCoverage(role);

                      return (
                        <tr
                          key={role.id}
                          className={cn(
                            'group animate-fade-up transition-colors duration-100',
                            idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40',
                            'hover:bg-blue-50/40'
                          )}
                          style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                        >
                          {/* Frozen role name cell */}
                          <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-inherit px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <RoleAvatar name={role.name} />
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-slate-900 truncate">{role.name}</span>
                                  {isSystem && (
                                    <span title="Vai trò hệ thống" className="inline-flex shrink-0">
                                      <Lock size={11} className="text-slate-400" />
                                    </span>
                                  )}
                                  {isAll && (
                                    <Badge variant="info" className="text-[10px] py-0 px-1.5">ALL</Badge>
                                  )}
                                </div>
                                <div className="mt-0.5 flex items-center gap-2">
                                  <span className="text-xs text-slate-500">{role.userCount} người</span>
                                  <div className="flex items-center gap-1">
                                    <div className="h-1.5 w-14 overflow-hidden rounded-full bg-slate-200">
                                      <div
                                        className={cn('h-full rounded-full transition-all duration-500', cov === 100 ? 'bg-emerald-400' : cov > 50 ? 'bg-blue-400' : 'bg-slate-300')}
                                        style={{ width: `${cov}%` }}
                                      />
                                    </div>
                                    <span className="text-[10px] text-slate-400">{cov}%</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Permission cells */}
                          {Object.values(permissionGroups).flat().map((perm) => (
                            <PermCell
                              key={perm.value}
                              granted={hasPermission(role, perm.value)}
                              isAll={isAll}
                            />
                          ))}

                          {/* Actions cell */}
                          <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-inherit px-3 py-3.5">
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEdit(role.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                title="Chỉnh sửa"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 text-rose-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Matrix footer */}
            {!loading && filteredRoles.length > 0 && (
              <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-blue-500" />
                    Có quyền
                  </span>
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-purple-400" />
                    Quyền ALL
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Minus size={13} className="text-slate-300" />
                    Không có quyền
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {filteredRoles.length} vai trò · {allPermissions.length} quyền
                </span>
              </div>
            )}
          </Card>
        )}

        {/* ── List view ────────────────────────────────────────────────── */}
        {view === 'list' && (
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
                      {[
                        { key: 'name',        label: 'Vai trò'   },
                        { key: 'description', label: 'Mô tả'     },
                        { key: 'permissions', label: 'Quyền hạn' },
                        { key: 'userCount',   label: 'Người dùng' },
                        { key: 'actions',     label: ''           },
                      ].map(({ key, label }) => (
                        <th
                          key={key}
                          onClick={() => key !== 'actions' && key !== 'permissions' && handleSort(key as keyof RoleDefinition)}
                          className={cn(
                            'border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
                            key !== 'actions' && key !== 'permissions' && 'cursor-pointer hover:bg-slate-100'
                          )}
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRoles.map((role, idx) => {
                      const rkey = getRoleKey(role.name);
                      const isSystem = SYSTEM_ROLES.includes(rkey);
                      const cov = permCoverage(role);

                      return (
                        <tr
                          key={role.id}
                          className={cn('group animate-fade-up hover:bg-slate-50/80', idx % 2 === 1 && 'bg-slate-50/30')}
                          style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <RoleAvatar name={role.name} size="sm" />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-semibold text-slate-900">{role.name}</span>
                                  {isSystem && <Lock size={11} className="text-slate-400" />}
                                </div>
                                <div className="text-xs text-slate-400">{cov}% quyền</div>
                              </div>
                            </div>
                          </td>
                          <td className="max-w-xs px-5 py-4 text-sm text-slate-600">
                            <span className="line-clamp-2">{role.description}</span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1">
                              {role.permissions.includes('ALL' as RolePermission) ? (
                                <Badge variant="info">ALL</Badge>
                              ) : (
                                <>
                                  {role.permissions.slice(0, 3).map((p) => (
                                    <Badge key={p} variant="muted" className="text-[10px]">{p}</Badge>
                                  ))}
                                  {role.permissions.length > 3 && (
                                    <Badge variant="default">+{role.permissions.length - 3}</Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                              <Users size={11} />
                              {role.userCount}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={() => openEdit(role.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
                                title="Chỉnh sửa"
                              >
                                <Edit size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRole(role.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-rose-100 text-rose-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600"
                                title="Xóa"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredRoles.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-16 text-center text-sm text-slate-400">
                          Không tìm thấy vai trò nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div className="border-t border-slate-100 px-5 py-3 text-right text-xs text-slate-400">
                  {filteredRoles.length} vai trò
                </div>
              </>
            )}
          </Card>
        )}
      </div>

      {/* ── Add Role Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => { setIsAddOpen(false); resetAdd(); }}
        title="Thêm vai trò mới"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleAddRole}>
          <Input
            label="Tên vai trò"
            placeholder="VD: MANAGER, EMPLOYEE"
            required
            value={newName}
            onChange={(e) => { setNewName(e.target.value); if (nameErr) setNameErr(validateName(e.target.value)); }}
            onBlur={() => setNameErr(validateName(newName))}
            error={nameErr}
          />

          <div>
            <label htmlFor="newDesc" className="mb-1 block text-sm font-semibold text-slate-700">
              Mô tả <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="newDesc"
              rows={3}
              value={newDesc}
              onChange={(e) => { setNewDesc(e.target.value); if (descErr) setDescErr(validateDesc(e.target.value)); }}
              onBlur={() => setDescErr(validateDesc(newDesc))}
              placeholder="Mô tả vai trò (tối thiểu 10 ký tự)"
              className={cn(
                'w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500',
                descErr ? 'border-rose-400' : 'border-slate-300 hover:border-cyan-300'
              )}
            />
            {descErr && <p className="mt-1 text-xs text-rose-600">{descErr}</p>}
            <p className="mt-1 text-right text-xs text-slate-400">{newDesc.length}/500</p>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">
              Quyền hạn <span className="text-rose-500">*</span>
            </div>
            <PermissionMatrix
              selectedPerms={newPerms}
              onToggle={toggleNewPerm}
              onSelectAll={selectAllNew}
              onSelectGroup={selectGroupNew}
            />
            {newPerms.length === 0 && (
              <p className="mt-2 text-xs font-medium text-rose-600">Chọn ít nhất một quyền</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !!nameErr || !!descErr || newPerms.length === 0} isLoading={loading}>
              Tạo vai trò
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setIsAddOpen(false); resetAdd(); }} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Edit Role Modal ──────────────────────────────────────────────── */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); resetEdit(); }}
        title="Chỉnh sửa vai trò"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleUpdateRole}>
          {/* Role name (readonly) */}
          <div>
            <div className="mb-1 flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Tên vai trò</label>
              {editName && SYSTEM_ROLES.includes(getRoleKey(editName)) && (
                <Badge variant="warning" className="text-[10px]">
                  <Lock size={9} className="mr-0.5" />Hệ thống
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <RoleAvatar name={editName} size="sm" />
              <span className="text-sm font-semibold text-slate-700">{editName}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">Tên vai trò không thể thay đổi</p>
          </div>

          <div>
            <label htmlFor="editDesc" className="mb-1 block text-sm font-semibold text-slate-700">
              Mô tả <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="editDesc"
              rows={3}
              value={editDesc}
              onChange={(e) => { setEditDesc(e.target.value); if (editDescErr) setEditDescErr(validateDesc(e.target.value)); }}
              onBlur={() => setEditDescErr(validateDesc(editDesc))}
              placeholder="Mô tả vai trò"
              className={cn(
                'w-full resize-none rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500',
                editDescErr ? 'border-rose-400' : 'border-slate-300 hover:border-cyan-300'
              )}
            />
            {editDescErr && <p className="mt-1 text-xs text-rose-600">{editDescErr}</p>}
            <p className="mt-1 text-right text-xs text-slate-400">{editDesc.length}/500</p>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-slate-700">
              Quyền hạn <span className="text-rose-500">*</span>
            </div>
            <PermissionMatrix
              selectedPerms={editPerms}
              onToggle={toggleEditPerm}
              onSelectAll={selectAllEdit}
              onSelectGroup={selectGroupEdit}
            />
            {editPerms.length === 0 && (
              <p className="mt-2 text-xs font-medium text-rose-600">Chọn ít nhất một quyền</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={loading || !!editDescErr || editPerms.length === 0} isLoading={loading}>
              Lưu thay đổi
            </Button>
            <Button type="button" variant="secondary" onClick={() => { setIsEditOpen(false); resetEdit(); }} disabled={loading}>
              Hủy
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirm Modal ─────────────────────────────────────────── */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => { setIsDeleteOpen(false); setDeletingId(null); }}
        title="Xác nhận xóa vai trò"
      >
        <div className="space-y-4">
          {deletingRole && (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
                <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-500" />
                <div>
                  <p className="font-semibold text-rose-900">Hành động này không thể hoàn tác</p>
                  <p className="mt-1 text-sm text-rose-700">
                    Vai trò <strong>"{deletingRole.name}"</strong> sẽ bị xóa vĩnh viễn.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-3 mb-3">
                  <RoleAvatar name={deletingRole.name} />
                  <div>
                    <div className="font-semibold text-slate-900">{deletingRole.name}</div>
                    <div className="text-xs text-slate-500">{deletingRole.description}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-slate-400">Người dùng</div>
                    <div className="font-bold text-slate-800">{deletingRole.userCount}</div>
                  </div>
                  <div className="rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                    <div className="text-slate-400">Số quyền</div>
                    <div className="font-bold text-slate-800">{deletingRole.permissions.length}</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsDeleteOpen(false); setDeletingId(null); }}
              disabled={loading}
            >
              Hủy
            </Button>
            <Button variant="danger" onClick={handleConfirmDelete} disabled={loading} isLoading={loading}>
              Xóa vai trò
            </Button>
          </div>
        </div>
      </Modal>
    </MainLayout>
  );
};
