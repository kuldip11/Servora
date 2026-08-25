import { type ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { Tooltip, TooltipProvider } from "../overlay/Tooltip";
import { type NavItem, NavLink, navItemClasses } from "./shared";

export interface SidebarSection {
  /** Omit for an ungrouped list of items at the top of the sidebar. */
  title?: string | undefined;
  items: NavItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];
  /** e.g. a logo/product name, rendered above the sections. */
  header?: ReactNode | undefined;
  /** e.g. a `UserMenu`, pinned to the bottom. */
  footer?: ReactNode | undefined;
  /** @default true */
  collapsible?: boolean | undefined;
  /** Uncontrolled initial state, ignored once `collapsed` is passed. @default false */
  defaultCollapsed?: boolean | undefined;
  /** Controlled collapsed state. Pair with `onCollapsedChange`. */
  collapsed?: boolean | undefined;
  onCollapsedChange?: ((collapsed: boolean) => void) | undefined;
  className?: string | undefined;
}

/**
 * Desktop collapsible sidebar (docs/design-system/00-PLAN.md Phase 6).
 * Slots into `AppShell`'s `sidebar` prop — this component only renders
 * the nav content, `AppShell` still owns the fixed-width `<aside>`
 * frame and the `hidden lg:block` responsive rule.
 *
 * Collapsed state is controlled/uncontrolled the same way `Combobox`
 * etc. mix both: pass `collapsed`+`onCollapsedChange` to drive it from
 * outside (e.g. persist to `localStorage`), or leave both out and let
 * the internal `useState` (seeded by `defaultCollapsed`) own it.
 *
 * When collapsed, labels hide and each item's label becomes a `Tooltip`
 * instead — which needs a `TooltipProvider` ancestor (see `overlay/
 * Tooltip.tsx`'s doc comment). Rather than require every app to wire
 * one into its root `main.tsx` before a `Sidebar` works at all, this
 * component mounts its own `TooltipProvider` scoped to just itself —
 * safe to nest multiple `TooltipProvider`s (Radix supports this), and
 * it means `Sidebar` works standalone with zero required app wiring.
 */
export function Sidebar({
  sections,
  header,
  footer,
  collapsible = true,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
  className,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const collapsed = collapsedProp ?? internalCollapsed;

  function toggle() {
    const next = !collapsed;
    if (onCollapsedChange) onCollapsedChange(next);
    else setInternalCollapsed(next);
  }

  return (
    <TooltipProvider delayDuration={300}>
      <nav aria-label="Main" className={cn("h-full flex flex-col", className)}>
        {header && (
          <div
            className={cn(
              "shrink-0 px-4 py-4 border-b border-border",
              collapsed && "px-2",
            )}
          >
            {header}
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-4 flex flex-col gap-6">
          {sections.map((section, sectionIndex) => (
            <div
              key={section.title ?? sectionIndex}
              className="flex flex-col gap-1"
            >
              {section.title && !collapsed && (
                <div className="px-3 mb-1 text-xs font-semibold text-text-secondary uppercase tracking-wide">
                  {section.title}
                </div>
              )}
              {section.items.map((item) => {
                const row = (
                  <NavLink
                    key={item.label}
                    item={item}
                    className={cn(
                      navItemClasses(item.active, item.disabled),
                      "w-full px-3 py-2",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                    {!collapsed && (
                      <span className="flex-1 min-w-0 truncate text-left">
                        {item.label}
                      </span>
                    )}
                    {!collapsed && item.badge && (
                      <span className="shrink-0">{item.badge}</span>
                    )}
                  </NavLink>
                );
                return collapsed ? (
                  <Tooltip
                    key={item.label}
                    trigger={row}
                    content={item.label}
                    side="right"
                  />
                ) : (
                  row
                );
              })}
            </div>
          ))}
        </div>

        {footer && (
          <div
            className={cn(
              "shrink-0 px-3 py-3 border-t border-border",
              collapsed && "px-2",
            )}
          >
            {footer}
          </div>
        )}

        {collapsible && (
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "shrink-0 flex items-center justify-center gap-2 border-t border-border py-2.5 text-text-secondary",
              "hover:bg-surface-secondary hover:text-text-primary transition-colors duration-fast ease-standard",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
            )}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-xs font-medium">Collapse</span>
              </>
            )}
          </button>
        )}
      </nav>
    </TooltipProvider>
  );
}
