import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Filter,
  RefreshCw,
  RotateCcw,
  Search,
  WalletCards,
  XCircle,
} from 'lucide-react';
import { employeeApi } from '@/api/employee.api';
import { payrollApi } from '@/api/payroll.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/uiStore';
import { Employee } from '@/types/employee';
import { PayrollResult, PayrollStatus } from '@/types/payroll';
import { cn } from '@/utils/cn';
import { PERMISSIONS } from '@/utils/permissions';

type PayView = 'dashboard' | 'workflow' | 'table';

const statusLabels: Record<string, string> = {
  DRAFT: 'Bản nháp',
  APPROVED: 'Đã duyệt',
  PROCESSED: 'Đã xử lý',
  FAILED: 'Lỗi',
};

const statusVariants: Record<string, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'warning',
  APPROVED: 'info',
  PROCESSED: 'success',
  FAILED: 'danger',
};

const statusRowBg: Record<string, string> = {
  DRAFT:     'bg-amber-50/60',
  APPROVED:  'bg-blue-50/40',
  PROCESSED: 'bg-emerald-50/40',
  FAILED:    'bg-rose-50/40',
};

const currentYearMonth = () => new Date().toISOString().slice(0, 7);

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(Number(value || 0));

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '--';

const formatStatus = (status: PayrollStatus) => statusLabels[status] || status;
const getStatusVariant = (status: PayrollStatus) => statusVariants[status] || 'muted';

// ─── Reusable UI pieces ────────────────────────────────────────────────────

const ViewTab = ({
  active, onClick, icon: Icon, label, count,
}: {
  active: boolean; onClick: () => void; icon: typeof WalletCards; label: string; count?: number;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all',
      active
        ? 'border-cyan-200 bg-white text-cyan-800 shadow-sm'
        : 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-white hover:text-slate-900'
    )}
  >
    <Icon size={16} />
    {label}
    {count !== undefined && (
      <span className={cn(
        'rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums',
        active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-200 text-slate-500'
      )}>
        {count}
      </span>
    )}
  </button>
);

const StatCard = ({
  label, value, hint, icon: Icon, gradient, tone,
}: {
  label: string; value: string; hint: string; icon: typeof WalletCards; gradient: string; tone: string;
}) => (
  <Card className="relative overflow-hidden p-5">
    <div className={cn('absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r', gradient)} />
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
        <p className="mt-1.5 font-display text-2xl font-bold tabular-nums text-slate-950">{value}</p>
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      </div>
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}>
        <Icon size={20} />
      </div>
    </div>
  </Card>
);

// ─── Workflow Kanban column ────────────────────────────────────────────────

interface WorkflowColProps {
  status: string;
  label: string;
  accentCls: string;
  dotCls: string;
  records: PayrollResult[];
  canManage: boolean;
  selectedId?: number | null;
  onSelect: (r: PayrollResult) => void;
  onApprove: (r: PayrollResult) => void;
  onReject: (r: PayrollResult) => void;
  onProcess: (r: PayrollResult) => void;
}

