import type { CustomerMenuItem } from "../../api";
import type { SelectedOption } from "./pricing";

export function normalizeSelectedOptions(
  selectedOptions: SelectedOption[],
): SelectedOption[] {
  return [...selectedOptions]
    .filter((selection) => selection.quantity > 0)
    .sort((a, b) => `${a.optionId}:${a.zoneLabel ?? "WHOLE"}`.localeCompare(`${b.optionId}:${b.zoneLabel ?? "WHOLE"}`));
}

export function validateItemConfiguration(
  item: CustomerMenuItem,
  variantId: string | undefined,
  selectedOptions: SelectedOption[],
): string | null {
  if (item.pricingMode === "WEIGHT_BASED" || item.pricingMode === "OPEN") {
    return "This item requires staff-assisted pricing.";
  }
  if (item.variants.length > 0 && !variantId) return "Choose an option before adding this item.";

  const selectedByGroupZone = new Map<string, SelectedOption[]>();
  for (const selection of selectedOptions) {
    const link = item.modifierGroupLinks.find(({ group }) => group.options.some((option) => option.id === selection.optionId));
    if (!link) return "One of the selected options is no longer available.";
    const option = link.group.options.find((value) => value.id === selection.optionId);
    if (!option?.isAvailable) return `${option?.name ?? "This option"} is no longer available.`;
    if (selection.quantity < 1 || selection.quantity > option.maxQuantity) return `${option.name} allows up to ${option.maxQuantity} selection(s).`;
    const zone = item.supportsZones ? (selection.zoneLabel ?? "WHOLE") : "WHOLE";
    const key = `${link.group.id}:${zone}`;
    const current = selectedByGroupZone.get(key) ?? [];
    if (current.some((value) => value.optionId === selection.optionId)) return `${option.name} was selected more than once in ${zone.toLowerCase()}.`;
    selectedByGroupZone.set(key, [...current, selection]);
  }

  const requiredZones = item.supportsZones ? ["LEFT", "RIGHT"] : ["WHOLE"];
  for (const { group } of item.modifierGroupLinks) {
    if (group.dependsOnOptionId && !selectedOptions.some((option) => option.optionId === group.dependsOnOptionId)) continue;
    for (const zone of requiredZones) {
      const selected = selectedByGroupZone.get(`${group.id}:${zone}`) ?? [];
      if (selected.length < group.minSelections) return `Choose at least ${group.minSelections} option(s) from ${group.name}${item.supportsZones ? ` for the ${zone.toLowerCase()} side` : ""}.`;
      if (group.maxSelections != null && selected.length > group.maxSelections) return `Choose at most ${group.maxSelections} option(s) from ${group.name}.`;
      if (group.selectionType === "SINGLE" && selected.length > 1) return `Choose only one option from ${group.name}.`;
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
