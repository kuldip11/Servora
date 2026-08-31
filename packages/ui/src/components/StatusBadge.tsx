import type { ReactNode } from "react";
import { cn } from "../utils/cn";

export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

const TONE_CLASSES: Record<StatusTone, string> = {
  success: "bg-success-surface text-success",
  warning: "bg-warning-surface text-warning",
  danger: "bg-danger-surface text-danger",
  info: "bg-info-surface text-info",
  neutral: "bg-surface-secondary text-text-secondary",
};

const DOT_CLASSES: Record<StatusTone, string> = {
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  neutral: "bg-text-disabled",
};

export interface StatusBadgeProps {
  label: ReactNode;

  tone?: StatusTone;

  dot?: boolean;
  className?: string;
}

export const StatusBadge = ({
  label,
  tone = "neutral",
  dot = true,
  className,
}: StatusBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
        TONE_CLASSES[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", DOT_CLASSES[tone])}
          aria-hidden="true"
        />
      )}
      {label}
    </span>
  );
};