const WorkflowStageCol = ({
  status, label, accentCls, dotCls, records, canManage, selectedId,
  onSelect, onApprove, onReject, onProcess,
}: WorkflowColProps) => (
  <div className="flex min-w-[260px] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/60">
    <div className={cn('flex items-center gap-2 border-b border-slate-200 px-4 py-3', accentCls)}>
      <span className={cn('h-2 w-2 rounded-full', dotCls)} />
      <span className="font-display text-sm font-bold">{label}</span>
      <span className="ml-auto rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold tabular-nums">
        {records.length}
      </span>
    </div>

    <div className="flex-1 space-y-3 overflow-y-auto p-3" style={{ minHeight: 320 }}>
      {records.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-5 text-center text-xs text-slate-400">
          Không có bản ghi
        </div>
      ) : (
        records.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => onSelect(r)}
            className={cn(
              'w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:border-cyan-300 hover:shadow-md',
              selectedId === r.id ? 'border-cyan-400 ring-1 ring-cyan-300' : 'border-slate-200'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-display text-sm font-bold text-slate-950 truncate">
                {r.employee?.name || `Nhân viên #${r.id}`}
              </span>
              <span className="shrink-0 text-[10px] font-bold text-slate-300">#{r.id}</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {formatDate(r.periodStartDate)} – {formatDate(r.periodEndDate)}
            </p>
            <p className="mt-2 font-display text-base font-bold text-slate-900">
              {formatCurrency(r.netPay)}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {status === 'DRAFT' && canManage && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onApprove(r); }}
                  className="inline-flex h-6 items-center gap-1 rounded-lg bg-cyan-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-cyan-700"
                >
                  <CheckCircle2 size={10} />
                  Duyệt
                </button>
              )}
              {status === 'APPROVED' && canManage && (
                <>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onProcess(r); }}
                    className="inline-flex h-6 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[10px] font-bold text-white transition hover:bg-emerald-700"
                  >
                    <ClipboardCheck size={10} />
                    Xử lý
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onReject(r); }}
                    className="inline-flex h-6 items-center gap-1 rounded-lg bg-slate-200 px-2.5 text-[10px] font-bold text-slate-700 transition hover:bg-slate-300"
                  >
                    <RotateCcw size={10} />
                    Từ chối
                  </button>
                </>
              )}
              {status === 'PROCESSED' && (
                <span className="text-[10px] font-semibold text-emerald-600">
                  ✓ {r.processedBy || 'Hệ thống'}
                </span>
              )}
            </div>
          </button>
        ))
      )}
    </div>
  </div>
);

// ─── Main page component ───────────────────────────────────────────────────

