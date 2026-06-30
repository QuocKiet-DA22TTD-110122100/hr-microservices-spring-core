import { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Layers, Plus, Search, Trash2 } from 'lucide-react';
import { organizationApi } from '@/api/organization.api';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { DataListPage } from '@/components/UI/DataListPage';
import { Input } from '@/components/UI/Input';
import { RowActions } from '@/components/UI/RowActions';
import { type Column } from '@/components/UI/Table';
import { useUIStore } from '@/store/uiStore';
import { OrganizationUnitTreeNode } from '@/types/organization';
import { getApiErrorMessage } from '@/utils/error';

type OrganizationRow = OrganizationUnitTreeNode & {
  parentNameText: string;
  childCount: number;
  actions: string;
};

const flattenOrganizationTree = (
  nodes: OrganizationUnitTreeNode[],
  parentNameText = '--'
): OrganizationRow[] =>
  nodes.flatMap((node) => {
    const row: OrganizationRow = {
      ...node,
      parentNameText,
      childCount: node.children.length,
      actions: 'actions',
    };

    return [row, ...flattenOrganizationTree(node.children, node.name)];
  });

export const OrganizationListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [treeData, setTreeData] = useState<OrganizationUnitTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');

  const fetchOrganizations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await organizationApi.getTree();
      setTreeData(response.data);
    } catch (error: unknown) {
      addNotification({
        type: 'error',
        message: getApiErrorMessage(error, 'Lỗi khi tải danh sách tổ chức.'),
      });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  const handleDelete = useCallback(
    async (id: number, name: string) => {
      if (!globalThis.confirm(`Bạn có chắc chắn muốn xóa tổ chức "${name}"?`)) return;

      try {
        await organizationApi.delete(id);
        addNotification({
          type: 'success',
          message: 'Xóa tổ chức thành công.',
        });
        fetchOrganizations();
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          message: getApiErrorMessage(error, 'Lỗi khi xóa tổ chức.'),
        });
      }
    },
    [addNotification, fetchOrganizations]
  );

  const tableData = useMemo(() => flattenOrganizationTree(treeData), [treeData]);

  const filteredData = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    if (!keyword) return tableData;

    return tableData.filter((node) =>
      [node.name, node.code, node.level, node.parentNameText]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword))
    );
  }, [searchKeyword, tableData]);

  const columns = useMemo<Column<OrganizationRow>[]>(
    () => [
      { key: 'code', title: 'Mã tổ chức', render: (value): ReactNode => String(value || '--') },
      { key: 'name', title: 'Tên tổ chức' },
      {
        key: 'level',
        title: 'Cấp',
        render: (value): ReactNode => <Badge variant="info">{String(value)}</Badge>,
      },
      { key: 'parentNameText', title: 'Tổ chức cha' },
      { key: 'childCount', title: 'Đơn vị con' },
      {
        key: 'actions',
        title: 'Thao tác',
        render: (_: OrganizationRow[keyof OrganizationRow], record: OrganizationRow): ReactNode => (
          <RowActions
            label="Thao tác tổ chức"
            actions={[
              {
                icon: <Edit2 size={16} />,
                label: 'Chỉnh sửa',
                onClick: () => navigate(`/organizations/edit/${record.id}`),
              },
              {
                icon: <Trash2 size={16} />,
                label: 'Xóa',
                onClick: () => handleDelete(record.id, record.name),
              },
            ]}
          />
        ),
      },
    ],
    [handleDelete, navigate]
  );

  return (
    <DataListPage
      icon={Layers}
      title="Quản lý tổ chức"
      description="Quản lý cấu trúc tổ chức phân cấp từ công ty đến phòng ban."
      actions={
        <Button onClick={() => navigate('/organizations/add')}>
          <Plus size={18} />
          Thêm tổ chức
        </Button>
      }
      filters={
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <Input
            placeholder="Tìm theo tên, mã, cấp hoặc tổ chức cha..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
            className="pl-10"
          />
        </div>
      }
      columns={columns}
      data={filteredData}
      loading={loading}
      onRowClick={(record) => navigate(`/organizations/edit/${record.id}`)}
    />
  );
};
