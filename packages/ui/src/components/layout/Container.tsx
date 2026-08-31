import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

const MAX_WIDTHS = {
  sm: "max-w-screen-sm",
  md: "max-w-screen-md",
  lg: "max-w-screen-lg",
  xl: "max-w-screen-xl",
  full: "max-w-none",
} as const;

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  size?: keyof typeof MAX_WIDTHS;

  as?: ElementType;
}

export function Container({
  children,
  size = "xl",
  as: Tag = "div",
  className,
  ...props
}: ContainerProps) {
  return (
    <Tag
      className={cn(
        "w-full mx-auto px-4 sm:px-6 lg:px-8",
        MAX_WIDTHS[size],
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
