import { type ComponentType, type ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';
import { BUTTON_SIZE_CLASSES, BUTTON_ICON_SIZE_CLASSES, type ButtonSize } from './Button';

export interface SplitButtonAction {
  label: string;
  onClick: () => void;
  icon?: ComponentType<{ className?: string }>;
  danger?: boolean;
}

export interface SplitButtonProps {
  children: ReactNode;
  onClick: () => void;
  actions: SplitButtonAction[];
  /** @default 'primary' */
  variant?: 'primary' | 'secondary';
  /** @default 'md' */
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const VARIANT_CLASSES = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover focus:ring-primary',
  secondary: 'bg-surface text-text-primary hover:bg-surface-secondary focus:ring-border',
};

const DIVIDER_CLASSES = {
  primary: 'border-l border-white/25',
  secondary: 'border-l border-border',
};

/**
 * Primary action button with an attached chevron trigger that opens a
 * short list of secondary actions.
 *
 * Scope note: the dropdown here is still a minimal, self-contained
 * implementation (outside-click + Escape to close, arrow-key-free),
 * not built on Radix, even though `DropdownMenu`
 * (`components/overlay/DropdownMenu.tsx`, Phase 5) now exists. Not
 * re-pointed at it in Phase 5 either: `DropdownMenu` takes a single
 * `trigger` and renders one Radix-managed popup, but `SplitButton` is
 * two adjacent buttons (a primary action button that's *not* a menu
 * trigger, plus a chevron that is) sharing one visual unit — mapping
 * that onto `DropdownMenu`'s shape means redesigning `SplitButton`'s
 * own props, not just swapping its internals, which is real, separate
 * work. Flagging it again here rather than let it go quiet a second
 * phase running; see `docs/design-system/README.md`'s Phase 5 section
 * for the same note.
 */
export function SplitButton({
  children,
  onClick,
  actions,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  className,
}: SplitButtonProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn(
          'inline-flex items-center gap-2 font-medium rounded-l-md',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast ease-standard',
          BUTTON_SIZE_CLASSES[size],
          VARIANT_CLASSES[variant],
        )}
      >
        {loading && <Loader2 className={cn('animate-spin', BUTTON_ICON_SIZE_CLASSES[size])} />}
        {children}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || loading}
        aria-label={open ? 'Close more actions' : 'More actions'}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'inline-flex items-center justify-center rounded-r-md px-2',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-fast ease-standard',
          VARIANT_CLASSES[variant],
          DIVIDER_CLASSES[variant],
        )}
      >
        <ChevronDown className={BUTTON_ICON_SIZE_CLASSES[size]} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 min-w-[10rem] py-1 bg-surface border border-border rounded-md shadow-dropdown z-10"
        >
          {actions.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  action.onClick();
                }}
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-secondary',
                  action.danger ? 'text-danger' : 'text-text-primary',
                )}
              >
                {Icon && <Icon className="w-4 h-4" />}
                {action.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
