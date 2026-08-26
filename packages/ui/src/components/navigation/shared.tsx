import type { ComponentType, ElementType, ReactNode } from "react";
import { cn } from "../../utils/cn";

/**
 * Shared foundation for Phase 6 — Navigation Components
 * (docs/design-system/00-PLAN.md): `Sidebar`, `TopNav`, `BottomNav`,
 * `Breadcrumbs`, `Tabs`, `Accordion`, `UserMenu`, Command Palette.
 *
 * `packages/ui` is a Tier 1 package (docs/frontend/COMPONENT_GUIDE.md)
 * and must not depend on any one app's router. Every nav item below is
 * rendered through `NavLink`, a polymorphic element: it defaults to a
 * `<button>` (fires `onClick`) but a caller can pass `as={Link}` (e.g.
 * `@tanstack/react-router`'s `Link`) plus that component's own props
 * (`to`, etc.) via `linkProps` to get real client-side navigation and
 * active-route styling from the router itself. This is the same
 * `as`-prop pattern `Stack` (Phase 2) already uses for polymorphism —
 * not a new convention.
 */

export interface NavItem {
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;
  /** Visually marks this item as the current page/section. */
  active?: boolean | undefined;
  disabled?: boolean | undefined;
  /** e.g. an unread count — rendered right-aligned. */
  badge?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
  /** Plain `href` for a real `<a>` when no router component is supplied. */
  href?: string | undefined;
  /** Router `Link`-like component to render instead of `<a>`/`<button>`. */
  as?: ElementType | undefined;
  /** Extra props forwarded to `as` (or the fallback `<a>`) — e.g. `{ to: '/orders' }`. */
  linkProps?: Record<string, unknown> | undefined;
}

export function navItemClasses(active?: boolean, disabled?: boolean) {
  return cn(
    "flex items-center gap-3 rounded-md text-sm font-medium transition-colors duration-fast ease-standard outline-none",
    "focus-visible:ring-2 focus-visible:ring-primary",
    disabled && "opacity-50 pointer-events-none",
    active
      ? "bg-primary-surface text-primary"
      : "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
  );
}

/**
 * Renders one `NavItem` as whichever element fits: the caller's `as`
 * (router `Link`), a plain `<a>` if only `href` is given, or a
 * `<button>` as the default. Exactly one of these three shapes is used
 * per item — never more than one interactive element is rendered.
 */
export function NavLink({
  item,
  className,
  children,
}: {
  item: NavItem;
  className?: string | undefined;
  children: ReactNode;
}) {
  const { as: As, href, onClick, disabled, active, linkProps } = item;
  const commonProps = {
    className,
    "aria-current": active ? ("page" as const) : undefined,
    "aria-disabled": disabled || undefined,
  };

  if (As) {
    // Session 12 fix: `disabled` previously only reached `As` as
    // `aria-disabled` (above) plus whatever `disabled && 'opacity-50
    // pointer-events-none'` a caller's `navItemClasses` supplies —
    // neither actually stops the element from activating. `<a>`'s
    // native `disabled` doesn't exist (see the plain-`<a>` branch
    // below, which instead drops `href` — a router `Link`'s `to`-style
    // prop can't be dropped the same way without breaking the specific
    // router integration this package can't know the shape of, per
    // this file's own Tier-1-no-router-dependency doc comment above),
    // and `pointer-events-none` only blocks pointer/touch activation —
    // a keyboard user pressing Enter on a real `<a>` still fires a
    // native click the CSS property never sees. So a `disabled`
    // `NavItem` rendered via `as={Link}` was previously still fully
    // keyboard-activatable despite looking and pointer-behaving
    // disabled. Fixed by intercepting the click itself, same
    // `aria-disabled`-plus-blocked-activation pattern WAI-ARIA
    // recommends for elements that have no native `disabled` — this
    // still leaves the element in the tab order (an `as={Link}` item
    // can't cleanly drop out of it the way the plain-`<a>` branch's
    // `href`-removal does), which is a real, disclosed trade-off, not
    // the ideal "fully inert" outcome, but is the correct fix
    // available without either depending on a specific router's API
    // or guessing at one.
    const existingOnClick = linkProps?.["onClick"];
    return (
      <As
        {...linkProps}
        {...commonProps}
        onClick={(e: {
          preventDefault: () => void;
          stopPropagation: () => void;
        }) => {
          if (disabled) {
            e.preventDefault();
            e.stopPropagation();
            return;
          }
          if (typeof existingOnClick === "function") existingOnClick(e);
        }}
      >
        {children}
      </As>
    );
  }
  if (href) {
    return (
      <a href={disabled ? undefined : href} {...commonProps}>
        {children}
      </a>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      {...commonProps}
    >
      {children}
    </button>
  );
}
