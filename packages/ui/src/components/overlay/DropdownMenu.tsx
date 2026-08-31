import type { ReactNode } from "react";
import * as RadixDropdownMenu from "@radix-ui/react-dropdown-menu";
import { cn } from "../../utils/cn";
import {
  type MenuEntry,
  menuContentClasses,
  menuItemClasses,
  menuSeparatorClasses,
  MenuItemContent,
} from "./shared";

export interface DropdownMenuProps {
  trigger: ReactNode;
  items: MenuEntry[];
  align?: "start" | "center" | "end" | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function DropdownMenu({
  trigger,
  items,
  align = "start",
  disabled,
  className,
}: DropdownMenuProps) {
  return (
    <RadixDropdownMenu.Root>
      <RadixDropdownMenu.Trigger asChild disabled={disabled}>
        {trigger}
      </RadixDropdownMenu.Trigger>
      <RadixDropdownMenu.Portal>
        <RadixDropdownMenu.Content
          align={align}
          sideOffset={4}
          className={cn(menuContentClasses, className)}
        >
          {items.map((entry, i) =>
            entry.type === "separator" ? (
              <RadixDropdownMenu.Separator
                key={i}
                className={menuSeparatorClasses}
              />
            ) : (
              <RadixDropdownMenu.Item
                key={entry.label}
                {...(entry.disabled !== undefined && {
                  disabled: entry.disabled,
                })}
                onSelect={entry.onSelect}
                className={menuItemClasses(entry.danger)}
              >
                <MenuItemContent {...entry} />
              </RadixDropdownMenu.Item>
            ),
          )}
        </RadixDropdownMenu.Content>
      </RadixDropdownMenu.Portal>
    </RadixDropdownMenu.Root>
  );
}
