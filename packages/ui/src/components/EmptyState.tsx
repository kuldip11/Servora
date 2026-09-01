import type { ReactNode, ComponentType } from "react";
import { cn } from "../utils/cn";

export type EmptyStateSize = "sm" | "md";

const SIZE_CLASSES: Record<
  EmptyStateSize,
  { wrapper: string; iconWrapper: string; icon: string }
> = {
  sm: { wrapper: "py-10 px-4", iconWrapper: "w-11 h-11 mb-3", icon: "w-5 h-5" },
  md: { wrapper: "py-16 px-4", iconWrapper: "w-14 h-14 mb-4", icon: "w-7 h-7" },
};

export interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string | undefined;
  action?: ReactNode;

  size?: EmptyStateSize | undefined;
  className?: string | undefined;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  size = "md",
  className,
}: EmptyStateProps) => {
  const s = SIZE_CLASSES[size];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        s.wrapper,
        className,
      )}
    >
      <div
        className={cn(
          "rounded-full bg-surface-secondary flex items-center justify-center",
          s.iconWrapper,
        )}
      >
        <Icon aria-hidden="true" className={cn(s.icon, "text-text-disabled")} />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-text-secondary mb-4 max-w-xs">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};
