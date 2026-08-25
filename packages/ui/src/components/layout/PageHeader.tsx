import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../utils/cn';
import { Stack } from './Stack';

export interface PageHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** Buttons etc., right-aligned next to the title on wide screens, below it on narrow ones. */
  actions?: ReactNode;
  /** e.g. a `Breadcrumbs` component (Phase 6), rendered above the title. */
  eyebrow?: ReactNode;
}

/**
 * Standardizes the title-block markup every page in Admin currently
 * hand-rolls (`<h1 className="text-2xl font-bold text-gray-900">...`).
 */
export function PageHeader({ title, description, actions, eyebrow, className, ...props }: PageHeaderProps) {
  return (
    <div className={cn(className)} {...props}>
      {eyebrow && <div className="mb-2">{eyebrow}</div>}
      <Stack direction="row" justify="between" align="start" gap="md" wrap>
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">{title}</h1>
          {description && <p className="text-sm text-text-secondary mt-0.5">{description}</p>}
        </div>
        {actions && (
          <Stack direction="row" gap="sm" className="shrink-0">
            {actions}
          </Stack>
        )}
      </Stack>
    </div>
  );
}
