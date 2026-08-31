import type { ReactNode } from "react";
import * as RadixTabs from "@radix-ui/react-tabs";
import { cn } from "../../utils/cn";

export interface TabItem {
  value: string;
  label: ReactNode;
  content: ReactNode;
  disabled?: boolean | undefined;
}

export interface TabsProps {
  items: TabItem[];

  value?: string | undefined;

  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
  className?: string | undefined;

  "aria-label"?: string | undefined;
}

export function Tabs({
  items,
  value,
  defaultValue,
  onValueChange,
  className,
  "aria-label": ariaLabel = "Tabs",
}: TabsProps) {
  const resolvedDefaultValue = defaultValue ?? items[0]?.value;
  return (
    <RadixTabs.Root
      {...(value !== undefined && { value })}
      {...(resolvedDefaultValue !== undefined && {
        defaultValue: resolvedDefaultValue,
      })}
      {...(onValueChange !== undefined && { onValueChange })}
      {...(className !== undefined && { className })}
    >
      <RadixTabs.List
        className="flex items-center gap-1 border-b border-border"
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            disabled={item.disabled}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 border-transparent -mb-px transition-colors duration-fast ease-standard outline-none",
              "text-text-secondary hover:text-text-primary",
              "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset",
              "disabled:opacity-50 disabled:pointer-events-none",
              "data-[state=active]:text-primary data-[state=active]:border-primary",
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content
          key={item.value}
          value={item.value}
          className="pt-4 outline-none"
        >
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  );
}
