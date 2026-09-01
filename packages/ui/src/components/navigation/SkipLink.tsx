import type { AnchorHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

export interface SkipLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId?: string;
}

export const SkipLink = ({
  targetId = "main-content",
  className,
  children = "Skip to main content",
  ...props
}: SkipLinkProps) => {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        "absolute left-2 top-2 z-[100] -translate-y-[150%]",
        "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground",
        "transition-transform duration-base ease-standard",
        "focus:translate-y-0 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background",
        className,
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
};
