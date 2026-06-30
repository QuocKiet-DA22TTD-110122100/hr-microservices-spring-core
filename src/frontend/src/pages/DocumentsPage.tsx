import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Loader2,
  Trash2,
  Upload,
  UploadCloud,
} from 'lucide-react';
import { documentApi, DocumentMeta } from '@/api/document.api';
import { Button } from '@/components/UI/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { PageHeader } from '@/components/UI/PageHeader';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import { getApiErrorMessage } from '@/utils/error';

const ALLOWED_ACCEPT = '.doc,.docx,.xls,.xlsx,.pdf';
const MAX_MB = 20;

const sampleDocuments: DocumentMeta[] = [
  {
    id: -1,
    fileName: 'Báo cáo tiến độ dự án Q2.pdf',
    fileType: 'application/pdf',
    fileSize: 4.2 * 1024 * 1024,
    departmentId: 1,
    uploadedBy: 'Nguyễn Văn A',
    createdAt: '2026-06-18T09:20:00Z',
  },
  {
    id: -2,
    fileName: 'Kế hoạch ngân sách phòng ban_2026.xlsx',
    fileType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    fileSize: 1.8 * 1024 * 1024,
    departmentId: 1,
    uploadedBy: 'Trần Thị B',
    createdAt: '2026-06-20T14:10:00Z',
  },
  {
    id: -3,
    fileName: 'Tài liệu Onboarding Nhân sự mới.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 850 * 1024,
    departmentId: 1,
    uploadedBy: 'Hệ thống',
    createdAt: '2026-06-22T08:00:00Z',
  },
];

function getDocumentKind(doc: DocumentMeta) {
  const fileName = doc.fileName.toLowerCase();
  const fileType = doc.fileType.toLowerCase();

  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) return 'PDF';
  if (fileType.includes('sheet') || fileType.includes('excel') || fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) return 'Excel';
  if (fileType.includes('word') || fileName.endsWith('.doc') || fileName.endsWith('.docx')) return 'Word';
  return 'File';
}

