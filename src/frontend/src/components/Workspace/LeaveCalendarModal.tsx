import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import { vi } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal } from '@/components/UI/Modal';
import { Button } from '@/components/UI/Button';
import { cn } from '@/utils/cn';
import { WorkspaceItem } from './types';

interface LeaveCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WorkspaceItem[];
}

const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const statusDotClass: Record<WorkspaceItem['status'], string> = {
  approved: 'bg-emerald-500',
  pending: 'bg-amber-500',
  inProgress: 'bg-cyan-500',
  blocked: 'bg-rose-500',
};

export const LeaveCalendarModal = ({ isOpen, onClose, items }: LeaveCalendarModalProps) => {
  const datedItems = useMemo(() => items.filter((item) => Boolean(item.date)), [items]);

  const [cursor, setCursor] = useState<Date>(() =>
    datedItems.length > 0 ? parseISO(datedItems[0].date as string) : new Date()
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const itemsByDate = useMemo(() => {
    const map = new Map<string, WorkspaceItem[]>();
    datedItems.forEach((item) => {
      const key = item.date as string;
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return map;
  }, [datedItems]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [cursor]);

  const selectedItems = selectedDate ? itemsByDate.get(selectedDate) ?? [] : [];

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch nghỉ phép" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tháng trước"
            onClick={() => setCursor((prev) => subMonths(prev, 1))}
          >
            <ChevronLeft size={16} />
          </Button>
          <p className="text-sm font-semibold capitalize text-slate-900">
            {format(cursor, 'MMMM yyyy', { locale: vi })}
          </p>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Tháng sau"
            onClick={() => setCursor((prev) => addMonths(prev, 1))}
          >
            <ChevronRight size={16} />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase text-slate-400">
          {weekdayLabels.map((label) => (
            <div key={label}>{label}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map((day) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayItems = itemsByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, cursor);

            return (
              <button
                key={key}
                type="button"
                disabled={dayItems.length === 0}
                onClick={() => setSelectedDate(key)}
                className={cn(
                  'flex h-16 flex-col items-center justify-start gap-1 rounded-md border p-1 text-xs transition disabled:cursor-default',
                  inMonth ? 'border-slate-200 bg-white' : 'border-transparent bg-slate-50',
                  isToday(day) && 'border-cyan-600',
                  selectedDate === key && 'ring-2 ring-cyan-600',
                  dayItems.length > 0 && 'cursor-pointer hover:border-cyan-400'
                )}
              >
                <span className={cn('font-semibold', inMonth ? 'text-slate-700' : 'text-slate-300')}>
                  {format(day, 'd')}
                </span>
                {dayItems.length > 0 && (
                  <span className="flex gap-0.5">
                    {dayItems.slice(0, 3).map((item) => (
                      <span
                        key={item.title}
                        className={cn('h-1.5 w-1.5 rounded-full', statusDotClass[item.status])}
                      />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
          {selectedItems.length > 0 ? (
            <ul className="space-y-2">
              {selectedItems.map((item) => (
                <li key={item.title} className="text-sm">
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-500">{item.description}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={16} />
              Chọn một ngày có đánh dấu để xem chi tiết đơn nghỉ.
            </p>
          )}
        </div>

        {datedItems.length === 0 && (
          <p className="text-center text-sm text-slate-400">Chưa có đơn nghỉ nào được gắn ngày cụ thể.</p>
        )}
      </div>
    </Modal>
  );
};
