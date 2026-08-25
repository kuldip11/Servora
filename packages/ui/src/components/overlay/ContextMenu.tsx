import type { ReactNode } from 'react';
import * as RadixContextMenu from '@radix-ui/react-context-menu';
import { cn } from '../../utils/cn';
import {
  type MenuEntry,
  menuContentClasses,
  menuItemClasses,
  menuSeparatorClasses,
  MenuItemContent,
} from './shared';

export interface ContextMenuProps {
  children: ReactNode;
  items: MenuEntry[];
  disabled?: boolean | undefined;
  className?: string | undefined;
}

/**
 * Right-click menu. Same declarative `items: MenuEntry[]` shape as
 * `DropdownMenu` (`overlay/shared.tsx`) — the two Radix packages
 * expose near-identical `Item`/`Separator` primitives, so one item
 * type serves both instead of a second menu API to learn. Wraps
 * `children` directly (the area that should respond to right-click),
 * unlike `DropdownMenu`'s separate `trigger` prop — that's Radix's own
 * `ContextMenu.Trigger` shape, not a stylistic choice made here.
 */
export function ContextMenu({ children, items, disabled, className }: ContextMenuProps) {
  return (
    <RadixContextMenu.Root>
      <RadixContextMenu.Trigger asChild {...(disabled !== undefined && { disabled })}>
        {children}
      </RadixContextMenu.Trigger>
      <RadixContextMenu.Portal>
        <RadixContextMenu.Content className={cn(menuContentClasses, className)}>
          {items.map((entry, i) =>
            entry.type === 'separator' ? (
              <RadixContextMenu.Separator key={i} className={menuSeparatorClasses} />
            ) : (
              <RadixContextMenu.Item
                key={entry.label}
                {...(entry.disabled !== undefined && { disabled: entry.disabled })}
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
