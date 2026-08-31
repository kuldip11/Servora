import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface SplitViewProps extends HTMLAttributes<HTMLDivElement> {

  primary: ReactNode;

  secondary: ReactNode;

  primaryWidth?: string;

  stackOnMobile?: boolean;
}

export function SplitView({
  primary,
  secondary,
  primaryWidth = "320px",
  stackOnMobile = true,
  className,
  ...props
}: SplitViewProps) {
  return (
    <div
      className={cn(
        "flex gap-lg",
        stackOnMobile ? "flex-col lg:flex-row" : "flex-row",
        className,
      )}
      {...props}
    >
      <div
        className="w-full lg:shrink-0 lg:w-[var(--split-primary-width)] lg:sticky lg:top-6 lg:self-start"
        style={{ "--split-primary-width": primaryWidth } as CSSProperties}
      >
        {primary}
      </div>
      <div className="min-w-0 flex-1">{secondary}</div>
    </div>
  );
}
