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

/**
 * Declarative action menu — `items` mirrors `SplitButton`'s existing
 * `actions: SplitButtonAction[]` shape (label/onSelect/icon/danger/
 * disabled) rather than introducing a second, incompatible menu API,
 * plus a `type: 'separator'` entry for grouping. Built on
 * `@radix-ui/react-dropdown-menu` per this phase's Radix-everywhere
 * approach (`overlay/shared.tsx`).
 *
 * **`SplitButton`'s dropdown should be re-pointed at this**, per the
 * carry-over note in `docs/design-system/README.md`'s Phase 3 section
 * ("once `DropdownMenu` exists... re-pointed at it instead of keeping
 * two dropdown implementations"). Not done in this pass — `SplitButton`
 * pairs a primary-action button with an attached chevron in one
 * visual unit, which doesn't map onto this component's single-trigger
 * shape without redesigning `SplitButton`'s own props too. Flagging
 * it here rather than doing a rushed partial merge; see `overlay/
 * README.md` note in the Phase 5 section of the main README for the
 * concrete follow-up.
 */
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
