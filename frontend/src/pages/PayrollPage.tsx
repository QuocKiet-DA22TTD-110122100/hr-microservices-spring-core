import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
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
import { Employee } from '@/types/employee';
import { PayrollResult, PayrollStatus } from '@/types/payroll';
import { PERMISSIONS } from '@/utils/permissions';

const statusLabels: Record<string, string> = {
  DRAFT: 'Ban nhap',
  APPROVED: 'Da duyet',
  PROCESSED: 'Da xu ly',
  FAILED: 'Loi',
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

const formatDate = (value?: string | null) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

const formatStatus = (status: PayrollStatus) => statusLabels[status] || status;

const getStatusVariant = (status: PayrollStatus) => statusVariants[status] || 'muted';

export const PayrollPage = () => {
  const { can } = usePermissions();
  const canManagePayroll = can(PERMISSIONS.PAYROLL_MANAGE);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  const [yearMonth, setYearMonth] = useState(currentYearMonth());
  const [currentPayroll, setCurrentPayroll] = useState<PayrollResult | null>(null);
  const [history, setHistory] = useState<PayrollResult[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedEmployee = useMemo(
    () => employees.find((employee) => employee.id === Number(selectedEmployeeId)),
    [employees, selectedEmployeeId]
  );

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await employeeApi.getAll({ page: 0, size: 100 });
      const employeeList = response.data.content;
      setEmployees(employeeList);

      setSelectedEmployeeId((current) => current || employeeList[0]?.id || '');
    } catch {
      setError('Khong the tai danh sach nhan vien. Vui long kiem tra hr-service va gateway.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPayroll = useCallback(async (employeeId: number) => {
    if (!employeeId) return;

    setError(null);
    try {
      const [current, payrollHistory] = await Promise.all([
        payrollApi.getCurrent(employeeId).catch(() => null),
        payrollApi.getHistory(employeeId).catch(() => []),
      ]);

      setCurrentPayroll(current);
      setHistory(payrollHistory);
    } catch {
      setError('Khong the tai du lieu bang luong cua nhan vien.');
    }
  }, []);

  useEffect(() => {
    void loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    if (selectedEmployeeId) {
      void refreshPayroll(Number(selectedEmployeeId));
    }
  }, [refreshPayroll, selectedEmployeeId]);

  const runAction = async (actionKey: string, action: () => Promise<void>) => {
    if (!canManagePayroll) {
      setError('Tai khoan hien tai chi co quyen xem bang luong.');
      return;
    }

    setActionLoading(actionKey);
    setError(null);
    setNotice(null);

    try {
      await action();
    } catch (actionError) {
      const message = actionError instanceof Error ? actionError.message : 'Thao tac payroll khong thanh cong.';
      setError(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateRun = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction('create-run', async () => {
      const run = await payrollApi.createRun({
        yearMonth,
        requestedBy: selectedEmployee?.username || 'frontend-demo',
        source: 'frontend',
      });
      setNotice(`Da tao ky luong ${run.yearMonth} (#${run.payrollRunId}).`);
    });
  };

  const handleCalculate = async () => {
    const employeeId = Number(selectedEmployeeId);
    if (!employeeId) {
      setError('Vui long chon nhan vien truoc khi tinh luong.');
      return;
    }

    await runAction('calculate', async () => {
      const result = await payrollApi.calculate(employeeId, yearMonth);
      setCurrentPayroll(result);
      setNotice(`Da tinh luong cho ${selectedEmployee?.name || `Employee #${employeeId}`}.`);
      await refreshPayroll(employeeId);
    });
  };

  const handleApprove = async () => {
    if (!currentPayroll) return;

    await runAction('approve', async () => {
      const response = await payrollApi.approve(currentPayroll.id);
      setNotice(response.message || 'Da phe duyet bang luong.');
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const handleReject = async () => {
    if (!currentPayroll) return;

    await runAction('reject', async () => {
      const response = await payrollApi.reject(currentPayroll.id, rejectReason.trim() || 'Can kiem tra lai du lieu luong');
      setNotice(response.message || 'Da tu choi bang luong.');
      setRejectReason('');
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const handleProcess = async () => {
    if (!currentPayroll) return;

    await runAction('process', async () => {
      const response = await payrollApi.process(currentPayroll.id);
      setNotice(response.message || 'Da xu ly chi tra luong.');
      await refreshPayroll(Number(selectedEmployeeId));
    });
  };

  const summaryCards = [
    {
      label: 'Luong gop',
      value: formatCurrency(currentPayroll?.grossPay),
      hint: 'Tong thu nhap truoc khau tru',
      icon: WalletCards,
      tone: 'bg-cyan-50 text-cyan-700',
    },
    {
      label: 'Tong khau tru',
      value: formatCurrency(currentPayroll?.totalDeduction),
      hint: 'Thue, bao hiem va khau tru khac',
      icon: Calculator,
      tone: 'bg-amber-50 text-amber-700',
    },
    {
      label: 'Thuc lanh',
      value: formatCurrency(currentPayroll?.netPay),
      hint: 'So tien sau khau tru',
      icon: CheckCircle2,
      tone: 'bg-emerald-50 text-emerald-700',
    },
    {
      label: 'Trang thai',
      value: currentPayroll ? formatStatus(currentPayroll.status) : 'Chua co',
      hint: currentPayroll ? `Payroll #${currentPayroll.id}` : 'Tinh luong de tao ban ghi',
      icon: ClipboardCheck,
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
    { key: 'periodStartDate', title: 'Ky luong', render: (_value, record) => `${formatDate(record.periodStartDate)} - ${formatDate(record.periodEndDate)}` },
    { key: 'grossPay', title: 'Luong gop', render: (value) => formatCurrency(value) },
    { key: 'totalDeduction', title: 'Khau tru', render: (value) => formatCurrency(value) },
    { key: 'netPay', title: 'Thuc lanh', render: (value) => formatCurrency(value) },
    {
      key: 'status',
      title: 'Trang thai',
      render: (value) => <Badge variant={getStatusVariant(value)}>{formatStatus(value)}</Badge>,
    },
  ];

  const canApprove = canManagePayroll && currentPayroll?.status === 'DRAFT';
  const canReject = canManagePayroll && currentPayroll?.status === 'APPROVED';
  const canProcess = canManagePayroll && currentPayroll?.status === 'APPROVED';

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={WalletCards}
          title="Quan ly bang luong"
          description="Demo luong toi thieu: tao ky luong, tinh luong, phe duyet, tu choi va xu ly chi tra."
          actions={
            <Button type="button" variant="outline" onClick={() => void refreshPayroll(Number(selectedEmployeeId))} disabled={!selectedEmployeeId}>
              <RefreshCw size={16} />
              Tai lai
            </Button>
          }
        />

        {error && (
          <Card className="border-rose-200">
            <EmptyState icon={AlertCircle} title="Co loi xay ra" description={error} action={<Button onClick={() => void loadEmployees()}>Thu lai</Button>} />
          </Card>
        )}

        {notice && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-3 text-sm font-medium text-emerald-800">
                <CheckCircle2 size={18} />
                {notice}
              </div>
            </CardContent>
          </Card>
        )}

        {!canManagePayroll && (
          <Card className="border-cyan-200 bg-cyan-50">
            <CardContent className="py-4">
              <p className="text-sm font-medium text-cyan-900">Tai khoan hien tai chi co quyen xem bang luong. Cac thao tac tao ky, tinh luong va phe duyet can PAYROLL_MANAGE.</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Thiet lap ky luong</CardTitle>
            <CardDescription>Chon nhan vien va thang luong de thao tac voi Payroll API.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px_auto_auto]" onSubmit={(event) => void handleCreateRun(event)}>
              <div>
                <label htmlFor="payroll-employee" className="mb-1 block text-sm font-medium text-slate-700">
                  Nhan vien
                </label>
                <select
                  id="payroll-employee"
                  value={selectedEmployeeId}
                  onChange={(event) => setSelectedEmployeeId(Number(event.target.value))}
                  className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  disabled={loading || employees.length === 0}
                >
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} #{employee.id}{employee.position ? ` - ${employee.position}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Thang luong"
                type="month"
                required
                value={yearMonth}
                onChange={(event) => setYearMonth(event.target.value)}
              />

              <div className="flex items-end">
                <Button type="submit" variant="outline" isLoading={actionLoading === 'create-run'} disabled={!canManagePayroll}>
                  <ClipboardCheck size={16} />
                  Tao ky
                </Button>
              </div>

              <div className="flex items-end">
                <Button type="button" onClick={() => void handleCalculate()} isLoading={actionLoading === 'calculate'} disabled={!canManagePayroll || !selectedEmployeeId}>
                  <Calculator size={16} />
                  Tinh luong
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="p-5">
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Bang luong hien tai</CardTitle>
                  <CardDescription>
                    {selectedEmployee ? `${selectedEmployee.name} #${selectedEmployee.id}` : 'Chua chon nhan vien'}
                  </CardDescription>
                </div>
                {currentPayroll && <Badge variant={getStatusVariant(currentPayroll.status)}>{formatStatus(currentPayroll.status)}</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {currentPayroll ? (
                <dl className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Ky luong</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatDate(currentPayroll.periodStartDate)} - {formatDate(currentPayroll.periodEndDate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Thue</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatCurrency(currentPayroll.taxDeduction)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Bao hiem</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatCurrency(currentPayroll.insuranceDeduction)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Khau tru khac</dt>
                    <dd className="mt-2 text-sm text-slate-700">{formatCurrency(currentPayroll.otherDeduction)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Nguoi duyet</dt>
                    <dd className="mt-2 text-sm text-slate-700">{currentPayroll.approvedBy || '--'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-slate-500">Nguoi xu ly</dt>
                    <dd className="mt-2 text-sm text-slate-700">{currentPayroll.processedBy || '--'}</dd>
                  </div>
                </dl>
              ) : (
                <EmptyState
                  icon={WalletCards}
                  title="Chua co bang luong"
                  description="Chon nhan vien va bam Tinh luong de tao ban ghi payroll DRAFT."
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow chi tra</CardTitle>
              <CardDescription>Thao tac theo trang thai DRAFT, APPROVED, PROCESSED.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button type="button" className="w-full justify-start" onClick={() => void handleApprove()} isLoading={actionLoading === 'approve'} disabled={!canApprove}>
                <CheckCircle2 size={16} />
                Phe duyet bang luong
              </Button>

              <Input
                label="Ly do tu choi"
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                placeholder="Vi du: Can kiem tra lai khau tru"
                disabled={!canManagePayroll}
              />
              <Button type="button" variant="outline" className="w-full justify-start" onClick={() => void handleReject()} isLoading={actionLoading === 'reject'} disabled={!canReject}>
                <RotateCcw size={16} />
                Tu choi ve DRAFT
              </Button>

              <Button type="button" variant="success" className="w-full justify-start" onClick={() => void handleProcess()} isLoading={actionLoading === 'process'} disabled={!canProcess}>
                <ClipboardCheck size={16} />
                Xu ly chi tra
              </Button>

              <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="mt-0.5 text-slate-500" />
                  <p>Bang luong PROCESSED duoc xem la da khoa de phuc vu audit va bao cao ban giao.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Lich su luong da xu ly</CardTitle>
            <CardDescription>Du lieu lay tu endpoint history cua nhan vien, dung lam bang chung workflow payroll.</CardDescription>
          </CardHeader>
          <Table columns={historyColumns} data={history} loading={loading} />
        </Card>
      </div>
    </MainLayout>
  );
};
