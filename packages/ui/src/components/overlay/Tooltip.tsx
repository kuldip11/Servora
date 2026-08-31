import type { ReactNode } from "react";
import * as RadixTooltip from "@radix-ui/react-tooltip";
import { cn } from "../../utils/cn";

export interface TooltipProps {
  trigger: ReactNode;
  content: ReactNode;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  align?: "start" | "center" | "end" | undefined;
}

const tooltipAnimationClasses = cn(

  "data-[state=delayed-open]:animate-in data-[state=instant-open]:animate-in",
  "data-[state=delayed-open]:fade-in-0 data-[state=instant-open]:fade-in-0",
  "data-[state=delayed-open]:zoom-in-95 data-[state=instant-open]:zoom-in-95",
  "data-[state=delayed-open]:duration-fast data-[state=instant-open]:duration-fast",
  "data-[state=delayed-open]:ease-decelerate data-[state=instant-open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1",
  "data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1",
);

export function Tooltip({
  trigger,
  content,
  side = "top",
  align = "center",
}: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{trigger}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          align={align}
          sideOffset={6}
          className={cn(
            "z-50 rounded-md bg-gray-900 px-2.5 py-1.5 text-xs text-white shadow-dropdown",
            "max-w-xs",
            tooltipAnimationClasses,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-gray-900" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}

export const TooltipProvider = RadixTooltip.Provider;
