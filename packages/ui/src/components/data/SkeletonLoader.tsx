import { cn } from "../../utils/cn";
import { CELL_PADDING, type TableDensity } from "./shared";

export interface SkeletonProps {
  className?: string | undefined;

  height?: string | undefined;

  width?: string | undefined;

  radius?: "sm" | "md" | "lg" | "full" | undefined;
}

const RADIUS_CLASSES = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  full: "rounded-full",
};

export const Skeleton = ({
  className,
  height = "1rem",
  width = "100%",
  radius = "md",
}: SkeletonProps) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative overflow-hidden bg-surface-secondary",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        RADIUS_CLASSES[radius],
        className,
      )}
      style={{ height, width }}
    />
  );
};

export interface SkeletonTextProps {
  lines?: number | undefined;

  lastLineWidth?: string | undefined;
  className?: string | undefined;
}

export const SkeletonText = ({
  lines = 1,
  lastLineWidth = "60%",
  className,
}: SkeletonTextProps) => {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.875rem"
          width={i === lines - 1 ? lastLineWidth : "100%"}
        />
      ))}
    </div>
  );
};

export interface SkeletonCardProps {
  className?: string | undefined;

  withMedia?: boolean | undefined;
}

export const SkeletonCard = ({
  className,
  withMedia = false,
}: SkeletonCardProps) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 p-md border border-border rounded-lg bg-surface",
        className,
      )}
    >
      {withMedia && <Skeleton height="2.5rem" width="2.5rem" radius="full" />}
      <SkeletonText lines={3} />
    </div>
  );
};

export interface SkeletonTableProps {
  rows?: number | undefined;
  columns?: number | undefined;
  density?: TableDensity | undefined;
  className?: string | undefined;
}

export const SkeletonTable = ({
  rows = 5,
  columns = 4,
  density = "comfortable",
  className,
}: SkeletonTableProps) => {
  return (
    <div className={cn("w-full", className)} aria-hidden="true">
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className={cn(
            "flex items-center gap-4 border-b border-divider last:border-b-0",
            CELL_PADDING[density],
          )}
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} height="0.875rem" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
};
