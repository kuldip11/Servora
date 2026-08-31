import type { ReactNode } from "react";
import * as RadixPopover from "@radix-ui/react-popover";
import { cn } from "../../utils/cn";
import { menuContentClasses } from "./shared";

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
  align?: "start" | "center" | "end" | undefined;
  side?: "top" | "right" | "bottom" | "left" | undefined;
  className?: string | undefined;
}

export function Popover({
  trigger,
  children,
  open,
  onOpenChange,
  align = "center",
  side = "bottom",
  className,
}: PopoverProps) {
  return (
    <RadixPopover.Root
      {...(open !== undefined && { open })}
      {...(onOpenChange !== undefined && { onOpenChange })}
    >
      <RadixPopover.Trigger asChild>{trigger}</RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content
          align={align}
          side={side}
          sideOffset={6}
          className={cn(menuContentClasses, "p-4", className)}
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
}
