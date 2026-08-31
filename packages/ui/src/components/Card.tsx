import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../utils/cn";

const PADDING = {
  none: "p-0",
  sm: "p-sm",
  md: "p-md",
  lg: "p-lg",
} as const;

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;

  padding?: keyof typeof PADDING;

  interactive?: boolean;
  as?: ElementType;
}

export const Card = ({
  children,
  padding = "lg",
  interactive = false,
  as: Tag = "div",
  className,
  ...props
}: CardProps) => {
  return (
    <Tag
      className={cn(
        "bg-surface border border-border rounded-lg shadow-sm",
        PADDING[padding],
        interactive &&
          "transition-shadow duration-base ease-standard hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
