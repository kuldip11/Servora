import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../utils/cn";
import {
  overlayPanelClasses,
  overlayScrimClasses,
  OverlayHeader,
} from "./shared";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;

  size?: "sm" | "md" | "lg" | "xl" | undefined;

  footer?: ReactNode | undefined;

  preventDismiss?: boolean | undefined;

  description?: string | undefined;
  contentClassName?: string | undefined;
  bodyClassName?: string | undefined;
  footerClassName?: string | undefined;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

const dialogAnimationClasses = cn(
  "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate",
  "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  "data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
);

export const Dialog = ({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
  preventDismiss,
  description,
  contentClassName,
  bodyClassName,
  footerClassName,
}: DialogProps) => {
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
            dialogAnimationClasses,
            "fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2",
            "w-[calc(100vw-2rem)] rounded-xl flex flex-col max-h-[85vh]",
            SIZE_CLASSES[size],
            contentClassName,
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
          <div className={cn("p-6 overflow-y-auto", bodyClassName)}>
            {children}
          </div>
          {footer && (
            <div
              className={cn(
                "px-6 py-4 border-t border-border shrink-0 flex justify-end gap-2",
                footerClassName,
              )}
            >
              {footer}
            </div>
          )}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};

export const Modal = Dialog;
export type ModalProps = DialogProps;
