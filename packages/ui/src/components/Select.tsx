import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../utils/cn';


interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id ?? generatedId;
    const errorId = `${selectId}-error`;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-text-secondary">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            // Phase 16 token audit — was `text-gray-900 bg-white ...
            // border-gray-200 ... border-red-300 ... focus:ring-violet-500`.
            // Matches `SelectMenu`'s already-tokenized trigger
            // (`selection/shared.tsx`'s `triggerBaseClasses`) so both of
            // this package's selects repaint together under dark/
            // high-contrast instead of only the newer one working.
            'block w-full px-3 py-2.5 text-sm text-text-primary bg-surface border rounded-md',
            'focus:outline-none focus:ring-2 focus:border-transparent transition-colors duration-fast ease-standard',
            error ? 'border-danger focus:ring-danger' : 'border-border focus:ring-primary',
            className,
          )}
          {...props}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);
Select.displayName = 'Select';