function fileIcon(doc: DocumentMeta) {
  const baseClass = 'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border shadow-sm';
  const kind = getDocumentKind(doc);

  if (kind === 'Excel') {
    return (
      <div className={cn(baseClass, 'border-emerald-100 bg-emerald-50 text-emerald-700')}>
        <FileSpreadsheet size={20} aria-hidden="true" />
      </div>
    );
  }

  if (kind === 'PDF') {
    return (
      <div className={cn(baseClass, 'border-rose-100 bg-rose-50 text-rose-700')}>
        <FileText size={20} aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className={cn(baseClass, 'border-blue-100 bg-blue-50 text-blue-700')}>
      <FileText size={20} aria-hidden="true" />
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export const DocumentsPage = () => {
  const { user } = useAuthStore();
  const { addNotification } = useUIStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [docs, setDocs] = useState<DocumentMeta[]>(sampleDocuments);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [downloading, setDownloading] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  const isAdmin = user?.roles?.some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN');
  const currentUsername = user?.username;

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await documentApi.list();
      setDocs(res.data.length > 0 ? res.data : sampleDocuments);
    } catch (err) {
      addNotification({ type: 'error', message: getApiErrorMessage(err, 'Không thể tải danh sách tài liệu.') });
      setDocs(sampleDocuments);
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void fetchDocs();
  }, [fetchDocs]);

  const uploadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_MB * 1024 * 1024) {
        addNotification({ type: 'error', message: `File vượt quá ${MAX_MB} MB.` });
        return;
      }

      setUploading(true);
      try {
        const res = await documentApi.upload(file);
        setDocs((prev) => [res.data, ...prev.filter((doc) => doc.id > 0)]);
        addNotification({ type: 'success', message: `Đã tải lên "${file.name}" thành công.` });
      } catch (err) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi tải lên file.') });
      } finally {
        setUploading(false);
      }
    },
    [addNotification]
  );

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) await uploadFile(file);
      event.target.value = '';
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    async (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setDragActive(false);

      const file = event.dataTransfer.files?.[0];
      if (file) await uploadFile(file);
    },
    [uploadFile]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setDragActive(false);
  }, []);

  const handlePreview = useCallback(
    (doc: DocumentMeta) => {
      addNotification({ type: 'info', message: `Chuẩn bị mở xem trước: ${doc.fileName}` });
    },
    [addNotification]
  );

  const handleDownload = useCallback(
    async (doc: DocumentMeta) => {
      if (doc.id < 0) {
        addNotification({ type: 'info', message: `File mẫu "${doc.fileName}" chưa có nội dung tải về.` });
        return;
      }

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
        if (doc.id > 0) {
          await documentApi.delete(doc.id);
        }
        setDocs((prev) => prev.filter((item) => item.id !== doc.id));
        addNotification({ type: 'success', message: 'Đã xóa tài liệu.' });
      } catch (err) {
        addNotification({ type: 'error', message: getApiErrorMessage(err, 'Lỗi khi xóa tài liệu.') });
      } finally {
        setDeleting(null);
      }
    },
    [addNotification]
  );

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        icon={FolderOpen}
        title="Tài liệu phòng ban"
        description="Quản lý và chia sẻ tài liệu Word, Excel, PDF với các thành viên trong cùng phòng ban."
        actions={
          <Link to="/">
            <Button variant="outline" pill>
              <ArrowLeft size={16} />
              Quay lại
            </Button>
          </Link>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept={ALLOWED_ACCEPT}
          className="sr-only"
          aria-label="Chọn file tài liệu"
          onChange={handleFileChange}
        />

        <button
          type="button"
          className={cn(
            'flex min-h-[190px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-5 py-7 text-center',
            'transition-[border-color,background-color,color] duration-200',
            'bg-slate-50/60 hover:border-blue-300 hover:bg-blue-50/40 hover:text-blue-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            dragActive ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]' : 'border-slate-200 text-slate-600'
          )}
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100">
            {uploading ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={28} />}
          </span>
          <span className="mt-3 text-base font-semibold text-slate-900">
            {uploading ? 'Đang tải lên tài liệu...' : 'Kéo thả file hoặc nhấn để chọn'}
          </span>
          <span className="mt-1 text-sm text-slate-600">Word, Excel, PDF — tối đa {MAX_MB} MB</span>
        </button>

        <p className="mt-3 max-w-prose text-xs text-slate-600">
          Chỉ nhận .doc, .docx, .xls, .xlsx, .pdf. Tài liệu chỉ hiển thị với thành viên cùng phòng ban.
        </p>
      </section>

      <Card>
        <CardHeader className="border-b border-slate-100">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Danh sách tài liệu</CardTitle>
              <CardDescription>{docs.length} tài liệu đang hiển thị trong phòng ban.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload size={15} />
              Tải lên
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-16 text-slate-600">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Đang tải...</span>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {docs.map((doc) => {
                const canDelete = doc.id < 0 || isAdmin || doc.uploadedBy === currentUsername;
                const isDownloading = downloading === doc.id;
                const isDeleting = deleting === doc.id;

                return (
                  <div
                    key={doc.id}
                    className="grid gap-3 px-6 py-4 transition-colors hover:bg-slate-50/80 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                  >
                    <div className="flex items-center gap-3">
                      {fileIcon(doc)}
                      <div className="min-w-0 sm:hidden">
                        <p className="font-display truncate text-sm font-semibold text-slate-900">{doc.fileName}</p>
                        <p className="mt-0.5 text-xs text-slate-600">
                          {getDocumentKind(doc)} · {formatBytes(doc.fileSize)}
                        </p>
                      </div>
                    </div>

                    <div className="hidden min-w-0 sm:block">
                      <p className="truncate text-sm font-semibold text-slate-900">{doc.fileName}</p>
                      <p className="mt-0.5 text-xs text-slate-600">
                        {getDocumentKind(doc)} · {formatBytes(doc.fileSize)} · Người đăng:{' '}
                        <span className="font-medium text-slate-800">{doc.uploadedBy}</span> · {formatDate(doc.createdAt)}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreview(doc)}
                        title="Xem trước"
                        aria-label={`Xem trước ${doc.fileName}`}
                      >
                        <Eye size={14} />
                        <span className="hidden lg:inline">Xem trước</span>
                      </Button>

                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                        disabled={isDownloading}
                        title="Tải về"
                        aria-label={`Tải về ${doc.fileName}`}
                      >
                        {isDownloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                        <span className="hidden lg:inline">Tải về</span>
                      </Button>

                      {canDelete && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(doc)}
                          disabled={isDeleting}
                          title="Xóa"
                          aria-label={`Xóa ${doc.fileName}`}
                        >
                          {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
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
    </div>
  );
};
