import { ValidationError } from "../../../core/errors";
import type { PricingContext } from "../../orders/pricing/pricing-pipeline";
import { pricingPipeline } from "../../orders/pricing/pricing-pipeline";
import { priceCombo } from "./combo-pricing";

export interface ComboBuilderOptionInput {
  menuItemId: string;
  variantId?: string | undefined;
  upcharge?: number | undefined;
}

export interface ComboBuilderSlotInput {
  name: string;
  minSelections: number;
  maxSelections: number;
  options: ComboBuilderOptionInput[];
}

export interface ComboBuilderPreviewInput {
  pricePolicy: "FIXED" | "PERCENT_OFF_SUM";
  fixedPrice?: number | undefined;
  percentOff?: number | undefined;
  slots: ComboBuilderSlotInput[];
  selections?: Array<{ slotIndex: number; optionIndexes: number[] }> | undefined;
}

function validatePolicy(input: ComboBuilderPreviewInput) {
  if (input.pricePolicy === "FIXED") {
    if (input.fixedPrice == null || !Number.isFinite(input.fixedPrice) || input.fixedPrice < 0) {
      throw new ValidationError("A fixed combo price is required");
    }
  } else if (
    input.percentOff == null ||
    !Number.isFinite(input.percentOff) ||
    input.percentOff < 0 ||
    input.percentOff > 100
  ) {
    throw new ValidationError("Percent off must be between 0 and 100");
  }
}

/**
 * H4 preview path. This deliberately reuses PricingPipeline stages 1-3 and
 * the exact C9 stage-4 `priceCombo` function. It contains no independent
 * price arithmetic, so an unsaved preview cannot drift from real combo
 * resolution for the same slot/option selection.
 */
export async function previewComboConfiguration(
  context: PricingContext,
  input: ComboBuilderPreviewInput,
) {
  validatePolicy(input);
  if (!input.slots.length) throw new ValidationError("A combo requires at least one slot");

  const chosenBySlot = new Map<number, number[]>();
  for (const selection of input.selections ?? []) {
    if (!Number.isInteger(selection.slotIndex) || selection.slotIndex < 0 || selection.slotIndex >= input.slots.length) {
      throw new ValidationError("Invalid combo slot selection");
    }
    if (chosenBySlot.has(selection.slotIndex)) throw new ValidationError("Duplicate combo slot selection");
    if (new Set(selection.optionIndexes).size !== selection.optionIndexes.length) {
      throw new ValidationError("Duplicate combo option selection");
    }
    chosenBySlot.set(selection.slotIndex, selection.optionIndexes);
  }

  const pricingInputs: Array<{ menuItemId: string; variantId?: string; quantity: number }> = [];
  const selectedKeys: Array<{ slotIndex: number; optionIndex: number }> = [];
  const stage4Selections: Array<{ slotId: string; optionIds: string[] }> = [];

  input.slots.forEach((slot, slotIndex) => {
    if (!slot.name.trim()) throw new ValidationError("Every combo slot requires a name");
    if (!Number.isInteger(slot.minSelections) || !Number.isInteger(slot.maxSelections) || slot.minSelections < 0 || slot.maxSelections < 1 || slot.minSelections > slot.maxSelections) {
      throw new ValidationError(`${slot.name} has invalid selection limits`);
    }
    if (!slot.options.length) throw new ValidationError(`${slot.name} requires at least one option`);
    const chosen = chosenBySlot.get(slotIndex) ?? Array.from({ length: slot.minSelections }, (_, index) => index);
    if (chosen.length < slot.minSelections || chosen.length > slot.maxSelections) {
      throw new ValidationError(`${slot.name} requires ${slot.minSelections}–${slot.maxSelections} selections`);
    }
    const optionIds: string[] = [];
    for (const optionIndex of chosen) {
      const option = slot.options[optionIndex];
      if (!option) throw new ValidationError(`Invalid option for ${slot.name}`);
      pricingInputs.push({
        menuItemId: option.menuItemId,
        ...(option.variantId ? { variantId: option.variantId } : {}),
        quantity: 1,
      });
      selectedKeys.push({ slotIndex, optionIndex });
      optionIds.push(`option-${slotIndex}-${optionIndex}`);
    }
    stage4Selections.push({ slotId: `slot-${slotIndex}`, optionIds });
  });

  const priced = await pricingPipeline.price(context, pricingInputs);
  const priceByKey = new Map<string, number>();
  selectedKeys.forEach((key, index) => priceByKey.set(`${key.slotIndex}:${key.optionIndex}`, priced.lines[index]!.unitPrice));

  const stage4 = priceCombo(
    {
      pricePolicy: input.pricePolicy,
      fixedPrice: input.fixedPrice ?? null,
      percentOff: input.percentOff ?? null,
      slots: input.slots.map((slot, slotIndex) => ({
        id: `slot-${slotIndex}`,
        name: slot.name,
        minSelections: slot.minSelections,
        maxSelections: slot.maxSelections,
        options: slot.options.map((option, optionIndex) => ({
          id: `option-${slotIndex}-${optionIndex}`,
          basePrice: priceByKey.get(`${slotIndex}:${optionIndex}`) ?? 0,
          upcharge: option.upcharge ?? 0,
        })),
      })),
    },
    stage4Selections,
  );

  return {
    componentTotal: stage4.componentSum,
    upcharges: stage4.upcharges,
    resolvedTotal: stage4.total,
    lines: priced.lines,
    selections: stage4Selections,
  };
}