export const PayrollPage = () => {
  const { can } = usePermissions();
  const { addNotification } = useUIStore();
  const canManagePayroll = can(PERMISSIONS.PAYROLL_MANAGE);

  const [view, setView] = useState<PayView>('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [currentPayroll, setCurrentPayroll] = useState<PayrollResult | null>(null);
  const [history, setHistory] = useState<PayrollResult[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedWorkflowRecord, setSelectedWorkflowRecord] = useState<PayrollResult | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [tableStatusFilter, setTableStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((e) => e.id === Number(selectedEmployeeId)),
    [employees, selectedEmployeeId]
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await employeeApi.getAll({ page: 0, size: 100 });
      const list = response.data.content;
      setEmployees(list);
      setSelectedEmployeeId((cur) => cur || list[0]?.id || '');
    } catch {
      addNotification({ type: 'error', message: 'Không thể tải danh sách nhân viên.' });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  const refreshPayroll = useCallback(async (employeeId: number) => {
    if (!employeeId) return;
    try {
      const [current, payrollHistory] = await Promise.all([
        payrollApi.getCurrent(employeeId).catch(() => null),
        payrollApi.getHistory(employeeId).catch(() => []),
      ]);
      setCurrentPayroll(current);
      setHistory(payrollHistory);
    } catch {
      addNotification({ type: 'error', message: 'Không thể tải dữ liệu bảng lương.' });
    }
  }, [addNotification]);

  useEffect(() => { void loadEmployees(); }, [loadEmployees]);
  useEffect(() => {
    if (selectedEmployeeId) void refreshPayroll(Number(selectedEmployeeId));
  }, [refreshPayroll, selectedEmployeeId]);

  const runAction = async (actionKey: string, action: () => Promise<void>) => {
    if (!canManagePayroll) {
      addNotification({ type: 'error', message: 'Tài khoản hiện tại chỉ có quyền xem bảng lương.' });
      return;
    }
    setActionLoading(actionKey);
    try {
      await action();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Thao tác payroll không thành công.';
      addNotification({ type: 'error', message: msg });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRun = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await runAction('create-run', async () => {
      const run = await payrollApi.createRun({
        yearMonth,
        requestedBy: selectedEmployee?.username || 'frontend-demo',
        source: 'frontend',
      });
      addNotification({ type: 'success', message: `Đã tạo kỳ lương ${run.yearMonth} (#${run.payrollRunId}).` });
    });
  };

  const handleCalculate = async () => {
    const employeeId = Number(selectedEmployeeId);
    if (!employeeId) { addNotification({ type: 'error', message: 'Vui lòng chọn nhân viên.' }); return; }
    await runAction('calculate', async () => {
      const result = await payrollApi.calculate(employeeId, yearMonth);
      setCurrentPayroll(result);
      addNotification({ type: 'success', message: `Đã tính lương cho ${selectedEmployee?.name || `#${employeeId}`}.` });
      await refreshPayroll(employeeId);
    });
  };

  const approveRecord = (record: PayrollResult) =>
    runAction('approve', async () => {
      const res = await payrollApi.approve(record.id);
      addNotification({ type: 'success', message: res.message || 'Đã phê duyệt.' });
      await refreshPayroll(Number(selectedEmployeeId));
    });

  const rejectRecord = (record: PayrollResult) =>
    runAction('reject', async () => {
      const res = await payrollApi.reject(record.id, rejectReason.trim() || 'Cần kiểm tra lại');
      addNotification({ type: 'success', message: res.message || 'Đã từ chối.' });
      setRejectReason('');
      await refreshPayroll(Number(selectedEmployeeId));
    });

  const processRecord = (record: PayrollResult) =>
    runAction('process', async () => {
      const res = await payrollApi.process(record.id);
      addNotification({ type: 'success', message: res.message || 'Đã xử lý chi trả.' });
      await refreshPayroll(Number(selectedEmployeeId));
    });

  // Workflow board grouping
  const workflowColumns = useMemo(() => ({
    DRAFT:     history.filter((r) => r.status === 'DRAFT'),
    APPROVED:  history.filter((r) => r.status === 'APPROVED'),
    PROCESSED: history.filter((r) => r.status === 'PROCESSED'),
  }), [history]);

  // Table filtering
  const filteredTable = useMemo(() => history.filter((r) => {
    const matchSearch = !tableSearch ||
      String(r.id).includes(tableSearch) ||
      formatDate(r.periodStartDate).includes(tableSearch) ||
      formatCurrency(r.netPay).includes(tableSearch);
    const matchStatus = tableStatusFilter === 'all' || r.status === tableStatusFilter;
    return matchSearch && matchStatus;
  }), [history, tableSearch, tableStatusFilter]);

  const canApprove = canManagePayroll && currentPayroll?.status === 'DRAFT';
  const canReject  = canManagePayroll && (currentPayroll?.status === 'APPROVED' || currentPayroll?.status === 'DRAFT');
  const canProcess = canManagePayroll && currentPayroll?.status === 'APPROVED';

  const summaryStats = [
    { label: 'Lương gộp',    value: formatCurrency(currentPayroll?.grossPay),       hint: 'Tổng thu nhập trước khấu trừ', icon: WalletCards,   gradient: 'from-cyan-400 to-cyan-600',     tone: 'bg-cyan-50 text-cyan-700'     },
    { label: 'Tổng khấu trừ', value: formatCurrency(currentPayroll?.totalDeduction), hint: 'Thuế + bảo hiểm + khác',       icon: Calculator,    gradient: 'from-amber-400 to-amber-600',   tone: 'bg-amber-50 text-amber-700'   },
    { label: 'Thực lĩnh',    value: formatCurrency(currentPayroll?.netPay),          hint: 'Số tiền sau khấu trừ',          icon: CheckCircle2,  gradient: 'from-emerald-400 to-emerald-600', tone: 'bg-emerald-50 text-emerald-700' },
    {
      label: 'Trạng thái',
      value: currentPayroll ? formatStatus(currentPayroll.status) : 'Chưa có',
      hint: currentPayroll ? `Payroll #${currentPayroll.id}` : 'Tính lương để tạo bản ghi',
      icon: ClipboardCheck, gradient: 'from-slate-400 to-slate-600', tone: 'bg-slate-100 text-slate-600',
    },
  ];

  const pendingCount = workflowColumns.DRAFT.length + workflowColumns.APPROVED.length;

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={WalletCards}
          title="Quản lý bảng lương"
          description="Tạo kỳ lương, tính lương, phê duyệt và xử lý chi trả cho nhân viên."
          actions={
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshPayroll(Number(selectedEmployeeId))}
                disabled={!selectedEmployeeId}
              >
                <RefreshCw size={16} />
                Tải lại
              </Button>
              {view === 'table' && (
                <Button
                  type="button"
                  onClick={() => addNotification({ type: 'info', message: 'Export Excel sẽ gọi endpoint /payroll/export.' })}
                >
                  <Download size={16} />
                  Xuất XLSX
                </Button>
              )}
            </div>
          }
        />

        {!canManagePayroll && (
          <Card className="border-cyan-200 bg-cyan-50">
            <CardContent className="py-3">
              <p className="text-sm font-medium text-cyan-900">
                Chỉ có quyền xem. Cần <strong>PAYROLL_MANAGE</strong> để tính lương và phê duyệt.
              </p>
            </CardContent>
          </Card>
        )}

        {/* ── Tab navigation ─────────────────────────────── */}
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
          <ViewTab active={view === 'dashboard'} onClick={() => setView('dashboard')} icon={WalletCards}      label="Tổng quan" />
          <ViewTab active={view === 'workflow'}  onClick={() => setView('workflow')}  icon={ArrowRight}       label="Quy trình duyệt" count={pendingCount} />
          <ViewTab active={view === 'table'}     onClick={() => setView('table')}     icon={FileSpreadsheet}  label="Bảng lương"      count={history.length} />
        </div>

        {/* ══════════════════════════════════════════════════
            DASHBOARD TAB
        ══════════════════════════════════════════════════ */}
        {view === 'dashboard' && (
          <div className="space-y-5">
            {/* Setup form */}
            <Card>
              <CardHeader>
                <CardTitle>Thiết lập kỳ lương</CardTitle>
                <CardDescription>Chọn nhân viên và tháng để tính lương, tạo kỳ payroll.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto]"
                  onSubmit={(e) => void handleCreateRun(e)}
                >
                  <div>
                    <label htmlFor="payroll-employee" className="mb-1 block text-sm font-semibold text-slate-700">Nhân viên</label>
                    <select
                      id="payroll-employee"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                      className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      disabled={loading || employees.length === 0}
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} #{emp.id}{emp.position ? ` — ${emp.position}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Input label="Tháng lương" type="month" required value={yearMonth} onChange={(e) => setYearMonth(e.target.value)} />
                  <div className="flex items-end">
                    <Button type="submit" variant="outline" isLoading={actionLoading === 'create-run'} disabled={!canManagePayroll}>
                      <ClipboardCheck size={16} />
                      Tạo kỳ
                    </Button>
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={() => void handleCalculate()} isLoading={actionLoading === 'calculate'} disabled={!canManagePayroll || !selectedEmployeeId}>
                      <Calculator size={16} />
                      Tính lương
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Stats bar */}
            <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
              {summaryStats.map((card) => <StatCard key={card.label} {...card} />)}
            </section>

            {/* Current payroll detail + workflow actions */}
            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Bảng lương hiện tại</CardTitle>
                      <CardDescription>
                        {selectedEmployee ? `${selectedEmployee.name} — #${selectedEmployee.id}` : 'Chưa chọn nhân viên'}
                      </CardDescription>
                    </div>
                    {currentPayroll && (
                      <Badge variant={getStatusVariant(currentPayroll.status)}>
                        {formatStatus(currentPayroll.status)}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {currentPayroll ? (
                    <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {[
                        { label: 'Kỳ lương',       value: `${formatDate(currentPayroll.periodStartDate)} – ${formatDate(currentPayroll.periodEndDate)}` },
                        { label: 'Thuế',            value: formatCurrency(currentPayroll.taxDeduction) },
                        { label: 'Bảo hiểm',        value: formatCurrency(currentPayroll.insuranceDeduction) },
                        { label: 'Khấu trừ khác',   value: formatCurrency(currentPayroll.otherDeduction) },
                        { label: 'Người phê duyệt', value: currentPayroll.approvedBy  || '—' },
                        { label: 'Người xử lý',     value: currentPayroll.processedBy || '—' },
                      ].map((item) => (
                        <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                          <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
                          <dd className="mt-1.5 text-sm font-semibold text-slate-800">{item.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : (
                    <EmptyState
                      icon={WalletCards}
                      title="Chưa có bảng lương"
                      description="Chọn nhân viên và bấm Tính lương để tạo bản ghi payroll DRAFT."
                    />
                  )}
                </CardContent>
              </Card>

              {/* Workflow panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Workflow chi trả</CardTitle>
                  <CardDescription>DRAFT → APPROVED → PROCESSED</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Step indicator */}
                  <div className="flex items-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5">
                    {(['DRAFT', 'APPROVED', 'PROCESSED'] as const).map((s, i, arr) => (
                      <div key={s} className="flex items-center gap-1.5">
                        <span className={cn(
                          'rounded-full px-2.5 py-1 text-[11px] font-bold',
                          currentPayroll?.status === s ? 'bg-cyan-600 text-white' : 'bg-slate-200 text-slate-500'
                        )}>
                          {statusLabels[s]}
                        </span>
                        {i < arr.length - 1 && <ArrowRight size={11} className="text-slate-300" />}
                      </div>
                    ))}
                  </div>

                  <Button type="button" className="w-full justify-start" onClick={() => void approveRecord(currentPayroll!)} isLoading={actionLoading === 'approve'} disabled={!canApprove}>
                    <CheckCircle2 size={16} />
                    Phê duyệt bảng lương
                  </Button>
                  <Input
                    label="Lý do từ chối"
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Ví dụ: Cần kiểm tra lại khấu trừ"
                    disabled={!canManagePayroll}
                  />
                  <Button type="button" variant="outline" className="w-full justify-start" onClick={() => void rejectRecord(currentPayroll!)} isLoading={actionLoading === 'reject'} disabled={!canReject}>
                    <RotateCcw size={16} />
                    Từ chối về DRAFT
                  </Button>
                  <Button type="button" variant="success" className="w-full justify-start" onClick={() => void processRecord(currentPayroll!)} isLoading={actionLoading === 'process'} disabled={!canProcess}>
                    <ClipboardCheck size={16} />
                    Xử lý chi trả
                  </Button>
                  <p className="flex items-start gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <XCircle size={13} className="mt-0.5 shrink-0" />
                    Bản ghi PROCESSED được khóa để phục vụ audit.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            WORKFLOW TAB  (Kanban board)
        ══════════════════════════════════════════════════ */}
        {view === 'workflow' && (
          <div className="space-y-4">
            {/* Filter bar */}
            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.name} #{emp.id}</option>
                ))}
              </select>

              <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs text-slate-500">
                <Filter size={13} />
                <span>Kỳ: {yearMonth}</span>
              </div>

              <Button type="button" size="sm" variant="outline" onClick={() => void refreshPayroll(Number(selectedEmployeeId))}>
                <RefreshCw size={14} />
              </Button>

              {pendingCount > 0 && (
                <div className="ml-auto flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                  {pendingCount} bản ghi cần xử lý
                </div>
              )}
            </div>

            {/* Kanban board */}
            <div className="flex gap-4 overflow-x-auto pb-2">
              <WorkflowStageCol
                status="DRAFT" label="Chờ phê duyệt"
                accentCls="bg-amber-50/80 text-amber-800" dotCls="bg-amber-500"
                records={workflowColumns.DRAFT}
                canManage={canManagePayroll}
                selectedId={selectedWorkflowRecord?.id}
                onSelect={setSelectedWorkflowRecord}
                onApprove={(r) => void approveRecord(r)}
                onReject={(r) => void rejectRecord(r)}
                onProcess={(r) => void processRecord(r)}
              />

              <div className="flex items-center self-start pt-4 text-slate-300">
                <ArrowRight size={22} />
              </div>

              <WorkflowStageCol
                status="APPROVED" label="Đã duyệt — chờ xử lý"
                accentCls="bg-blue-50/80 text-blue-800" dotCls="bg-blue-500"
                records={workflowColumns.APPROVED}
                canManage={canManagePayroll}
                selectedId={selectedWorkflowRecord?.id}
                onSelect={setSelectedWorkflowRecord}
                onApprove={(r) => void approveRecord(r)}
                onReject={(r) => void rejectRecord(r)}
                onProcess={(r) => void processRecord(r)}
              />

              <div className="flex items-center self-start pt-4 text-slate-300">
                <ArrowRight size={22} />
              </div>

              <WorkflowStageCol
                status="PROCESSED" label="Đã xử lý"
                accentCls="bg-emerald-50/80 text-emerald-800" dotCls="bg-emerald-500"
                records={workflowColumns.PROCESSED}
                canManage={canManagePayroll}
                selectedId={selectedWorkflowRecord?.id}
                onSelect={setSelectedWorkflowRecord}
                onApprove={(r) => void approveRecord(r)}
                onReject={(r) => void rejectRecord(r)}
                onProcess={(r) => void processRecord(r)}
              />
            </div>

            {/* Selected record detail panel */}
            {selectedWorkflowRecord && (
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>Chi tiết — Payroll #{selectedWorkflowRecord.id}</CardTitle>
                      <CardDescription>
                        {selectedWorkflowRecord.employee?.name || selectedEmployee?.name || 'Nhân viên'} ·{' '}
                        {formatDate(selectedWorkflowRecord.periodStartDate)} – {formatDate(selectedWorkflowRecord.periodEndDate)}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusVariant(selectedWorkflowRecord.status)}>
                      {formatStatus(selectedWorkflowRecord.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
                    {[
                      { label: 'Lương gộp',    value: formatCurrency(selectedWorkflowRecord.grossPay),           bold: false },
                      { label: 'Thuế',          value: formatCurrency(selectedWorkflowRecord.taxDeduction),       bold: false },
                      { label: 'Bảo hiểm',      value: formatCurrency(selectedWorkflowRecord.insuranceDeduction), bold: false },
                      { label: 'Khấu trừ khác', value: formatCurrency(selectedWorkflowRecord.otherDeduction),     bold: false },
                      { label: 'Tổng khấu trừ', value: formatCurrency(selectedWorkflowRecord.totalDeduction),     bold: false },
                      { label: 'Thực lĩnh',     value: formatCurrency(selectedWorkflowRecord.netPay),             bold: true  },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl bg-slate-50 px-4 py-3">
                        <dt className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{item.label}</dt>
                        <dd className={cn('mt-1.5 text-sm', item.bold ? 'font-bold text-emerald-700' : 'font-semibold text-slate-800')}>
                          {item.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════
            TABLE TAB  (Professional payroll table)
        ══════════════════════════════════════════════════ */}
        {view === 'table' && (
          <div className="space-y-4">
            {/* Controls bar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {/* Employee selector */}
                <select
                  value={selectedEmployeeId}
                  onChange={(e) => setSelectedEmployeeId(Number(e.target.value))}
                  className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name} #{emp.id}</option>
                  ))}
                </select>

                {/* Status filter chips */}
                <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
                  {([
                    ['all',       'Tất cả'],
                    ['DRAFT',     'Nháp'],
                    ['APPROVED',  'Đã duyệt'],
                    ['PROCESSED', 'Đã xử lý'],
                  ] as const).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTableStatusFilter(key)}
                      className={cn(
                        'rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all',
                        tableStatusFilter === key ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="flex h-9 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm">
                  <Search size={14} className="shrink-0 text-slate-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Tìm kiếm..."
                    className="w-36 bg-transparent outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => void refreshPayroll(Number(selectedEmployeeId))}>
                  <RefreshCw size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => addNotification({ type: 'info', message: 'Export Excel sẽ gọi endpoint /payroll/export.' })}
                >
                  <FileSpreadsheet size={14} />
                  Xuất XLSX
                </Button>
              </div>
            </div>

            {/* Table panel */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              {/* Panel header */}
              <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-xs font-bold text-cyan-800">
                  {(selectedEmployee?.name || 'NV').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <span className="font-display text-sm font-bold text-slate-900">
                    {selectedEmployee?.name || 'Nhân viên'} — Lịch sử lương
                  </span>
                  {selectedEmployee?.position && (
                    <span className="ml-2 text-xs text-slate-400">{selectedEmployee.position}</span>
                  )}
                </div>
                <span className="ml-auto rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                  {filteredTable.length} bản ghi
                </span>
              </div>

              {filteredTable.length === 0 ? (
                <div className="p-8">
                  <EmptyState icon={WalletCards} title="Chưa có dữ liệu" description="Tính lương để tạo bản ghi đầu tiên." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/40">
                        {['#', 'Nhân viên', 'Kỳ lương', 'Lương gộp', 'Thuế', 'Bảo hiểm', 'Khấu trừ khác', 'Tổng KT', 'Thực lĩnh', 'Người duyệt', 'Trạng thái', ''].map((col) => (
                          <th key={col} className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-slate-400 first:pl-5">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredTable.map((record, idx) => (
                        <tr
                          key={record.id}
                          className={cn(
                            'group cursor-pointer transition-colors hover:bg-cyan-50/50',
                            statusRowBg[record.status] || ''
                          )}
                          onClick={() => { setCurrentPayroll(record); setView('dashboard'); }}
                        >
                          <td className="py-4 pl-5 text-[11px] font-bold tabular-nums text-slate-300">
                            {String(idx + 1).padStart(2, '0')}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-xs font-bold text-cyan-800">
                                {(record.employee?.name || selectedEmployee?.name || 'NV').slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {record.employee?.name || selectedEmployee?.name || `NV #${record.id}`}
                                </p>
                                <p className="text-[11px] text-slate-400">ID #{record.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-600 whitespace-nowrap">
                            <span>{formatDate(record.periodStartDate)}</span><br />
                            <span className="text-slate-400">{formatDate(record.periodEndDate)}</span>
                          </td>
                          <td className="px-4 py-4 font-display tabular-nums font-semibold text-slate-800 whitespace-nowrap">
                            {formatCurrency(record.grossPay)}
                          </td>
                          <td className="px-4 py-4 tabular-nums text-slate-600 whitespace-nowrap">
                            {formatCurrency(record.taxDeduction)}
                          </td>
                          <td className="px-4 py-4 tabular-nums text-slate-600 whitespace-nowrap">
                            {formatCurrency(record.insuranceDeduction)}
                          </td>
                          <td className="px-4 py-4 tabular-nums text-slate-600 whitespace-nowrap">
                            {formatCurrency(record.otherDeduction)}
                          </td>
                          <td className="px-4 py-4 tabular-nums font-semibold text-amber-700 whitespace-nowrap">
                            {formatCurrency(record.totalDeduction)}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="font-display tabular-nums font-bold text-emerald-700">
                              {formatCurrency(record.netPay)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-xs text-slate-500">{record.approvedBy || '—'}</td>
                          <td className="px-4 py-4">
                            <Badge variant={getStatusVariant(record.status)}>
                              {formatStatus(record.status)}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 pr-5 text-right">
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setCurrentPayroll(record); setView('dashboard'); }}
                              className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 opacity-0 shadow-sm transition group-hover:opacity-100 hover:border-cyan-300 hover:text-cyan-700"
                            >
                              Chi tiết →
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Table footer with aggregates */}
              {filteredTable.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs text-slate-500">
                    Hiển thị <strong>{filteredTable.length}</strong> / {history.length} bản ghi
                  </span>
                  <div className="flex flex-wrap gap-4 text-xs">
                    <span className="text-slate-500">
                      Tổng thực lĩnh:{' '}
                      <strong className="text-emerald-700">
                        {formatCurrency(filteredTable.reduce((s, r) => s + (r.netPay || 0), 0))}
                      </strong>
                    </span>
                    <span className="text-slate-500">
                      Tổng khấu trừ:{' '}
                      <strong className="text-amber-700">
                        {formatCurrency(filteredTable.reduce((s, r) => s + (r.totalDeduction || 0), 0))}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
