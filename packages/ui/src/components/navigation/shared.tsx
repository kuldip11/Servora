import type { ComponentType, ElementType, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface NavItem {
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;

  active?: boolean | undefined;
  disabled?: boolean | undefined;

  badge?: ReactNode | undefined;
  onClick?: (() => void) | undefined;

  href?: string | undefined;

  as?: ElementType | undefined;

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
