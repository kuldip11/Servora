import type { ReactNode } from 'react';

import { cn } from '../utils/cn';

interface BadgeProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export function Badge({ children, className, variant = 'default' }: BadgeProps) {
  // Phase 16 token audit — matches `StatusBadge`'s already-established
  // tone→token mapping (`TONE_CLASSES` in StatusBadge.tsx) exactly, so
  // the two components agree under dark/high-contrast instead of only
  // `StatusBadge` repainting correctly while this one stayed pinned to
  // fixed emerald/amber/red/blue/gray shades.
  const variants = {
    default: 'bg-surface-secondary text-text-secondary',
    success: 'bg-success-surface text-success',
    warning: 'bg-warning-surface text-warning',
    danger: 'bg-danger-surface text-danger',
    info: 'bg-info-surface text-info',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}