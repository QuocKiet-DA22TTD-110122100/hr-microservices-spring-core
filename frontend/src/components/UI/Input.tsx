import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { AlertCircle } from 'lucide-react';

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
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={[errorId, helperId].filter(Boolean).join(' ') || undefined}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              error 
                ? 'border-red-500 focus:ring-red-500' 
                : 'border-gray-300'
            } ${className}`}
            {...props}
          />
          
          {error && showErrorIcon && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <AlertCircle size={18} className="text-red-500" aria-hidden="true" />
            </div>
          )}
        </div>

        {helperText && !error && (
          <p id={helperId} className="mt-1 text-xs text-gray-500">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="mt-1 text-sm text-red-500 flex items-start gap-1" role="alert" aria-live="polite">
            {!showErrorIcon && <AlertCircle size={14} className="mt-0.5 flex-shrink-0" aria-hidden="true" />}
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
