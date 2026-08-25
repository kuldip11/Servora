import type { ReactNode } from 'react';
import { cn } from '../../utils/cn';

/**
 * Phase 7 (Part 1) — `Toolbar`. Standardizes the
 * `<div className="flex items-center justify-between">` header row every
 * Admin list page hand-rolls above its table today (title + count on the
 * left, primary action button(s) on the right) — same idea as Phase 2's
 * `PageHeader` for whole-page headers, but scoped to a list/table section
 * so it composes with `Section` (Phase 2) instead of competing with it.
 */

export interface ToolbarProps {
  title?: ReactNode;
  /** Rendered under `title`, e.g. "42 total orders". Ignored if `title` is omitted. */
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string | undefined;
}

export function Toolbar({ title, subtitle, actions, className }: ToolbarProps) {
  return (
    <div className={cn('flex items-center justify-between gap-4 flex-wrap', className)}>
      {title !== undefined ? (
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {subtitle !== undefined && <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>}
        </div>
      ) : (
        <div />
      )}
      {actions !== undefined && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}
