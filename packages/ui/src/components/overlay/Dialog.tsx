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
  /** @default 'md' */
  size?: "sm" | "md" | "lg" | "xl" | undefined;
  /** Optional action row rendered below `children`, e.g. Cancel/Confirm buttons. */
  footer?: ReactNode | undefined;
  /** Set for destructive confirmations where accidental dismissal should be
   * prevented — blocks Escape and outside-click, the close button still works. */
  preventDismiss?: boolean | undefined;
  /** Screen-reader-only supplementary text read after the title when the
   * dialog opens (Radix wires it to `Content`'s `aria-describedby`
   * automatically via `RadixDialog.Description`). Rendered visually hidden
   * (`sr-only`) — same pattern `CommandPalette` already uses — since most
   * dialogs' visible body content already explains itself to sighted users;
   * this is purely the non-visual equivalent. Optional: omit for dialogs
   * whose purpose is fully conveyed by `title` alone. */
  description?: string | undefined;
}

const SIZE_CLASSES = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-2xl",
};

/** Phase 8: `Dialog` is centered via a static `-translate-x-1/2
 * -translate-y-1/2`. `tailwindcss-animate`'s slide utilities compose with
 * that rather than fighting it — both write to the same
 * `--tw-translate-x`/`--tw-translate-y` variables Tailwind's core transform
 * utilities already use, so `slide-in-from-left-1/2`/`slide-in-from-top-
 * [48%]` animate *from* an offset relative to the static centering, not
 * instead of it (the same pattern shadcn/ui's own `Dialog` uses — verified
 * against their source rather than assumed, since getting this wrong
 * silently breaks centering only during the transition, easy to miss in
 * review). Zoom/fade layer on top of that same composed transform with no
 * conflict, since `zoom-*` only touches `--tw-scale-x/y`. */
const dialogAnimationClasses = cn(
  "data-[state=open]:animate-in data-[state=open]:duration-base data-[state=open]:ease-decelerate",
  "data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
  "data-[state=closed]:animate-out data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
);

/**
 * The plan's canonical `Dialog` (the design-system contract, Phase
 * 5): "upgrade existing `Modal` into `Dialog` rather than keeping
 * both." This **is** that upgrade, not a parallel component — it's a
 * straight rewrite onto `@radix-ui/react-dialog` (real focus trap,
 * focus restored to the trigger on close, Escape/outside-click both
 * wired for free) behind the *exact same* `open`/`onClose`/`title`/
 * `children`/`size` prop shape the old `Modal` had. Checked every one
 * of Modal's 13 existing call sites in `apps/web` before making this
 * change (`grep -n "<Modal" -A6` across the repo) — none use any prop
 * beyond those five, so this is a genuine drop-in: zero call sites
 * need to change, unlike `SelectMenu` in Phase 4 where the old and new
 * APIs were incompatible. `Modal` is kept as a back-compat alias below
 * (same pattern as `Input`/`TextInput` in Phase 3), but new code
 * should reach for `Dialog`.
 *
 * File moved from `components/Modal.tsx` to `components/overlay/
 * Dialog.tsx` as part of this rewrite, alongside its new Phase 5
 * siblings (`Drawer`, `BottomSheet`, etc.) — the old path no longer
 * exists.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  size = "md",
  footer,
  preventDismiss,
  description,
}: DialogProps) {
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
          <div className="p-6 overflow-y-auto">{children}</div>
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

/** Back-compat alias — see the `Dialog` doc comment above. Import path changed
 * from `@pos/ui`'s old `components/Modal` to `components/overlay/Dialog`, but
 * the package's public export (`import { Modal } from '@pos/ui'`) is unaffected. */
export const Modal = Dialog;
export type ModalProps = DialogProps;
