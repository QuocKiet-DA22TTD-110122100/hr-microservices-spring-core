import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Edit2, Plus, Search, Trash2, Users } from 'lucide-react';
import { departmentApi } from '@/api/department.api';
import { Button } from '@/components/UI/Button';
import { ConfirmModal } from '@/components/UI/ConfirmModal';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { RowActions } from '@/components/UI/RowActions';
import { type Column } from '@/components/UI/Table';
import { useUIStore } from '@/store/uiStore';
import { Department } from '@/types/department';
import { getApiErrorMessage } from '@/utils/error';

type DepartmentRow = Department & {
  actions: string;
};

export const DepartmentListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [confirmTargetId, setConfirmTargetId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const confirmTarget = useMemo(
    () => departments.find((d) => d.id === confirmTargetId) ?? null,
    [departments, confirmTargetId]
  );

  const fetchDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data.content);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách phòng ban.'),
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleDeleteConfirm = useCallback(async () => {
    if (confirmTargetId === null) return;
    setDeletingId(confirmTargetId);
    try {
      await departmentApi.delete(confirmTargetId);
      setDepartments((current) => current.filter((d) => d.id !== confirmTargetId));
      setConfirmTargetId(null);
      addNotification({ type: 'success', message: 'Xóa phòng ban thành công.' });
    } catch (error: unknown) {
      addNotification({ type: 'error', message: getApiErrorMessage(error, 'Lỗi khi xóa phòng ban.') });
    } finally {
      setDeletingId(null);
    }
  }, [confirmTargetId, addNotification]);

  const filteredDepartments = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return departments;

    return departments.filter((department) =>
      [department.code, department.name, department.organizationUnitName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [departments, searchKeyword]);

  const tableData = useMemo<DepartmentRow[]>(
    () => filteredDepartments.map((department) => ({ ...department, actions: 'actions' })),
    [filteredDepartments]
  );

  const columns = useMemo<Column<DepartmentRow>[]>(
    () => [
      { key: 'code', title: 'Mã phòng ban' },
      { key: 'name', title: 'Tên phòng ban' },

      {
        key: 'organizationUnitName',
        title: 'Tổ chức',
        render: (value: DepartmentRow[keyof DepartmentRow]): ReactNode => String(value || '--'),
      },
      {
        key: 'employeeCount',
        title: 'Số nhân viên',
        render: (value: DepartmentRow[keyof DepartmentRow]): ReactNode => (
          <span className="inline-flex items-center gap-2 rounded-md bg-cyan-50 px-2 py-1 text-sm font-medium text-cyan-700">
            <Users size={15} aria-hidden="true" />
            {Number(value ?? 0)}
          </span>
        ),
      },
      {
        key: 'actions',
        title: 'Thao tác',
        render: (_: DepartmentRow[keyof DepartmentRow], record: DepartmentRow): ReactNode => (
          <RowActions
            label="Thao tác phòng ban"
            actions={[
              {
                icon: <Edit2 size={16} />,
                label: 'Chỉnh sửa',
                onClick: () => navigate(`/departments/edit/${record.id}`),
              },
              {
                icon: <Trash2 size={16} />,
                label: 'Xóa',
                disabled: deletingId === record.id,
                onClick: () => setConfirmTargetId(record.id),
              },
            ]}
          />
        ),
      },
    ],
    [deletingId, navigate]
  );

  return (
    <>
    <DataListPage
      icon={Building2}
      title="Quản lý phòng ban"
      description="Theo dõi danh sách phòng ban, đơn vị tổ chức và số nhân viên đang thuộc từng phòng."
      actions={
        <Button onClick={() => navigate('/departments/add')}>
          <Plus size={18} />
          Thêm phòng ban
        </Button>
      }
      filters={
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            placeholder="Tìm theo mã, tên phòng ban hoặc tổ chức..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            className="pl-10"
          />
        </div>
      }
      columns={columns}
      data={tableData}
      loading={loading}
      onRowClick={(record) => navigate(`/departments/edit/${record.id}`)}
    />

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
    </>
  );
};
