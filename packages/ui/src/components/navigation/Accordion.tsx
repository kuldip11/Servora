import type { ReactNode } from "react";
import * as RadixAccordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

export interface AccordionItem {
  value: string;
  title: ReactNode;
  content: ReactNode;
  disabled?: boolean | undefined;
}

interface AccordionBaseProps {
  items: AccordionItem[];
  className?: string | undefined;
}

interface AccordionSingleProps extends AccordionBaseProps {

  type?: "single";

  collapsible?: boolean | undefined;
  value?: string | undefined;
  defaultValue?: string | undefined;
  onValueChange?: ((value: string) => void) | undefined;
}

interface AccordionMultipleProps extends AccordionBaseProps {
  type: "multiple";
  value?: string[] | undefined;
  defaultValue?: string[] | undefined;
  onValueChange?: ((value: string[]) => void) | undefined;
}

export type AccordionProps = AccordionSingleProps | AccordionMultipleProps;

export function Accordion(props: AccordionProps) {
  const { items, className } = props;

  if (props.type === "multiple") {
    const { value, defaultValue, onValueChange } = props;
    return (
      <RadixAccordion.Root
        type="multiple"
        {...(value !== undefined && { value })}
        {...(defaultValue !== undefined && { defaultValue })}
        {...(onValueChange !== undefined && { onValueChange })}
        className={cn("flex flex-col", className)}
      >
        {items.map((item) => (
          <AccordionRow key={item.value} item={item} />
        ))}
      </RadixAccordion.Root>
    );
  }

  const { value, defaultValue, onValueChange, collapsible = true } = props;
  return (
    <RadixAccordion.Root
      type="single"
      collapsible={collapsible}
      {...(value !== undefined && { value })}
      {...(defaultValue !== undefined && { defaultValue })}
      {...(onValueChange !== undefined && { onValueChange })}
      className={cn("flex flex-col", className)}
    >
      {items.map((item) => (
        <AccordionRow key={item.value} item={item} />
      ))}
    </RadixAccordion.Root>
  );
}

function AccordionRow({ item }: { item: AccordionItem }) {
  return (
    <RadixAccordion.Item
      value={item.value}
      {...(item.disabled !== undefined && { disabled: item.disabled })}
      className="border-b border-border last:border-b-0"
    >
      <RadixAccordion.Header>
        <RadixAccordion.Trigger
          className={cn(
            "group flex w-full items-center justify-between gap-4 py-3.5 text-left text-sm font-medium outline-none",
            "text-text-primary transition-colors duration-fast ease-standard",
            "focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
            "disabled:opacity-50 disabled:pointer-events-none",
          )}
        >
          {item.title}
          <ChevronDown className="w-4 h-4 shrink-0 text-text-secondary transition-transform duration-fast ease-standard group-data-[state=open]:rotate-180" />
        </RadixAccordion.Trigger>
      </RadixAccordion.Header>
      {

                                                                  }
      <RadixAccordion.Content
        className={cn(
          "overflow-hidden text-sm text-text-secondary data-[state=open]:pb-4",
          "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        )}
      >
        {item.content}
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  );
}
