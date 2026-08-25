import type { AnchorHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * id of the main content landmark to jump to (no leading `#`).
   * @default 'main-content'
   */
  targetId?: string;
}

/**
 * WCAG 2.4.1 "Bypass Blocks" — the first focusable element on every page
 * must let a keyboard user skip repeated navigation (sidebar/topbar) and
 * land directly in the main content region.
 *
 * Visually hidden by default (`sr-only`-style clip), becomes visible only
 * when it receives keyboard focus — never removes the focus outline, per
 * project convention (see AGENTS.md / docs/accessibility). Renders as a
 * real `<a href="#...">` so it also works with JS disabled and is
 * announced correctly by screen readers, rather than a `<button>` with a
 * synthetic click handler.
 *
 * `AppShell` renders one of these automatically, pointed at its own
 * `<main id="main-content">`, so most consumers never need to reach for
 * this directly. Use it directly only if you're not using `AppShell`.
 */
export function SkipLink({ targetId = 'main-content', className, children = 'Skip to main content', ...props }: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Off-screen until focused — clip-based, not display:none, so it
        // remains in the focus order and screen readers still see it.
        'absolute left-2 top-2 z-[100] -translate-y-[150%]',
        'rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground',
        'transition-transform duration-base ease-standard',
        'focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
        className
      )}
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          document.getElementById(targetId)?.focus();
        }
      }}
    >
      {children}
    </a>
  );
}
