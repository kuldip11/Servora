import type { CustomerMenuItem } from "../../api";
import type { SelectedOption } from "./pricing";

export function normalizeSelectedOptions(
  selectedOptions: SelectedOption[],
): SelectedOption[] {
  return [...selectedOptions]
    .filter((selection) => selection.quantity > 0)
    .sort((a, b) => a.optionId.localeCompare(b.optionId));
}

export function validateItemConfiguration(
  item: CustomerMenuItem,
  variantId: string | undefined,
  selectedOptions: SelectedOption[],
): string | null {
  if (item.variants.length > 0 && !variantId) {
    return "Choose an option before adding this item.";
  }

  const selectedByGroup = new Map<string, SelectedOption[]>();
  for (const selection of selectedOptions) {
    const link = item.modifierGroupLinks.find(({ group }) =>
      group.options.some((option) => option.id === selection.optionId),
    );
    if (!link) return "One of the selected options is no longer available.";

    const option = link.group.options.find(
      (value) => value.id === selection.optionId,
    );
    if (!option?.isAvailable)
      return `${option?.name ?? "This option"} is no longer available.`;
    if (selection.quantity < 1 || selection.quantity > option.maxQuantity) {
      return `${option.name} allows up to ${option.maxQuantity} selection(s).`;
    }

    const current = selectedByGroup.get(link.group.id) ?? [];
    if (current.some((value) => value.optionId === selection.optionId)) {
      return `${option.name} was selected more than once.`;
    }
    selectedByGroup.set(link.group.id, [...current, selection]);
  }

  for (const { group } of item.modifierGroupLinks) {
    const selected = selectedByGroup.get(group.id) ?? [];
    if (selected.length < group.minSelections) {
      return `Choose at least ${group.minSelections} option(s) from ${group.name}.`;
    }
    if (group.maxSelections != null && selected.length > group.maxSelections) {
      return `Choose at most ${group.maxSelections} option(s) from ${group.name}.`;
    }
    if (group.selectionType === "SINGLE" && selected.length > 1) {
      return `Choose only one option from ${group.name}.`;
    }
  }

  return null;
}

export function canAddItemConfiguration(
  item: CustomerMenuItem,
  variantId: string | undefined,
  selectedOptions: SelectedOption[],
): boolean {
  return validateItemConfiguration(item, variantId, selectedOptions) === null;
}
