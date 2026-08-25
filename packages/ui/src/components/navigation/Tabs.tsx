import type { ReactNode } from 'react';
import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../utils/cn';

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean | undefined;
}

export interface TabsProps {
  items: TabItem[];
  /** Controlled active tab. Pair with `onValueChange`. */
  value?: string | undefined;
  /** Uncontrolled initial tab, ignored once `value` is passed. */
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  className?: string | undefined;
  /** Accessible name for the tab list, read by screen readers before each
   * tab (e.g. "Menu sections, tab list"). @default 'Tabs' — kept generic
   * so an unlabeled `Tabs` still has *some* name rather than none, but a
   * page with more than one `Tabs` (or where "Tabs" doesn't say what
   * they're for) should pass something specific. */
  'aria-label'?: string | undefined;
}

/**
 * Declarative `items: TabItem[]` API (same shape convention as
 * `DropdownMenu`'s `items`, Phase 5) around
 * `@radix-ui/react-tabs` — same Radix-everywhere approach as every
 * other Phase 4/5/6 component. Radix gives roving-tabindex keyboard
 * nav (arrow keys move focus + selection between tabs, Home/End jump
 * to the first/last) for free.
 */
export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  'aria-label': ariaLabel = 'Tabs',
}: TabsProps) {
  const resolvedDefaultValue = defaultValue ?? items[0]?.value;
  return (
    <RadixTabs.Root
      {...(value !== undefined && { value })}
      {...(resolvedDefaultValue !== undefined && { defaultValue: resolvedDefaultValue })}
      {...(onValueChange !== undefined && { onValueChange })}
      {...(className !== undefined && { className })}
    >
      <RadixTabs.List className="flex items-center gap-1 border-b border-border" aria-label={ariaLabel}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 border-transparent -mb-px transition-colors duration-fast ease-standard outline-none',
              'text-text-secondary hover:text-text-primary',
              'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset',
              'disabled:opacity-50 disabled:pointer-events-none',
              'data-[state=active]:text-primary data-[state=active]:border-primary',
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="pt-4 outline-none">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
