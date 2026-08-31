import type { ComponentType, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

/**
 * Shared foundation for Phase 5 — Overlay Components
 * (the design-system contract): `Dialog` (upgrades `Modal`),
 * `Drawer`, `BottomSheet`, `Popover`, `DropdownMenu`, `ContextMenu`,
 * `Tooltip`, `Toast`.
 *
 * Every one of these sits directly on the matching Radix primitive
 * (`@radix-ui/react-dialog`, `-dropdown-menu`, `-context-menu`,
 * `-tooltip`, `-toast`, plus `-popover` already added in Phase 4) —
 * the plan's exit criteria (focus trap, focus restore on close,
 * Escape/outside-click dismissal, all consistent) is exactly what
 * those primitives provide for free. Unlike Phase 4, there's no
 * virtualization constraint pushing away from the "obvious" Radix
 * component here, so this phase is mostly composition + token styling
 * on top of Radix, not new interaction logic.
 */

/** Panel chrome shared by `Dialog`, `Drawer`, and `BottomSheet` — the
 * three overlay types that render a bordered surface with a title row.
 *
 * No enter/exit animation classes on this shared constant: unlike
 * `overlayScrimClasses`/`menuContentClasses` below (a plain fade, or a
 * fade+zoom that's identical for every consumer), `Dialog`/`Drawer`/
 * `BottomSheet` each need a *different* transform in their enter/exit
 * animation (centered zoom vs. slide-from-an-edge vs. slide-from-
 * bottom) — see each file's own `ANIMATION_CLASSES`. Duration/easing
 * still come from the shared Phase 8 tokens (`duration-base`
 * `ease-decelerate` entering, `duration-fast ease-accelerate`
 * exiting — Material's own convention: entering surfaces settle in
 * gently, exiting ones leave quickly), just not the transform shape. */
export const overlayPanelClasses = cn(
  "bg-surface shadow-elevated border border-border",
);

/** Fade-only enter/exit — shared by every overlay's backdrop
 * (`overlayScrimClasses` below) since a scrim never has a "side" of
 * its own to slide from. `duration-base`/`ease-decelerate` on enter,
 * `duration-fast`/`ease-accelerate` on exit — same reasoning as
 * `overlayPanelClasses`' doc comment. */
export const fadeAnimationClasses = cn(
  "data-[state=open]:animate-in data-[state=open]:fade-in-0",
  "data-[state=open]:duration-base data-[state=open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
);

/** Renders the title node the caller supplies (already wrapped in the
 * right primitive — `RadixDialog.Title`, `RadixAlertDialog.Title`, or
 * plain text for a non-Radix-Title context) plus a close button.
 *
 * Deliberately does *not* own the heading element itself: an earlier
 * version rendered `<h3>{title}</h3>` and expected callers to wrap the
 * whole `OverlayHeader` in `<RadixDialog.Title asChild>`. That's
 * broken — Radix's `Title` generates an `id` and clones it onto its
 * `asChild` target so `Content`'s `aria-labelledby` actually resolves
 * to something, but `OverlayHeader` is a custom component that
 * doesn't forward unknown props down to the real `<h3>` DOM node, so
 * the `id` would land on `OverlayHeader`'s props and go nowhere. The
 * caller supplying an already-correct `<RadixDialog.Title>` element
 * sidesteps that entirely. */
export function OverlayHeader({
  title,
  onClose,
  className,
}: {
  title: ReactNode;
  onClose: () => void;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0",
        className,
      )}
    >
      <div className="min-w-0 truncate">{title}</div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="w-8 h-8 shrink-0 flex items-center justify-center rounded-md text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors duration-fast ease-standard focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export const overlayScrimClasses = cn(
  "fixed inset-0 z-50 bg-black/40",
  fadeAnimationClasses,
);

// --- Menus (DropdownMenu / ContextMenu) -----------------------------------
// Both Radix packages expose near-identical `Item`/`Separator`/`Label`
// primitives with the same className prop, so one declarative item
// shape + one set of classes serves both rather than duplicating a
// second "menu item" concept.

export interface MenuItemDef {
  type?: "item" | undefined;
  label: string;
  onSelect: () => void;
  icon?: ComponentType<{ className?: string }> | undefined;
  danger?: boolean | undefined;
  disabled?: boolean | undefined;
  /** Right-aligned hint text, e.g. a keyboard shortcut ("⌘K"). Display only. */
  shortcut?: string | undefined;
}
export interface MenuSeparatorDef {
  type: "separator";
}
export type MenuEntry = MenuItemDef | MenuSeparatorDef;

/** Shared by `Popover`, `DropdownMenu`, and `ContextMenu` (all three sit on a
 * Radix Popper-positioned `Content`, unlike `Dialog`/`Drawer`/`BottomSheet`
 * above) — Radix sets `data-side` to whichever edge it actually resolved to
 * after collision detection, so the slide direction always matches which way
 * the content actually opened, not just its `side` prop default.
 * `duration-fast` both ways (150ms) rather than `overlayPanelClasses`'
 * `duration-base`: these are small, frequent, close-to-the-cursor surfaces —
 * a menu that takes as long to open as a full dialog reads as sluggish. */
export const menuContentClasses = cn(
  "z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-surface shadow-dropdown py-1",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=open]:duration-fast data-[state=open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
  "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
);

export function menuItemClasses(danger?: boolean) {
  return cn(
    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none outline-none",
    "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none",
    "data-[highlighted]:bg-surface-secondary",
    danger ? "text-danger" : "text-text-primary",
  );
}

export function MenuItemContent({ icon: Icon, label, shortcut }: MenuItemDef) {
  return (
    <>
      {Icon && <Icon className="w-4 h-4 shrink-0" />}
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {shortcut && (
        <span className="text-xs text-text-secondary tracking-widest shrink-0">
          {shortcut}
        </span>
      )}
    </>
  );
}

export const menuSeparatorClasses = "my-1 h-px bg-divider";
