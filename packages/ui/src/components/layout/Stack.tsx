import type { ElementType, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

const GAPS = {
  none: "gap-0",
  xs: "gap-xs",
  sm: "gap-sm",
  md: "gap-md",
  lg: "gap-lg",
} as const;

const ALIGN = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
} as const;

const JUSTIFY = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
} as const;

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;

  direction?: "row" | "column";

  gap?: keyof typeof GAPS;
  align?: keyof typeof ALIGN;
  justify?: keyof typeof JUSTIFY;
  wrap?: boolean;
  as?: ElementType;
}

export const Stack = ({
  children,
  direction = "column",
  gap = "md",
  align,
  justify,
  wrap = false,
  as: Tag = "div",
  className,
  ...props
}: StackProps) => {
  return (
    <Tag
      className={cn(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        GAPS[gap],
        align && ALIGN[align],
        justify && JUSTIFY[justify],
        wrap && "flex-wrap",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
};
