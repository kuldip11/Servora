import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

export interface ToolbarProps {
  title?: ReactNode;

  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string | undefined;
}

export function Toolbar({ title, subtitle, actions, className }: ToolbarProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 flex-wrap",
        className,
      )}
    >
      {title !== undefined ? (
        <div>
          <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
          {subtitle !== undefined && (
            <p className="text-sm text-text-secondary mt-0.5">{subtitle}</p>
          )}
        </div>
      ) : (
        <div />
      )}
      {actions !== undefined && (
        <div className="flex items-center gap-2 flex-wrap">{actions}</div>
      )}
    </div>
  );
}
