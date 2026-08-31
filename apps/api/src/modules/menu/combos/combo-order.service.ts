import { db } from "@/db";
import { ValidationError } from "@/core/errors";
import type {
  OrderItemInput,
  PricedLine,
  PricingContext,
} from "@/modules/orders/pricing/pricing-pipeline";
import { pricingPipeline } from "@/modules/orders/pricing/pricing-pipeline";
import { allocateComboTotal, priceCombo } from "./combo-pricing";

export interface ComboOrderSelection {
  comboId: string;
  quantity?: number | undefined;
  courseNumber?: number | undefined;
  selections: Array<{ slotId: string; optionIds: string[] }>;
}

export interface PricedComboOrder {
  lines: PricedLine[];
  subtotal: number;
  taxAmount: number;
}

const orderItemFulfillmentType = (
  fulfillmentType: PricingContext["fulfillmentType"],
): "DINE_IN" | "TAKEAWAY" => {
  return fulfillmentType === "DINE_IN" ? "DINE_IN" : "TAKEAWAY";
};

export const priceComboOrders = async (
  context: PricingContext,
  requested: ComboOrderSelection[],
): Promise<PricedComboOrder> => {
  const allLines: PricedLine[] = [];
  let subtotal = 0;
  let taxAmount = 0;

  for (const request of requested) {
    const combo = await db.query.combos.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, request.comboId),
          eq(table.tenantId, context.tenantId),
        ),
      with: { slots: { with: { options: true } } },
    });
    if (!combo || combo.status !== "ACTIVE") {
      throw new ValidationError("Combo not found or unavailable");
    }

    const quantity = request.quantity ?? 1;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      throw new ValidationError("Invalid combo quantity");
    }

    const selectionsBySlot = new Map<
      string,
      ComboOrderSelection["selections"][number]
    >();
    for (const selection of request.selections) {
      if (selectionsBySlot.has(selection.slotId)) {
        throw new ValidationError("Duplicate combo slot selection");
      }
      if (new Set(selection.optionIds).size !== selection.optionIds.length) {
        throw new ValidationError("Duplicate combo option selection");
      }
      selectionsBySlot.set(selection.slotId, selection);
    }

    const componentInputs: OrderItemInput[] = [];
    const componentOptionIds: string[] = [];
    const pricingSlots = combo.slots.map((slot) => ({
      id: slot.id,
      name: slot.name,
      minSelections: slot.minSelections,
      maxSelections: slot.maxSelections,
      options: slot.options.map((option) => ({
        id: option.id,
        basePrice: 0,
        upcharge: Number(option.upcharge),
      })),
    }));

    for (const selection of request.selections) {
      if (!combo.slots.some((slot) => slot.id === selection.slotId)) {
        throw new ValidationError("Invalid combo slot selection");
      }
    }

    for (const slot of combo.slots) {
      const chosen = selectionsBySlot.get(slot.id)?.optionIds ?? [];
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
        if (!option) {
          throw new ValidationError(`Invalid option for ${slot.name}`);
        }
        componentInputs.push({
          menuItemId: option.menuItemId,
          variantId: option.variantId ?? undefined,
          quantity,
          courseNumber: request.courseNumber,
          fulfillmentType: orderItemFulfillmentType(context.fulfillmentType),
        });
        componentOptionIds.push(option.id);
      }
    }

    const priced = await pricingPipeline.price(context, componentInputs);
    let pricedIndex = 0;
    for (const slot of pricingSlots) {
      const chosen = selectionsBySlot.get(slot.id)?.optionIds ?? [];
      for (const optionId of chosen) {
        const option = slot.options.find(
          (candidate) => candidate.id === optionId,
        );
        option!.basePrice = priced.lines[pricedIndex++]!.unitPrice;
      }
    }

    const stage4 = priceCombo(
      {
        pricePolicy: combo.pricePolicy,
        fixedPrice: combo.fixedPrice == null ? null : Number(combo.fixedPrice),
        percentOff: combo.percentOff == null ? null : Number(combo.percentOff),
        slots: pricingSlots,
      },
      request.selections,
    );

    const authoritativeTotal = stage4.total * quantity;
    const groupId = crypto.randomUUID();
    const children = allocateComboTotal(priced.lines, authoritativeTotal).map(
      (line, index) => ({
        ...line,
        comboId: combo.id,
        comboGroupId: groupId,
        comboSlotOptionId: componentOptionIds[index],
        courseNumber: request.courseNumber,
      }),
    );

    const parent: PricedLine = {
      menuItemId: null,
      menuItemName: combo.name,
      quantity,
      unitPrice: stage4.total,
      subtotal: 0,
      taxRate: 0,
      fulfillmentType: orderItemFulfillmentType(context.fulfillmentType),
      modifiers: [],
      pricingAttribution: {
        BASE_PRICE: 0,
        VARIANT: 0,
        MODIFIER: 0,
        COMBO: authoritativeTotal,
      },
      comboId: combo.id,
      comboGroupId: groupId,
      courseNumber: request.courseNumber,
    };

    allLines.push(parent, ...children);
    subtotal += authoritativeTotal;
    taxAmount += children.reduce(
      (sum, line) => sum + (line.subtotal * line.taxRate) / 100,
      0,
    );
  }

  return { lines: allLines, subtotal, taxAmount };
};
