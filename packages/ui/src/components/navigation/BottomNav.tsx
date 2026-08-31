import { cn } from "../../utils/cn";
import { type NavItem, NavLink } from "./shared";

export interface BottomNavProps {
  items: NavItem[];
  className?: string | undefined;
}

export function BottomNav({ items, className }: BottomNavProps) {
  return (
    <nav aria-label="Primary" className={cn("flex items-stretch", className)}>
      {items.map((item) => (
        <NavLink
          key={item.label}
          item={item}
          className={cn(
            "flex-1 flex flex-col items-center justify-center gap-1 py-2 text-xs font-medium transition-colors duration-fast ease-standard outline-none",
            "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
            item.disabled && "opacity-50 pointer-events-none",
            item.active
              ? "text-primary"
              : "text-text-secondary hover:text-text-primary",
          )}
        >
          <span className="relative">
            {item.icon && <item.icon className="w-5 h-5" />}
            {item.badge && (
              <span className="absolute -top-1 -right-1.5 flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </span>
          <span className="truncate max-w-[4.5rem]">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
