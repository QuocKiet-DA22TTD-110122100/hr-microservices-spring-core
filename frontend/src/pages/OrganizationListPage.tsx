import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Button } from '@/components/UI/Button';
import { organizationApi } from '@/api/organization.api';
import { OrganizationUnitTreeNode } from '@/types/organization';
import { Plus, ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';

interface TreeNodeProps {
  node: OrganizationUnitTreeNode;
  level?: number;
  expandedNodes: Set<number>;
  onToggleExpand: (id: number) => void;
  onDelete: (id: number, name: string) => void;
  onEdit: (id: number) => void;
}

const TreeNode = ({
  node,
  level = 0,
  expandedNodes,
  onToggleExpand,
  onDelete,
  onEdit,
}: TreeNodeProps) => {
  const isExpanded = expandedNodes.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div key={node.id}>
      <div
        className="flex items-center justify-between p-3 bg-white border rounded-lg mb-2"
        style={{ marginLeft: `${level * 20}px` }}
      >
        <div className="flex items-center gap-3 flex-1">
          {hasChildren ? (
            <button
              onClick={() => onToggleExpand(node.id)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={18} className="text-gray-600" />
              ) : (
                <ChevronRight size={18} className="text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          <div>
            <div className="font-medium text-gray-800">{node.name}</div>
            <div className="text-xs text-gray-500">
              {node.code && <span>{node.code} • </span>}
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                {node.level}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(node.id)}
            className="p-2 hover:bg-blue-50 text-blue-600 rounded transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 size={18} />
          </button>
          <button
            onClick={() => onDelete(node.id, node.name)}
            className="p-2 hover:bg-red-50 text-red-600 rounded transition-colors"
            title="Xóa"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const OrganizationListPage = () => {
  const navigate = useNavigate();
  const { addNotification } = useUIStore();
  const [treeData, setTreeData] = useState<OrganizationUnitTreeNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(new Set());

  const fetchOrganizations = async () => {
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
  };

  useEffect(() => {
    fetchOrganizations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDelete = async (id: number, name: string) => {
    if (globalThis.confirm(`Bạn có chắc chắn muốn xóa tổ chức "${name}"?`)) {
      try {
        await organizationApi.delete(id);
        addNotification({
          type: 'success',
          message: 'Xóa tổ chức thành công!',
        });
        fetchOrganizations();
      } catch (error: unknown) {
        addNotification({
          type: 'error',
          message: getApiErrorMessage(error, 'Lỗi khi xóa tổ chức.'),
        });
      }
    }
  };

  const handleEdit = (id: number) => {
    navigate(`/organizations/edit/${id}`);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      );
    }

    if (treeData.length === 0) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="text-gray-500">Không có dữ liệu tổ chức</div>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            expandedNodes={expandedNodes}
            onToggleExpand={toggleExpand}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        ))}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800">Quản lý Tổ chức</h1>
            <p className="text-gray-600 text-sm mt-1">Cấu trúc tổ chức phân cấp</p>
          </div>
          <Button onClick={() => navigate('/organizations/add')}>
            <Plus size={18} className="mr-2" />
            Thêm tổ chức
          </Button>
        </div>

        <div className="bg-white rounded-lg border shadow-sm p-6">
          {renderContent()}
        </div>
      </div>
    </MainLayout>
  );
};
