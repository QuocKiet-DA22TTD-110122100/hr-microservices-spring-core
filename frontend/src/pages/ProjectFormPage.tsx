import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, FolderKanban, Save } from 'lucide-react';
import { projectApi } from '@/api/project.api';
import { Button } from '@/components/UI/Button';
import { Card, CardContent } from '@/components/UI/Card';
import { EmptyState } from '@/components/UI/EmptyState';
import { Input } from '@/components/UI/Input';
import { MainLayout } from '@/components/Layout/MainLayout';
import { PageHeader } from '@/components/UI/PageHeader';
import { ProjectRequest, ProjectStatus } from '@/types/project';

const statusLabels: Record<ProjectStatus, string> = {
  ACTIVE: 'Đang chạy',
  PAUSED: 'Tạm dừng',
  COMPLETED: 'Hoàn tất',
  ARCHIVED: 'Lưu trữ',
};

const emptyForm: ProjectRequest = {
  name: '',
  description: '',
  status: 'ACTIVE',
  leadId: 1,
};

export const ProjectFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;
  const isEditing = projectId !== null;
  const [form, setForm] = useState<ProjectRequest>(emptyForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId) return;

    const loadProject = async () => {
      setLoading(true);
      setError(null);

      try {
        const project = await projectApi.getById(projectId);
        setForm({
          name: project.name,
          description: project.description || '',
          status: project.status,
          leadId: project.leadId,
        });
      } catch {
        setError('Không thể tải dữ liệu dự án để chỉnh sửa.');
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
  }, [projectId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const payload: ProjectRequest = {
        ...form,
        name: form.name.trim(),
        description: form.description?.trim() || null,
        leadId: Number(form.leadId),
      };

      const saved = projectId ? await projectApi.update(projectId, payload) : await projectApi.create(payload);
      navigate(`/projects/${saved.id}`);
    } catch {
      setError('Không thể lưu dự án. Vui lòng kiểm tra dữ liệu và thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-5">
        <PageHeader
          icon={FolderKanban}
          title={isEditing ? 'Sửa dự án' : 'Tạo dự án'}
          description="Form sử dụng contract ProjectRequest: name, description, status, leadId."
          actions={
            <Link to="/projects">
              <Button variant="outline">Hủy</Button>
            </Link>
          }
        />

        {error && (
          <Card className="border-rose-200">
            <EmptyState icon={AlertCircle} title="Có lỗi xảy ra" description={error} />
          </Card>
        )}

        <Card>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <div className="h-10 animate-pulse rounded bg-slate-100" />
                <div className="h-28 animate-pulse rounded bg-slate-100" />
              </div>
            ) : (
              <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
                <Input
                  label="Tên dự án"
                  required
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                />

                <div>
                  <label htmlFor="project-description" className="mb-1 block text-sm font-medium text-slate-700">
                    Mô tả
                  </label>
                  <textarea
                    id="project-description"
                    value={form.description || ''}
                    onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                    rows={4}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label htmlFor="project-status" className="mb-1 block text-sm font-medium text-slate-700">
                      Trạng thái
                    </label>
                    <select
                      id="project-status"
                      value={form.status || 'ACTIVE'}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ProjectStatus }))}
                      className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label="Lead ID"
                    required
                    type="number"
                    min={1}
                    value={form.leadId}
                    onChange={(event) => setForm((current) => ({ ...current, leadId: Number(event.target.value) }))}
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" isLoading={saving}>
                    <Save size={16} />
                    Lưu dự án
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
