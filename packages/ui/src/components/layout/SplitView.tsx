import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

export interface SplitViewProps extends HTMLAttributes<HTMLDivElement> {
  /** e.g. a list or filter panel. */
  primary: ReactNode;
  /** e.g. the selected item's detail view. */
  secondary: ReactNode;
  /** Fixed width of the primary pane on `lg:` and up. @default '320px' */
  primaryWidth?: string;
  /** Below `lg:`, panes stack vertically instead of sitting side by side. @default true */
  stackOnMobile?: boolean;
}

/**
 * Two-pane master-detail layout — e.g. Admin's Orders list + Order
 * detail, or a settings nav + settings content. Stacks to a single
 * column on narrow screens by default. Safe to use more than once on
 * the same page: `primaryWidth` is scoped to each instance via an
 * inline CSS custom property, not a global stylesheet rule.
 */
export function SplitView({
  primary,
  secondary,
  primaryWidth = '320px',
  stackOnMobile = true,
  className,
  ...props
}: SplitViewProps) {
  return (
    <div
      className={cn('flex gap-lg', stackOnMobile ? 'flex-col lg:flex-row' : 'flex-row', className)}
      {...props}
    >
      <div
        className="w-full lg:shrink-0 lg:w-[var(--split-primary-width)] lg:sticky lg:top-6 lg:self-start"
        style={{ '--split-primary-width': primaryWidth } as CSSProperties}
      >
        {primary}
      </div>
      <div className="min-w-0 flex-1">{secondary}</div>
    </div>
  );
}
