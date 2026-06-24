import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { documentApi, DocumentMeta } from '@/api/document.api';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { getApiErrorMessage } from '@/utils/error';

const ALLOWED_ACCEPT = '.doc,.docx,.xls,.xlsx,.pdf';
const MAX_MB = 20;

function fileIcon(fileType: string) {
  if (fileType?.includes('sheet') || fileType?.includes('excel')) {
    return <FileSpreadsheet size={18} className="text-emerald-600" aria-hidden="true" />;
  }
  if (fileType?.includes('pdf')) {
    return <FileText size={18} className="text-rose-500" aria-hidden="true" />;
  }
  return <FileText size={18} className="text-blue-500" aria-hidden="true" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const DocumentsPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentMeta[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const isAdmin = user?.roles?.some(
    (r) => r === 'ADMIN' || r === 'ROLE_ADMIN'
  );

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentApi.list();
      setDocs(res.data);
    } catch (err) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Không thể tải danh sách tài liệu.') });
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > MAX_MB * 1024 * 1024) {
        addNotification({ type: 'error', message: `File vượt quá ${MAX_MB} MB.` });
        e.target.value = '';
        return;
      }

      setUploading(true);
      try {
        const res = await documentApi.upload(file);
        setDocs((prev) => [res.data, ...prev]);
        addNotification({ type: 'success', message: `Đã tải lên "${file.name}" thành công.` });
      } catch (err) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi tải lên file.') });
      } finally {
        setUploading(false);
        e.target.value = '';
      }
    },
    [addNotification]
  );

  const handleDownload = useCallback(
    async (doc: DocumentMeta) => {
      setDownloading(doc.id);
      try {
        await documentApi.download(doc.id, doc.fileName);
      } catch (err) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi tải file.') });
      } finally {
        setDownloading(null);
      }
    },
    [addNotification]
  );

  const handleDelete = useCallback(
    async (doc: DocumentMeta) => {
      if (!confirm(`Xóa tài liệu "${doc.fileName}"?`)) return;
      setDeleting(doc.id);
      try {
        await documentApi.delete(doc.id);
        setDocs((prev) => prev.filter((d) => d.id !== doc.id));
        addNotification({ type: 'success', message: 'Đã xóa tài liệu.' });
      } catch (err) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi xóa tài liệu.') });
      } finally {
        setDeleting(null);
      }
    },
    [addNotification]
  );

  const currentUsername = user?.username;

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        icon={FolderOpen}
        title="Tài liệu phòng ban"
        description="Upload và chia sẻ tài liệu Word, Excel, PDF với các thành viên trong cùng phòng ban."
        actions={
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={ALLOWED_ACCEPT}
              className="sr-only"
              aria-label="Chọn file"
              onChange={handleFileChange}
            />
            <Button
              variant="dark"
              pill
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <><Loader2 size={16} className="animate-spin" />Đang tải lên...</>
              ) : (
                <><Upload size={16} />Tải lên tài liệu</>
              )}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>
            Danh sách tài liệu
            <span className="ml-2 text-base font-normal text-slate-500">
              ({docs.length} tài liệu)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <FolderOpen size={40} strokeWidth={1.4} />
              <p className="text-sm font-medium">Chưa có tài liệu nào.</p>
              <p className="text-xs text-slate-400">
                Nhấn <strong>"Tải lên tài liệu"</strong> để thêm file đầu tiên.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => {
                const canDelete = isAdmin || doc.uploadedBy === currentUsername;
                const isDownloading = downloading === doc.id;
                const isDeleting = deleting === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50"
                  >
                    {/* Icon */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white shadow-sm">
                      {fileIcon(doc.fileType)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {doc.fileName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {formatBytes(doc.fileSize)} · Tải lên bởi{' '}
                        <span className="font-medium text-slate-700">{doc.uploadedBy}</span>
                        {' · '}
                        {formatDate(doc.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button
                        variant="secondary"
                        size="sm"
                        pill
                        onClick={() => handleDownload(doc)}
                        disabled={isDownloading}
                        title="Tải về"
                        aria-label={`Tải về ${doc.fileName}`}
                      >
                        {isDownloading ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Download size={14} />
                        )}
                        <span className="hidden sm:inline">Tải về</span>
                      </Button>

                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          pill
                          onClick={() => handleDelete(doc)}
                          disabled={isDeleting}
                          title="Xóa"
                          aria-label={`Xóa ${doc.fileName}`}
                        >
                          {isDeleting ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-center text-xs text-slate-400">
        Chỉ nhận file <strong>.doc, .docx, .xls, .xlsx, .pdf</strong> · Tối đa {MAX_MB} MB mỗi file.
        Tài liệu chỉ hiển thị với thành viên cùng phòng ban.
      </p>
    </div>
  );
};
