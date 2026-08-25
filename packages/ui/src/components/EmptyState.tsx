import type { ReactNode, ComponentType } from 'react';
import { cn } from '../utils/cn';

/**
 * Upgraded for Phase 7 (docs/design-system/00-PLAN.md lists this
 * explicitly alongside `Table`/`DataGrid`/etc). Same reasoning as
 * `Card`/`Button`/`Input` in earlier phases: upgraded in place, not
 * replaced. All 7 existing call sites (`grep`-verified across
 * `apps/web` — Orders/Tables/Staff/Billing/Menu/Inventory/Branches
 * pages) use only `icon`/`title`/`description`/`action`, so swapping
 * the old hardcoded `gray-*` classes for `--text-primary`/
 * `--text-secondary`/`--surface-secondary` tokens is visually
 * identical in the light theme (the tokens were pulled 1:1 from these
 * exact classes) while now repainting correctly under
 * `data-theme="dark"`/`"high-contrast"` — the old version didn't.
 *
 * `size` is new and opt-in (`@default 'md'`, matches the old fixed
 * `py-16` unchanged): `Table`/`DataGrid` (Phase 7) render this inside
 * an already-padded container, where the old `py-16` doubles up the
 * whitespace, so `size="sm"` gives those callers a tighter variant
 * without a second component.
 */

export type EmptyStateSize = 'sm' | 'md';

const SIZE_CLASSES: Record<EmptyStateSize, { wrapper: string; iconWrapper: string; icon: string }> = {
  sm: { wrapper: 'py-10 px-4', iconWrapper: 'w-11 h-11 mb-3', icon: 'w-5 h-5' },
  md: { wrapper: 'py-16 px-4', iconWrapper: 'w-14 h-14 mb-4', icon: 'w-7 h-7' },
};

export interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string | undefined;
  action?: ReactNode;
  /** @default 'md' */
  size?: EmptyStateSize | undefined;
  className?: string | undefined;
}

export function EmptyState({ icon: Icon, title, description, action, size = 'md', className }: EmptyStateProps) {
  const s = SIZE_CLASSES[size];
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', s.wrapper, className)}>
      <div className={cn('rounded-full bg-surface-secondary flex items-center justify-center', s.iconWrapper)}>
        <Icon aria-hidden="true" className={cn(s.icon, 'text-text-disabled')} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-secondary mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
