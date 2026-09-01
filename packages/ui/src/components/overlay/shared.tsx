import type { ComponentType, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";

export const overlayPanelClasses = cn(
  "bg-surface shadow-elevated border border-border",
);

export const fadeAnimationClasses = cn(
  "data-[state=open]:animate-in data-[state=open]:fade-in-0",
  "data-[state=open]:duration-base data-[state=open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
);

export const OverlayHeader = ({
  title,
  onClose,
  className,
}: {
  title: ReactNode;
  onClose: () => void;
  className?: string | undefined;
}) => {
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
};

export const overlayScrimClasses = cn(
  "fixed inset-0 z-50 bg-black/40",
  fadeAnimationClasses,
);

export interface MenuItemDef {
  type?: "item" | undefined;
  label: string;
  onSelect: () => void;
  icon?: ComponentType<{ className?: string }> | undefined;
  danger?: boolean | undefined;
  disabled?: boolean | undefined;

  shortcut?: string | undefined;
}
export interface MenuSeparatorDef {
  type: "separator";
}
export type MenuEntry = MenuItemDef | MenuSeparatorDef;

export const menuContentClasses = cn(
  "z-50 min-w-[12rem] overflow-hidden rounded-md border border-border bg-surface shadow-dropdown py-1",
  "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
  "data-[state=open]:duration-fast data-[state=open]:ease-decelerate",
  "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
  "data-[state=closed]:duration-fast data-[state=closed]:ease-accelerate",
  "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2",
  "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2",
);

export const menuItemClasses = (danger?: boolean) => {
  return cn(
    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer select-none outline-none",
    "data-[disabled]:opacity-50 data-[disabled]:cursor-not-allowed data-[disabled]:pointer-events-none",
    "data-[highlighted]:bg-surface-secondary",
    danger ? "text-danger" : "text-text-primary",
  );
};

export const MenuItemContent = ({
  icon: Icon,
  label,
  shortcut,
}: MenuItemDef) => {
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
};

export const menuSeparatorClasses = "my-1 h-px bg-divider";
