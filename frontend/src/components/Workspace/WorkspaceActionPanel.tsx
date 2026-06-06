import { AlertCircle, CheckCircle2, ClipboardCheck, KeyRound, LucideIcon, User } from 'lucide-react';
import { Badge } from '@/components/UI/Badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { WorkspaceItem } from './types';
import { workspaceStatusStyles } from './workspaceStyles';

interface WorkspaceActionPanelProps {
  selectedItem?: WorkspaceItem;
  processNotes: string[];
}

const noteIcons: LucideIcon[] = [CheckCircle2, AlertCircle, ClipboardCheck, KeyRound, User];

export const WorkspaceActionPanel = ({ selectedItem, processNotes }: WorkspaceActionPanelProps) => (
  <aside className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle>Mục đang chọn</CardTitle>
        <CardDescription>Ngữ cảnh xử lý nhanh.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedItem ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-slate-900">{selectedItem.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{selectedItem.description}</p>
            </div>
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
            <div className="rounded-lg border border-cyan-100 bg-cyan-50 p-4">
              <p className="text-sm font-semibold text-cyan-900">Bước tiếp theo</p>
              <p className="mt-1 text-sm leading-6 text-cyan-800">{selectedItem.nextStep}</p>
            </div>
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
