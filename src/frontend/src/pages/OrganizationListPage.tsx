import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Layers, Plus, Search, Trash2, RefreshCw, AlertCircle, ChevronRight, Network } from 'lucide-react';
import { organizationApi } from '@/api/organization.api';
import { Button } from '@/components/UI/Button';
import { Card } from '@/components/UI/Card';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useUIStore } from '@/store/uiStore';
import { OrganizationUnitTreeNode } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';
import { cn } from '@/utils/cn';

// ─── Types ─────────────────────────────────────────────────────────────────

type OrgLevel = 'CORPORATION' | 'TOTAL_COMPANY' | 'MEMBER_COMPANY' | 'DEPARTMENT';

type OrgRow = OrganizationUnitTreeNode & {
  parentNameText: string;
  childCount: number;
  depth: number;
};

// ─── Constants ─────────────────────────────────────────────────────────────

const LEVEL_META: Record<OrgLevel, { label: string; badge: string; dot: string }> = {
  CORPORATION:    { label: 'Tập đoàn',   badge: 'border-purple-200 bg-purple-50 text-purple-700',  dot: 'bg-purple-500' },
  TOTAL_COMPANY:  { label: 'Công ty mẹ', badge: 'border-blue-200   bg-blue-50   text-blue-700',    dot: 'bg-blue-500'   },
  MEMBER_COMPANY: { label: 'Thành viên', badge: 'border-emerald-200 bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  DEPARTMENT:     { label: 'Phòng ban',  badge: 'border-amber-200  bg-amber-50  text-amber-700',   dot: 'bg-amber-500'  },
};

function getLevelMeta(level: string) {
  return LEVEL_META[level as OrgLevel] ?? { label: level, badge: 'border-slate-200 bg-slate-50 text-slate-600', dot: 'bg-slate-400' };
}

// ─── Flatten tree with depth ────────────────────────────────────────────────

function flattenTree(
  nodes: OrganizationUnitTreeNode[],
  parentName = '—',
  depth = 0
): OrgRow[] {
  return nodes.flatMap((node) => [
    { ...node, parentNameText: parentName, childCount: node.children.length, depth },
    ...flattenTree(node.children, node.name, depth + 1),
  ]);
}

// ─── Component ──────────────────────────────────────────────────────────────

export const OrganizationListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [treeData, setTreeData] = useState<OrganizationUnitTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await organizationApi.getTree();
      setTreeData(response.data);
    } catch (err: unknown) {
      const msg = getApiErrorMessage(err, 'Lỗi khi tải danh sách tổ chức.');
      setError(msg);
      addNotification({ type: 'error', message: msg });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { fetchOrganizations(); }, [fetchOrganizations]);

  const handleDelete = useCallback(
    async (id: number, name: string) => {
      if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa tổ chức "${name}"?`)) return;
      try {
        await organizationApi.delete(id);
        addNotification({ type: 'success', message: 'Xóa tổ chức thành công.' });
        void fetchOrganizations();
      } catch (err: unknown) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi xóa tổ chức.') });
      }
    },
    [addNotification, fetchOrganizations]
  );

  const tableData = useMemo(() => flattenTree(treeData), [treeData]);

  const filteredData = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    if (!kw) return tableData;
    return tableData.filter((node) =>
      [node.name, node.code, node.level, node.parentNameText]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw))
    );
  }, [searchKeyword, tableData]);

  // Stats
  const rootCount  = treeData.length;
  const totalCount = tableData.length;
  const maxDepth   = useMemo(() => Math.max(...tableData.map((r) => r.depth), 0), [tableData]);

  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    tableData.forEach((r) => { counts[r.level] = (counts[r.level] ?? 0) + 1; });
    return counts;
  }, [tableData]);

  return (
    <MainLayout>
      <div className="space-y-5">

        {/* ── Hero header ──────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-700 via-emerald-800 to-slate-900 px-6 py-7 shadow-xl">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 left-1/3 h-36 w-36 rounded-full bg-emerald-400/10 blur-2xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-400/20 ring-1 ring-teal-300/30">
                <Network size={22} className="text-teal-200" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Quản lý tổ chức</h1>
                <p className="mt-0.5 text-sm text-teal-300">Cấu trúc phân cấp từ tập đoàn đến phòng ban</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {[
                { label: 'Đơn vị',    value: totalCount, color: 'text-teal-300' },
                { label: 'Gốc',       value: rootCount,  color: 'text-emerald-300' },
                { label: 'Cấp sâu',  value: maxDepth + 1, color: 'text-amber-300' },
              ].map(({ label, value, color }) => (
                <div key={label} className="rounded-xl bg-white/5 px-4 py-2.5 ring-1 ring-white/10">
                  <div className="text-xs text-teal-300/80">{label}</div>
                  <div className={cn('text-base font-bold leading-none mt-0.5', color)}>{value}</div>
                </div>
              ))}

              <Button onClick={() => navigate('/organizations/add')} size="sm" className="gap-1.5">
                <Plus size={16} />
                Thêm tổ chức
              </Button>
            </div>
          </div>

          {/* Level breakdown */}
          {Object.entries(levelCounts).length > 0 && (
            <div className="relative mt-4 flex flex-wrap gap-2">
              {Object.entries(levelCounts).map(([level, count]) => {
                const meta = getLevelMeta(level);
                return (
                  <span key={level} className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/10">
                    <span className={cn('h-2 w-2 rounded-full', meta.dot)} />
                    {meta.label} ({count})
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Search + refresh ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm theo tên, mã, cấp hoặc tổ chức cha..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm text-slate-800 shadow-sm outline-none placeholder:text-slate-400 focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <button
            type="button"
            onClick={fetchOrganizations}
            disabled={loading}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700 disabled:opacity-50"
            title="Làm mới"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="flex-1 text-sm font-medium text-rose-800">{error}</p>
            <button type="button" onClick={fetchOrganizations} className="text-xs font-semibold text-rose-600 underline-offset-2 hover:underline">Thử lại</button>
          </div>
        )}

        {/* ── Tree table ────────────────────────────────────────────────── */}
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
                    {['Tên tổ chức', 'Mã', 'Cấp', 'Tổ chức cha', 'Đơn vị con', ''].map((h) => (
                      <th key={h} className="border-b border-slate-200 px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredData.map((node, idx) => {
                    const meta  = getLevelMeta(node.level);
                    const isSearching = !!searchKeyword.trim();

                    return (
                      <tr
                        key={node.id}
                        onClick={() => navigate(`/organizations/edit/${node.id}`)}
                        className={cn(
                          'group animate-fade-up cursor-pointer transition-colors duration-100 hover:bg-teal-50/40',
                          idx % 2 === 1 && 'bg-slate-50/30'
                        )}
                        style={{ animationDelay: `${Math.min(idx * 35, 350)}ms` }}
                      >
                        {/* Name with tree indent */}
                        <td className="px-5 py-3.5">
                          <div
                            className="flex items-center gap-1"
                            style={{ paddingLeft: isSearching ? 0 : `${node.depth * 20}px` }}
                          >
                            {!isSearching && node.depth > 0 && (
                              <ChevronRight size={14} className="shrink-0 text-slate-300" />
                            )}
                            <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ring-1', meta.badge.replace('border-', 'ring-').replace(' bg-', ' bg-').split(' ').slice(0, 2).join(' '))}>
                              {(node.code?.charAt(0) ?? node.name.charAt(0)).toUpperCase()}
                            </div>
                            <span className="ml-1 font-semibold text-slate-900">{node.name}</span>
                          </div>
                        </td>

                        {/* Code */}
                        <td className="px-5 py-3.5">
                          {node.code ? (
                            <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-mono font-semibold text-slate-600">
                              {node.code}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>

                        {/* Level badge */}
                        <td className="px-5 py-3.5">
                          <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold', meta.badge)}>
                            <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
                            {meta.label}
                          </span>
                        </td>

                        {/* Parent */}
                        <td className="px-5 py-3.5 text-sm text-slate-500">{node.parentNameText}</td>

                        {/* Children count */}
                        <td className="px-5 py-3.5">
                          {node.childCount > 0 ? (
                            <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                              <Layers size={11} />
                              {node.childCount}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); navigate(`/organizations/edit/${node.id}`); }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-600"
                              title="Chỉnh sửa"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); void handleDelete(node.id, node.name); }}
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

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-16 text-center">
                        <div className="flex flex-col items-center gap-2 text-slate-400">
                          <Network size={32} strokeWidth={1.5} />
                          <p className="text-sm">Không tìm thấy đơn vị tổ chức nào</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {filteredData.length > 0 && (
                <div className="border-t border-slate-100 px-5 py-3 text-right text-xs text-slate-400">
                  {filteredData.length} đơn vị
                </div>
              )}
            </>
          )}
        </Card>
      </div>
    </MainLayout>
  );
};
