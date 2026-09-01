import { ValidationError } from "@/core/errors";
import type { PricedLine } from "@/modules/orders/pricing/pricing-pipeline";

export interface ComboSlotSelection {
  slotId: string;
  optionIds: string[];
}

export interface ComboDefinition {
  pricePolicy: "FIXED" | "PERCENT_OFF_SUM";
  fixedPrice: number | null;
  percentOff: number | null;
  slots: Array<{
    id: string;
    name: string;
    minSelections: number;
    maxSelections: number;
    options: Array<{ id: string; basePrice: number; upcharge: number }>;
  }>;
}

const cents = (value: number) => {
  return Math.round(value * 100);
};

export const allocateComboTotal = (
  lines: PricedLine[],
  total: number,
): PricedLine[] => {
  if (!lines.length) return lines;

  const target = cents(total);
  const weights = lines.map((line) => Math.max(0, cents(line.subtotal)));
  const weightSum = weights.reduce((sum, value) => sum + value, 0);
  const raw = weights.map((weight) =>
    weightSum ? (target * weight) / weightSum : target / lines.length,
  );
  const allocated = raw.map(Math.floor);
  const remainder = target - allocated.reduce((sum, value) => sum + value, 0);
  const allocationOrder = raw
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  for (let i = 0; i < remainder; i++) {
    allocated[allocationOrder[i % allocationOrder.length]!.index]!++;
  }

  return lines.map((line, index) => {
    const originalSubtotal = line.subtotal;
    const lineSubtotal = allocated[index]! / 100;
    const quantity = line.quantity || 1;
    return {
      ...line,
      unitPrice: lineSubtotal / quantity,
      subtotal: lineSubtotal,
      pricingAttribution: {
        ...line.pricingAttribution,
        COMBO: lineSubtotal - originalSubtotal,
      },
    };
  });
};

export const priceCombo = (
  combo: ComboDefinition,
  selections: ComboSlotSelection[],
) => {
  let componentSum = 0;
  let upcharges = 0;

  for (const slot of combo.slots) {
    const chosen =
      selections.find((selection) => selection.slotId === slot.id)?.optionIds ??
      [];
    if (
      chosen.length < slot.minSelections ||
      chosen.length > slot.maxSelections
    ) {
      throw new ValidationError(
        `${slot.name} requires ${slot.minSelections}–${slot.maxSelections} selections`,
      );
    }
    for (const optionId of chosen) {
      const option = slot.options.find(
        (candidate) => candidate.id === optionId,
      );
      if (!option) throw new ValidationError(`Invalid option for ${slot.name}`);
      componentSum += option.basePrice;
      upcharges += option.upcharge;
    }
  }

  const policyPrice =
    combo.pricePolicy === "FIXED"
      ? (combo.fixedPrice ?? 0)
      : componentSum * (1 - (combo.percentOff ?? 0) / 100);
  return {
    total: Math.round((policyPrice + upcharges) * 100) / 100,
    componentSum,
    upcharges,
  };
};
