import { AlertCircle, CheckCircle2, ClipboardCheck, KeyRound, LucideIcon, User, XCircle } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { cn } from '@/utils/cn';
import { WorkspaceItem } from './types';
import { workspaceStatusStyles } from './workspaceStyles';

interface WorkspaceActionPanelProps {
  selectedItem?: WorkspaceItem;
  processNotes: string[];
  onApprove?: (item: WorkspaceItem) => void;
  onReject?: (item: WorkspaceItem) => void;
}

const noteIcons: LucideIcon[] = [CheckCircle2, AlertCircle, ClipboardCheck, KeyRound, User];

export const WorkspaceActionPanel = ({ selectedItem, processNotes, onApprove, onReject }: WorkspaceActionPanelProps) => (
  <aside className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Mục đang chọn</CardTitle>
        <CardDescription>Ngữ cảnh xử lý nhanh.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedItem ? (
          <div className="space-y-4">
            {/* Title + description */}
            <div>
              <h3 className="text-base font-semibold text-slate-900">{selectedItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedItem.description}</p>
            </div>

            {/* Assignee card (when present) */}
            {selectedItem.assignee && (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white',
                    selectedItem.assignee.color
                  )}
                >
                  {selectedItem.assignee.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500">Người phụ trách</p>
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {selectedItem.assignee.name}
                  </p>
                </div>
              </div>
            )}

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Hạn xử lý</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">{selectedItem.due}</p>
              </div>
              <div className="rounded-md bg-slate-50 p-3">
                <p className="text-xs font-semibold text-slate-500">Trạng thái</p>
                <Badge className="mt-1" variant={workspaceStatusStyles[selectedItem.status].badge}>
                  {workspaceStatusStyles[selectedItem.status].label}
                </Badge>
              </div>
            </div>

            {/* Progress bar (inProgress items) */}
            {selectedItem.status === 'inProgress' && selectedItem.progress !== undefined && (
              <div>
                <div className="mb-1.5 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600">Tiến độ hoàn thành</span>
                  <span className="font-bold text-cyan-700">{selectedItem.progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full w-full origin-left rounded-full bg-cyan-600 transition-transform duration-700"
                    style={{ transform: `scaleX(${selectedItem.progress / 100})` }}
                  />
                </div>
              </div>
            )}

            {/* Next step */}
            <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-900">Bước tiếp theo</p>
              <p className="mt-1 text-sm leading-6 text-cyan-800">{selectedItem.nextStep}</p>
            </div>

            {/* Approve / Reject actions */}
            {(onApprove || onReject) && selectedItem.status !== 'approved' && (
              <div className="flex gap-2 border-t border-slate-100 pt-4">
                {onReject && (
                  <button
                    type="button"
                    onClick={() => onReject(selectedItem)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50 focus:outline-none focus:ring-2 focus:ring-rose-400 focus:ring-offset-2"
                  >
                    <XCircle size={15} />
                    Từ chối
                  </button>
                )}
                {onApprove && (
                  <button
                    type="button"
                    onClick={() => onApprove(selectedItem)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-600 bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                  >
                    <CheckCircle2 size={15} />
                    Phê duyệt
                  </button>
                )}
              </div>
            )}

            {/* Already approved indicator */}
            {(onApprove || onReject) && selectedItem.status === 'approved' && (
              <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={15} />
                Mục này đã được phê duyệt
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Chọn một dòng để xem chi tiết.</p>
        )}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Quy tắc xử lý</CardTitle>
        <CardDescription>Áp dụng cho workspace này.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {processNotes.map((note, index) => {
          const NoteIcon = noteIcons[index % noteIcons.length];
          return (
            <div key={note} className="flex gap-2 text-sm text-slate-600">
              <NoteIcon size={18} className="mt-0.5 shrink-0 text-cyan-700" />
              <p>{note}</p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  </aside>
);
