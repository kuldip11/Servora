import type {
  PricedLine,
  PricingAttribution,
  PricingContext,
  PricingReplayEvidence,
} from "./pricing/pricing.types";
import { pricingPipeline } from "./pricing/pricing-pipeline";
import type { PromotionStageOptions } from "./pricing/promotion-stage";

export interface StoredOrderLineForRepricing {
  id: string;
  menuItemId: string | null;
  menuItemName: string;
  variantId: string | null;
  variantName: string | null;
  quantity: number;
  unitPrice: string | number;
  subtotal: string | number;
  taxRate: string | number;
  taxMode?: "INCLUSIVE" | "EXCLUSIVE" | null;
  chefNotes?: string | null;
  seatLabel?: string | null;
  fulfillmentType: "DINE_IN" | "TAKEAWAY";
  comboId?: string | null;
  comboGroupId?: string | null;
  comboSlotOptionId?: string | null;
  weightQuantity?: string | number | null;
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null;
  manualPrice?: string | number | null;
  billingExcluded?: boolean | null;
  stationId?: string | null;
  menuChangeEventId?: string | null;
  pricingAttribution?: PricingAttribution | null;
  pricingReplayEvidence?: PricingReplayEvidence | null;
  modifiers?: Array<{
    modifierId: string;
    modifierGroupName?: string | null;
    name: string;
    price: string | number;
    quantity: number;
    zoneLabel?: string | null;
  }>;
}

export interface ExistingLinePricingUpdate {
  id: string;
  pricingAttribution: PricingAttribution;
  taxMode: "INCLUSIVE" | "EXCLUSIVE";
}

const stableAttribution = (
  item: StoredOrderLineForRepricing,
): PricingAttribution => {
  const source = item.pricingAttribution ?? {
    BASE_PRICE: Number(item.unitPrice),
    VARIANT: 0,
    MODIFIER: 0,
  };
  const {
    PROMOTION: _promotion,
    PROMOTION_DETAILS: _promotionDetails,
    LOYALTY: _loyalty,
    LOYALTY_DETAILS: _loyaltyDetails,
    TAXABLE_BASE: _taxableBase,
    ...stable
  } = source;
  return { ...stable };
};

export const storedOrderLineToStage4Snapshot = (
  item: StoredOrderLineForRepricing,
): PricedLine => {
  return {
    menuItemId: item.menuItemId,
    menuItemName: item.menuItemName,
    ...(item.variantId ? { variantId: item.variantId } : {}),
    ...(item.variantName ? { variantName: item.variantName } : {}),
    quantity: item.quantity,
    ...(item.weightQuantity != null
      ? { weightQuantity: Number(item.weightQuantity) }
      : {}),
    ...(item.weightUnit ? { weightUnit: item.weightUnit } : {}),
    ...(item.manualPrice != null
      ? { manualPrice: Number(item.manualPrice) }
      : {}),
    ...(item.billingExcluded ? { billingExcluded: true } : {}),
    unitPrice: Number(item.unitPrice),
    subtotal: Number(item.subtotal),
    taxRate: Number(item.taxRate),
    taxMode: item.taxMode ?? "EXCLUSIVE",
    ...(item.chefNotes ? { chefNotes: item.chefNotes } : {}),
    ...(item.seatLabel ? { seatLabel: item.seatLabel } : {}),
    fulfillmentType: item.fulfillmentType,
    modifiers: (item.modifiers ?? []).map((modifier) => ({
      modifierId: modifier.modifierId,
      modifierGroupName: modifier.modifierGroupName ?? "",
      name: modifier.name,
      price: Number(modifier.price),
      quantity: modifier.quantity,
      ...(modifier.zoneLabel ? { zoneLabel: modifier.zoneLabel } : {}),
    })),
    pricingAttribution: stableAttribution(item),
    ...(item.pricingReplayEvidence
      ? { pricingReplayEvidence: item.pricingReplayEvidence }
      : {}),
    stationId: item.stationId ?? null,
    menuChangeEventId: item.menuChangeEventId ?? null,
    ...(item.comboId ? { comboId: item.comboId } : {}),
    ...(item.comboGroupId ? { comboGroupId: item.comboGroupId } : {}),
    ...(item.comboSlotOptionId
      ? { comboSlotOptionId: item.comboSlotOptionId }
      : {}),
  };
};

export const finalizeWholeActiveOrder = async (
  context: PricingContext,
  existingItems: StoredOrderLineForRepricing[],
  newStage4Lines: PricedLine[],
  options: PromotionStageOptions = {},
) => {
  const existingStage4 = existingItems.map(storedOrderLineToStage4Snapshot);
  const finalized = await pricingPipeline.finalize(
    context,
    [...existingStage4, ...newStage4Lines],
    options,
  );
  const existingCount = existingItems.length;
  const existingPricingUpdates: ExistingLinePricingUpdate[] = existingItems.map(
    (item, index) => ({
      id: item.id,
      pricingAttribution: finalized.lines[index]!.pricingAttribution,
      taxMode: finalized.lines[index]!.taxMode ?? "EXCLUSIVE",
    }),
  );
  return {
    ...finalized,
    existingPricingUpdates,
    newLines: finalized.lines.slice(existingCount),
  };
};
