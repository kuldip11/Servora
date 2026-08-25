import type { ReactNode } from 'react';
import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '../../utils/cn';
import { overlayPanelClasses, overlayScrimClasses, OverlayHeader } from './shared';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Which edge the panel slides in from. @default 'right' */
  side?: 'left' | 'right' | undefined;
  /** @default 'md' */
  size?: 'sm' | 'md' | 'lg' | undefined;
  footer?: ReactNode | undefined;
  preventDismiss?: boolean | undefined;
  /** See `Dialog`'s `description` prop doc — same `sr-only`
   * `RadixDialog.Description` pattern, optional. */
  description?: string | undefined;
}

const WIDTH_CLASSES = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' };

/** Phase 8: unlike `Dialog`, `Drawer` has no static centering transform to
 * compose with, so this is a plain side-aware slide — `left`/`right` map
 * directly to `slide-in-from-left`/`slide-in-from-right` (no percentage
 * needed; a full off-screen translate is exactly what a full-height edge
 * panel wants, unlike `Dialog`'s partial "48%" nudge). */
function drawerAnimationClasses(side: 'left' | 'right') {
  return cn(
    'data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate',
    'data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate',
    side === 'right'
      ? 'data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right'
      : 'data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left',
  );
}

/**
 * Side panel — same `@radix-ui/react-dialog` foundation as `Dialog`
 * (`selection/shared.tsx`'s reasoning applies here too: Radix gives
 * focus-trap/restore/Escape/outside-click for free, so this is
 * composition + positioning, not new interaction logic). Full-height,
 * slides in from `side`, scrollable body between a fixed header and
 * optional footer — the shape every real drawer use case in this
 * codebase needs (a form panel, a detail panel) per
 * `docs/frontend/COMPONENT_GUIDE.md`'s component list.
 *
 * Slide-in/out animation added in Phase 8 (Motion System) — see
 * `drawerAnimationClasses` above.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  side = 'right',
  size = 'md',
  footer,
  preventDismiss,
  description,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayScrimClasses} />
        <RadixDialog.Content
          onEscapeKeyDown={(e) => preventDismiss && e.preventDefault()}
          onPointerDownOutside={(e) => preventDismiss && e.preventDefault()}
          onInteractOutside={(e) => preventDismiss && e.preventDefault()}
          {...(description ? {} : { 'aria-describedby': undefined })}
          className={cn(
            overlayPanelClasses,
            drawerAnimationClasses(side),
            'fixed inset-y-0 z-50 flex flex-col w-full',
            side === 'right' ? 'right-0' : 'left-0',
            WIDTH_CLASSES[size],
          )}
        >
          <OverlayHeader
            title={
              <RadixDialog.Title className="text-lg font-semibold text-text-primary truncate">
                {title}
              </RadixDialog.Title>
            }
            onClose={onClose}
          />
          {description && (
            <RadixDialog.Description className="sr-only">{description}</RadixDialog.Description>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
