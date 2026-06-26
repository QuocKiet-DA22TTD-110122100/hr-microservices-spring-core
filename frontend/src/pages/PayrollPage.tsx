import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Calculator,
  CheckCircle2,
  ClipboardCheck,
  RefreshCw,
  RotateCcw,
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
import { Table, Column } from '@/components/UI/Table';
import { usePermissions } from '@/hooks/usePermissions';
import { useUIStore } from '@/store/uiStore';
import { Employee } from '@/types/employee';
import { PayrollResult, PayrollStatus } from '@/types/payroll';
import { PERMISSIONS } from '@/utils/permissions';

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

const currentYearMonth = () => new Date().toISOString().slice(0, 7);

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '--';

const formatStatus = (status: PayrollStatus) => statusLabels[status] || status;
const getStatusVariant = (status: PayrollStatus) => statusVariants[status] || 'muted';

export const PayrollPage = () => {
  const { can } = usePermissions();
  const { addNotification } = useUIStore();
  const canManagePayroll = can(PERMISSIONS.PAYROLL_MANAGE);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [currentPayroll, setCurrentPayroll] = useState<PayrollResult | null>(null);
  const [history, setHistory] = useState<PayrollResult[]>([]);
  const [rejectReason, setRejectReason] = useState('');
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
      addNotification({ type: 'error', message: 'Không thể tải danh sách nhân viên. Kiểm tra hr-service và gateway.' });
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
    if (!employeeId) {
      addNotification({ type: 'error', message: 'Vui lòng chọn nhân viên trước khi tính lương.' });
      return;
    }
    await runAction('calculate', async () => {
      const result = await payrollApi.calculate(employeeId, yearMonth);
      setCurrentPayroll(result);
      addNotification({ type: 'success', message: `Đã tính lương cho ${selectedEmployee?.name || `#${employeeId}`}.` });
      await refreshPayroll(employeeId);
    });
  };

  const handleApprove = async () => {
    if (!currentPayroll) return;
    await runAction('approve', async () => {
      const res = await payrollApi.approve(currentPayroll.id);
      addNotification({ type: 'success', message: res.message || 'Đã phê duyệt bảng lương.' });
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const handleReject = async () => {
    if (!currentPayroll) return;
    await runAction('reject', async () => {
      const res = await payrollApi.reject(currentPayroll.id, rejectReason.trim() || 'Cần kiểm tra lại dữ liệu lương');
      addNotification({ type: 'success', message: res.message || 'Đã từ chối bảng lương.' });
      setRejectReason('');
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const handleProcess = async () => {
    if (!currentPayroll) return;
    await runAction('process', async () => {
      const res = await payrollApi.process(currentPayroll.id);
      addNotification({ type: 'success', message: res.message || 'Đã xử lý chi trả lương.' });
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const summaryCards = [
    {
      label: 'Lương gộp',
      value: formatCurrency(currentPayroll?.grossPay),
      hint: 'Tổng thu nhập trước khấu trừ',
      icon: WalletCards,
      gradient: 'from-cyan-600 to-teal-500',
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Tổng khấu trừ',
      value: formatCurrency(currentPayroll?.totalDeduction),
      hint: 'Thuế, bảo hiểm và khấu trừ khác',
      icon: Calculator,
      gradient: 'from-amber-500 to-orange-400',
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Thực lĩnh',
      value: formatCurrency(currentPayroll?.netPay),
      hint: 'Số tiền sau khấu trừ',
      icon: CheckCircle2,
      gradient: 'from-emerald-600 to-green-500',
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Trạng thái',
      value: currentPayroll ? formatStatus(currentPayroll.status) : 'Chưa có',
      hint: currentPayroll ? `Payroll #${currentPayroll.id}` : 'Tính lương để tạo bản ghi',
      icon: ClipboardCheck,
      gradient: 'from-slate-600 to-slate-500',
      tone: 'bg-slate-100 text-slate-700',
    },
  ];

  const historyColumns: Column<PayrollResult>[] = [
    {
      key: 'id',
      title: 'Payroll',
      render: (value, record) => (
        <button
          type="button"
          onClick={() => setCurrentPayroll(record)}
          className="font-semibold text-cyan-700 hover:text-cyan-900"
        >
          #{value}
        </button>
      ),
    },
    {
      key: 'periodStartDate',
      title: 'Kỳ lương',
      render: (_v, r) => `${formatDate(r.periodStartDate)} - ${formatDate(r.periodEndDate)}`,
    },
    { key: 'grossPay', title: 'Lương gộp', render: (v) => formatCurrency(v) },
    { key: 'totalDeduction', title: 'Khấu trừ', render: (v) => formatCurrency(v) },
    { key: 'netPay', title: 'Thực lĩnh', render: (v) => formatCurrency(v) },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (v) => <Badge variant={getStatusVariant(v)}>{formatStatus(v)}</Badge>,
    },
  ];

  const canApprove = canManagePayroll && currentPayroll?.status === 'DRAFT';
  const canReject  = canManagePayroll && currentPayroll?.status === 'APPROVED';
  const canProcess = canManagePayroll && currentPayroll?.status === 'APPROVED';

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={WalletCards}
          title="Quản lý bảng lương"
          description="Tạo kỳ lương, tính lương, phê duyệt và xử lý chi trả cho nhân viên."
          actions={
            <Button
              type="button"
              variant="outline"
              onClick={() => void refreshPayroll(Number(selectedEmployeeId))}
              disabled={!selectedEmployeeId}
            >
              <RefreshCw size={16} />
              Tải lại
            </Button>
          }
        />

        {!canManagePayroll && (
          <Card className="border-cyan-200 bg-cyan-50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-cyan-900">
                Tài khoản hiện tại chỉ có quyền xem bảng lương. Cần <strong>PAYROLL_MANAGE</strong> để tạo kỳ, tính lương và phê duyệt.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Setup form */}
        <Card>
          <CardHeader>
            <CardTitle>Thiết lập kỳ lương</CardTitle>
            <CardDescription>Chọn nhân viên và tháng lương để thao tác với Payroll API.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto]"
              onSubmit={(e) => void handleCreateRun(e)}
            >
              <div>
                <label htmlFor="payroll-employee" className="mb-1 block text-sm font-medium text-slate-700">
                  Nhân viên
                </label>
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

              <Input
                label="Tháng lương"
                type="month"
                required
                value={yearMonth}
                onChange={(e) => setYearMonth(e.target.value)}
              />

              <div className="flex items-end">
                <Button
                  type="submit"
                  variant="outline"
                  isLoading={actionLoading === 'create-run'}
                  disabled={!canManagePayroll}
                >
                  <ClipboardCheck size={16} />
                  Tạo kỳ
                </Button>
              </div>

              <div className="flex items-end">
                <Button
                  type="button"
                  onClick={() => void handleCalculate()}
                  isLoading={actionLoading === 'calculate'}
                  disabled={!canManagePayroll || !selectedEmployeeId}
                >
                  <Calculator size={16} />
                  Tính lương
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Stats bar */}
        <section className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="relative overflow-hidden p-5">
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${card.gradient}`} />
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-500">{card.label}</p>
                  <p className="mt-1 text-xl font-semibold text-slate-900">{card.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{card.hint}</p>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md ${card.tone}`}>
                  <card.icon size={22} />
                </div>
              </div>
            </Card>
          ))}
        </section>

        {/* Detail + Workflow */}
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Bảng lương hiện tại</CardTitle>
                  <CardDescription>
                    {selectedEmployee
                      ? `${selectedEmployee.name} #${selectedEmployee.id}`
                      : 'Chưa chọn nhân viên'}
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
                <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[
                    { label: 'Kỳ lương', value: `${formatDate(currentPayroll.periodStartDate)} - ${formatDate(currentPayroll.periodEndDate)}` },
                    { label: 'Thuế',         value: formatCurrency(currentPayroll.taxDeduction) },
                    { label: 'Bảo hiểm',     value: formatCurrency(currentPayroll.insuranceDeduction) },
                    { label: 'Khấu trừ khác',value: formatCurrency(currentPayroll.otherDeduction) },
                    { label: 'Người duyệt',  value: currentPayroll.approvedBy || '--' },
                    { label: 'Người xử lý',  value: currentPayroll.processedBy || '--' },
                  ].map((item) => (
                    <div key={item.label}>
                      <dt className="text-xs font-semibold uppercase text-slate-500">{item.label}</dt>
                      <dd className="mt-2 text-sm text-slate-700">{item.value}</dd>
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

          <Card>
            <CardHeader>
              <CardTitle>Workflow chi trả</CardTitle>
              <CardDescription>Thao tác theo trạng thái DRAFT → APPROVED → PROCESSED.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                type="button"
                className="w-full justify-start"
                onClick={() => void handleApprove()}
                isLoading={actionLoading === 'approve'}
                disabled={!canApprove}
              >
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
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => void handleReject()}
                isLoading={actionLoading === 'reject'}
                disabled={!canReject}
              >
                <RotateCcw size={16} />
                Từ chối về DRAFT
              </Button>

              <Button
                type="button"
                variant="success"
                className="w-full justify-start"
                onClick={() => void handleProcess()}
                isLoading={actionLoading === 'process'}
                disabled={!canProcess}
              >
                <ClipboardCheck size={16} />
                Xử lý chi trả
              </Button>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="mt-0.5 shrink-0 text-slate-500" />
                  <p>Bảng lương PROCESSED được coi là đã khóa để phục vụ audit và báo cáo bàn giao.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* History table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Lịch sử bảng lương</CardTitle>
            <CardDescription>Dữ liệu từ endpoint history của nhân viên — dùng làm bằng chứng workflow payroll.</CardDescription>
          </CardHeader>
          <Table columns={historyColumns} data={history} loading={loading} />
        </Card>
      </div>
    </MainLayout>
  );
};
