import { ReactNode } from 'react';
import { Button } from '@/components/UI/Button';
import { cn } from '@/utils/cn';

export interface RowAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  tone?: 'default' | 'danger' | 'success';
  disabled?: boolean;
}

interface RowActionsProps {
  label: string;
  actions: RowAction[];
}

const toneStyles = {
  default: 'border-slate-200 bg-white text-slate-700 hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900',
  danger: 'border-rose-200 bg-white text-rose-700 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-800',
  success: 'border-emerald-200 bg-white text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800',
};

export const RowActions = ({ label, actions }: RowActionsProps) => (
  <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
    {actions.map((action) => (
      <Button
        key={action.label}
        type="button"
        variant="outline"
        size="sm"
        className={cn('h-8 gap-1.5 rounded-lg px-2.5 shadow-none', toneStyles[action.tone ?? 'default'])}
        disabled={action.disabled}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick();
        }}
        title={action.label}
        aria-label={action.label}
      >
        {action.icon}
        <span>{action.label}</span>
      </Button>
    ))}
  </div>
);
