import { Loader2 } from "lucide-react";
import { cn } from "../utils/cn";

export const Spinner = ({ className }: { className?: string }) => {
  return (
    <Loader2
      aria-hidden="true"
      className={cn("animate-spin text-text-secondary", className)}
    />
  );
};
