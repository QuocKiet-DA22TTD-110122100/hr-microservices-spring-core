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
  default: '',
  danger: 'text-rose-600 hover:bg-rose-50 hover:text-rose-700',
  success: 'text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700',
};

export const RowActions = ({ label, actions }: RowActionsProps) => (
  <div className="flex items-center gap-1" role="group" aria-label={label}>
    {actions.map((action) => (
      <Button
        key={action.label}
        type="button"
        variant="ghost"
        size="icon"
        className={cn(toneStyles[action.tone ?? 'default'])}
        disabled={action.disabled}
        onClick={(event) => {
          event.stopPropagation();
          action.onClick();
        }}
        title={action.label}
        aria-label={action.label}
      >
        {action.icon}
      </Button>
    ))}
  </div>
);
