import type { ReactNode } from "react";
import * as RadixContextMenu from "@radix-ui/react-context-menu";
import { cn } from "../../utils/cn";
import {
  type MenuEntry,
  menuContentClasses,
  menuItemClasses,
  menuSeparatorClasses,
  MenuItemContent,
} from "./shared";

export interface ContextMenuProps {
  children: ReactNode;
  items: MenuEntry[];
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function ContextMenu({
  children,
  items,
  disabled,
  className,
}: ContextMenuProps) {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger
        asChild
        {...(disabled !== undefined && { disabled })}
      >
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className={cn(menuContentClasses, className)}>
          {items.map((entry, i) =>
            entry.type === "separator" ? (
              <RadixContextMenu.Separator
                key={i}
                className={menuSeparatorClasses}
              />
            ) : (
              <RadixContextMenu.Item
                key={entry.label}
                {...(entry.disabled !== undefined && {
                  disabled: entry.disabled,
                })}
                onSelect={entry.onSelect}
                className={menuItemClasses(entry.danger)}
              >
                <MenuItemContent {...entry} />
              </RadixContextMenu.Item>
            ),
          )}
        </RadixContextMenu.Content>
      </RadixContextMenu.Portal>
    </RadixContextMenu.Root>
  );
}
