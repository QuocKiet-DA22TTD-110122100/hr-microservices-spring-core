import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  showErrorIcon?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, showErrorIcon = true, className = '', id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = helperText ? `${inputId}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-semibold text-slate-700">
            {label}
            {props.required && <span className="ml-1 text-rose-500">*</span>}
          </label>
        )}

        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            className={cn(
              'h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-950 placeholder:text-slate-400',
              'shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
              'transition-[border-color,box-shadow,background-color] duration-150',
              'hover:border-slate-400 hover:bg-slate-50/50',
              'focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-3 focus:ring-blue-500/15',
              error ? 'border-rose-400 pr-10 focus:border-rose-500 focus:ring-rose-500/15' : 'border-slate-300',
              className
            )}
            {...props}
          />

          {error && showErrorIcon && (
            <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
              <AlertCircle size={18} className="text-rose-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-xs text-slate-600">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1.5 flex items-start gap-1 text-sm text-rose-600" role="alert" aria-live="polite">
            {!showErrorIcon && <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />}
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
