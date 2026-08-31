import { type ReactNode, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { Tooltip, TooltipProvider } from "../overlay/Tooltip";
import { type NavItem, NavLink, navItemClasses } from "./shared";

export interface SidebarSection {

  title?: string | undefined;
  items: NavItem[];
}

export interface SidebarProps {
  sections: SidebarSection[];

  header?: ReactNode | undefined;

  footer?: ReactNode | undefined;

  collapsible?: boolean | undefined;

  defaultCollapsed?: boolean | undefined;

  collapsed?: boolean | undefined;
  onCollapsedChange?: ((collapsed: boolean) => void) | undefined;
  className?: string | undefined;
}

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
