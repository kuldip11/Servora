import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "../Button";

export interface FilterBarProps {
  children: ReactNode;

  onClearAll?: (() => void) | undefined;
  className?: string | undefined;
}

export const FilterBar = ({
  children,
  onClearAll,
  className,
}: FilterBarProps) => {
  return (
    <div className={cn("flex items-center gap-3 flex-wrap", className)}>
      {children}
      {onClearAll && (
        <Button variant="ghost" size="sm" onClick={onClearAll}>
          <X aria-hidden="true" className="w-3.5 h-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  );
};
