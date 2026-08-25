import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';

const GAPS = {
  none: 'gap-0',
  xs: 'gap-xs',
  sm: 'gap-sm',
  md: 'gap-md',
  lg: 'gap-lg',
} as const;

/** Column count per breakpoint. Any key you omit falls back to the previous breakpoint. */
export interface GridColumns {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
  xl?: number;
}

const COL_CLASSES: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
  12: 'grid-cols-12',
};

const SM_COL_CLASSES: Record<number, string> = {
  1: 'sm:grid-cols-1', 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4', 5: 'sm:grid-cols-5', 6: 'sm:grid-cols-6', 12: 'sm:grid-cols-12',
};
const MD_COL_CLASSES: Record<number, string> = {
  1: 'md:grid-cols-1', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3',
  4: 'md:grid-cols-4', 5: 'md:grid-cols-5', 6: 'md:grid-cols-6', 12: 'md:grid-cols-12',
};
const LG_COL_CLASSES: Record<number, string> = {
  1: 'lg:grid-cols-1', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6', 12: 'lg:grid-cols-12',
};
const XL_COL_CLASSES: Record<number, string> = {
  1: 'xl:grid-cols-1', 2: 'xl:grid-cols-2', 3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4', 5: 'xl:grid-cols-5', 6: 'xl:grid-cols-6', 12: 'xl:grid-cols-12',
};

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /**
   * Either a fixed column count, or a responsive map, e.g.
   * `{ base: 1, sm: 2, lg: 3 }` — 1 column on mobile, 2 from `sm:` up,
   * 3 from `lg:` up. @default 1
   */
  columns?: number | GridColumns;
  gap?: keyof typeof GAPS;
}

/**
 * Fixes the exact bug flagged in the Phase 0 audit
 * (`KitchenBoard.tsx`'s fixed `grid-cols-3` with zero responsive
 * breakpoints) — always express columns as a responsive map here rather
 * than a bare Tailwind `grid-cols-N` class.
 */
export function Grid({ children, columns = 1, gap = 'md', className, ...props }: GridProps) {
  const cols: GridColumns = typeof columns === 'number' ? { base: columns } : columns;

  return (
    <div
      className={cn(
        'grid',
        cols.base != null && COL_CLASSES[cols.base],
        cols.sm != null && SM_COL_CLASSES[cols.sm],
        cols.md != null && MD_COL_CLASSES[cols.md],
        cols.lg != null && LG_COL_CLASSES[cols.lg],
        cols.xl != null && XL_COL_CLASSES[cols.xl],
        GAPS[gap],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
