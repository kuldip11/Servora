import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { type NavItem, NavLink, navItemClasses } from "./shared";

export interface TopNavProps {
  /** Logo/product name, left-aligned. */
  brand?: ReactNode | undefined;
  /** Primary nav links, rendered inline next to `brand`. Hidden below `md` — pair with `BottomNav` on mobile. */
  items?: NavItem[] | undefined;
  /** Right-aligned slot — search, notifications, a `UserMenu`, etc. */
  actions?: ReactNode | undefined;
  className?: string | undefined;
}

/**
 * Horizontal top bar (the design-system contract Phase 6). Slots
 * into `AppShell`'s `topbar` prop, same relationship `Sidebar` has to
 * the `sidebar` prop — `AppShell` owns the fixed frame, this owns the
 * content and layout inside it.
 *
 * `items` is meant for a small, flat set of top-level sections (the
 * Waiter App / a marketing-style header); an app with a full sidebar
 * nav (Admin) will typically pass only `brand`+`actions` and leave
 * `items` empty, since `Sidebar` already owns primary navigation there.
 *
 * **`items`'s breakpoint (Session 12, docs/accessibility): the inner
 * `<nav aria-label="Primary">` below is `hidden md:flex` — hidden
 * below 768px, shown at/above it.** `AppShell` itself applies no
 * responsive hiding to the whole `topbar`/`bottombar` slots (see
 * `AppShell.tsx`) — that's left to whatever's passed in, per its own
 * doc comment. If a consumer ever renders `TopNav` with `items` *and*
 * `BottomNav` together (unusual — normally an app picks one primary
 * nav pattern, not both — but nothing stops it), **`BottomNav` must
 * be hidden at exactly this same 768px point, e.g. `className="md:hidden"`,
 * not a different breakpoint** — a mismatch (say `BottomNav`'s
 * `lg:hidden` at 1024px against this `md:flex` at 768px) would put
 * two simultaneously-visible `<nav aria-label="Primary">` landmarks
 * on screen between 768–1024px, identical names, genuinely ambiguous
 * for landmark-navigation. Not currently triggered by any real call
 * site (checked this session — the one place both are used together,
 * `NavigationPreviewPage.tsx`, doesn't pass `items` to its `TopNav`,
 * so this inner `nav` never renders there), but worth this note before
 * a future consumer hits it blind. See the matching note in
 * `BottomNav.tsx`.
 */
export function TopNav({ brand, items = [], actions, className }: TopNavProps) {
  return (
    <div className={cn("h-16 px-4 sm:px-6 flex items-center gap-6", className)}>
      {brand && <div className="shrink-0 flex items-center">{brand}</div>}

      {items.length > 0 && (
        <nav
          aria-label="Primary"
          className="hidden md:flex items-center gap-1 min-w-0"
        >
          {items.map((item) => (
            <NavLink
              key={item.label}
              item={item}
              className={cn(
                navItemClasses(item.active, item.disabled),
                "px-3 py-2",
              )}
            >
              {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      )}

      {actions && (
        <div className="ml-auto shrink-0 flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
