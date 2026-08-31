import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../utils/cn";
import {
  overlayPanelClasses,
  overlayScrimClasses,
  OverlayHeader,
} from "./shared";

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;

  side?: "left" | "right" | undefined;

  size?: "sm" | "md" | "lg" | undefined;
  footer?: ReactNode | undefined;
  preventDismiss?: boolean | undefined;

  description?: string | undefined;
}

const WIDTH_CLASSES = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" };

function drawerAnimationClasses(side: "left" | "right") {
  return cn(
    "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate",
    "data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
    side === "right"
      ? "data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right"
      : "data-[state=open]:slide-in-from-left data-[state=closed]:slide-out-to-left",
  );
}

export function Drawer({
  open,
  onClose,
  title,
  children,
  side = "right",
  size = "md",
  footer,
  preventDismiss,
  description,
}: DrawerProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayScrimClasses} />
        <RadixDialog.Content
          onEscapeKeyDown={(e) => preventDismiss && e.preventDefault()}
          onPointerDownOutside={(e) => preventDismiss && e.preventDefault()}
          onInteractOutside={(e) => preventDismiss && e.preventDefault()}
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            overlayPanelClasses,
            drawerAnimationClasses(side),
            "fixed inset-y-0 z-50 flex flex-col w-full",
            side === "right" ? "right-0" : "left-0",
            WIDTH_CLASSES[size],
          )}
        >
          <OverlayHeader
            title={
              <RadixDialog.Title className="text-lg font-semibold text-text-primary truncate">
                {title}
              </RadixDialog.Title>
            }
            onClose={onClose}
          />
          {description && (
            <RadixDialog.Description className="sr-only">
              {description}
            </RadixDialog.Description>
          )}
          <div className="flex-1 overflow-y-auto p-6">{children}</div>
          {footer && (
            <div className="px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2">
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
