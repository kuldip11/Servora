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

/**
 * General-purpose popover for arbitrary content — a filter panel, an
 * info tooltip-with-actions, a quick-edit form — anchored to a
 * trigger element. Built on `@radix-ui/react-popover`, already a
 * dependency as of Phase 4, but this is a distinct, standalone
 * component from that phase's internal use of the same primitive:
 * `SelectMenu`/`Combobox`/etc. use `Popover` purely as unstyled
 * positioning/dismiss plumbing around a hand-rolled virtualized
 * listbox and don't expose it as something a consumer composes with
 * arbitrary children. This one does — pass any `children`.
 *
 * Supports both uncontrolled (just render it, `Popover.Trigger`
 * manages its own open state) and controlled (`open`/`onOpenChange`)
 * usage, matching Radix's own Popover API shape.
 */
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
