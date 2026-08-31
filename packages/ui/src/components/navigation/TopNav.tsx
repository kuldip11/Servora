import type { ReactNode } from "react";
import { cn } from "../../utils/cn";
import { type NavItem, NavLink, navItemClasses } from "./shared";

export interface TopNavProps {

  brand?: ReactNode | undefined;

  items?: NavItem[] | undefined;

  actions?: ReactNode | undefined;
  className?: string | undefined;
}

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
