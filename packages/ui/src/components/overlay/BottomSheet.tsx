import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../utils/cn";
import {
  overlayPanelClasses,
  overlayScrimClasses,
  OverlayHeader,
} from "./shared";

const bottomSheetAnimationClasses =
  "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate " +
  "data-[state=open]:slide-in-from-bottom " +
  "data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate " +
  "data-[state=closed]:slide-out-to-bottom";

export interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;

  maxHeight?: string | undefined;
  footer?: ReactNode | undefined;

  description?: string | undefined;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = "85vh",
  footer,
  description,
}: BottomSheetProps) {
  return (
    <RadixDialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={overlayScrimClasses} />
        <RadixDialog.Content
          {...(description ? {} : { "aria-describedby": undefined })}
          className={cn(
            overlayPanelClasses,
            bottomSheetAnimationClasses,
            "fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl",
          )}
          style={{ maxHeight }}
        >
          <div
            className="flex justify-center pt-2 pb-1 shrink-0"
            aria-hidden="true"
          >
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <OverlayHeader
            title={
              <RadixDialog.Title className="text-lg font-semibold text-text-primary truncate">
                {title}
              </RadixDialog.Title>
            }
            onClose={onClose}
            className="border-b-0"
          />
          {description && (
            <RadixDialog.Description className="sr-only">
              {description}
            </RadixDialog.Description>
          )}
          <div className="flex-1 overflow-y-auto px-6 pb-6">{children}</div>
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
