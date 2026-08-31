import type { ReactNode } from "react";
import * as RadixDialog from "@radix-ui/react-dialog";
import { cn } from "../../utils/cn";
import {
  overlayPanelClasses,
  overlayScrimClasses,
  OverlayHeader,
} from "./shared";

/** Phase 8: same idea as `Drawer`'s side-aware slide, just fixed to "bottom"
 * since that's the sheet's only anchor edge. */
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
  /** Max height before the body scrolls. @default '85vh' */
  maxHeight?: string | undefined;
  footer?: ReactNode | undefined;
  /** See `Dialog`'s `description` prop doc — same `sr-only`
   * `RadixDialog.Description` pattern, optional. */
  description?: string | undefined;
}

/**
 * Mobile-oriented panel anchored to the bottom edge, full width, rounded
 * top corners — the shape the plan calls for as the Waiter App's
 * primary overlay pattern (`the design-system contract`'s Phase 11 note: "Bottom
 * sheets over dialogs" for that app). Same `@radix-ui/react-dialog`
 * foundation as `Dialog`/`Drawer` (see `overlay/shared.tsx`).
 *
 * **Deliberately does not implement drag-to-dismiss.** A real
 * swipe-down gesture needs pointer-tracking physics (velocity
 * threshold, rubber-banding, sync with the Radix-managed open state)
 * that's a meaningfully separate chunk of work from "wire up a Radix
 * primitive with token styling," which is what the rest of this phase
 * is. Ships today with the header's explicit close button and the
 * standard Escape/outside-click/backdrop-tap dismissal Radix already
 * provides — genuinely usable, just without the swipe affordance a
 * native-feeling sheet would have. Worth a dedicated pass (a small
 * library like `vaul`, or hand-rolled pointer events) rather than a
 * rushed version bolted on here.
 */
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
