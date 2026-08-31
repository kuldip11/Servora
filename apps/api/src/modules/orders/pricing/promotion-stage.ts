import { promotionRepository, type PendingPromotionRedemption, type PromotionRow } from "../../menu/promotions/promotion.repository";
import type { PricedLine, PricingContext } from "./pricing.types";
import { ValidationError } from "../../../core/errors";

export interface PromotionStageOptions {
  couponCode?: string | undefined;
  promotionIds?: string[] | undefined;
  customerId?: string | undefined;
  priorRedemptions?: Record<string, number> | undefined;
  excludePromotionIds?: string[] | undefined;
  skipSelectionValidation?: boolean | undefined;
  /** H4 unsaved-preview hook: when supplied, stage 5 evaluates exactly these
   * candidate promotions instead of reading persisted rules. The same stage
   * arithmetic is therefore used before and after save. */
  candidatePromotions?: PromotionRow[] | undefined;
}
export interface PromotionStageResult {
  lines: PricedLine[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  redemptions: PendingPromotionRedemption[];
  appliedPromotions: Array<{ promotionId: string; stackableWithLoyalty: boolean; discountAmount: number }>;
}

function activeAt(promotion: PromotionRow, asOf: Date) {
  const iso = asOf.toISOString();
  const date = iso.slice(0, 10);
  const time = iso.slice(11, 19);
  if (promotion.startDate && date < promotion.startDate) return false;
  if (promotion.endDate && date > promotion.endDate) return false;
  if (promotion.startTime === null && promotion.endTime === null) return true;
  if (promotion.startTime && promotion.endTime && promotion.startTime > promotion.endTime) {
    return time >= promotion.startTime || time <= promotion.endTime;
  }
  return (!promotion.startTime || time >= promotion.startTime) && (!promotion.endTime || time <= promotion.endTime);
}

export function allocateCents(total: number, weights: number[]) {
  if (total <= 0 || !weights.length) return weights.map(() => 0);
  const sum = weights.reduce((acc, value) => acc + Math.max(0, value), 0);
  if (sum <= 0) return weights.map(() => 0);
  const raw = weights.map((weight) => total * Math.max(0, weight) / sum);
  const result = raw.map(Math.floor);
  let remainder = total - result.reduce((acc, value) => acc + value, 0);
  const order = raw.map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  for (let index = 0; index < remainder; index++) result[order[index % order.length]!.index]!++;
  return result;
}

function selectorMatches(
  line: PricedLine,
  categoryByItem: Map<string, string>,
  menuItemId: string | null,
  categoryId: string | null,
) {
  if (!line.menuItemId) return false;
  if (menuItemId) return line.menuItemId === menuItemId;
  if (categoryId) return categoryByItem.get(line.menuItemId) === categoryId;
  return false;
}

function addPromotionAttribution(
  line: PricedLine,
  promotion: PromotionRow,
  amount: number,
) {
  if (amount <= 0) return;
  line.pricingAttribution.PROMOTION = (line.pricingAttribution.PROMOTION ?? 0) - amount;
  line.pricingAttribution.PROMOTION_DETAILS = [
    ...(line.pricingAttribution.PROMOTION_DETAILS ?? []),
    { promotionId: promotion.id, name: promotion.name, discountAmount: amount },
  ];
}

export async function applyPromotionStage(
  context: PricingContext,
  inputLines: PricedLine[],
  options: PromotionStageOptions = {},
): Promise<PromotionStageResult> {
  const candidates = options.candidatePromotions ??
    (await promotionRepository.findCandidates(context.tenantId));
  const requestedCode = options.couponCode?.trim().toUpperCase();
  const requestedIds = new Set(options.promotionIds ?? []);
  const excludedIds = new Set(options.excludePromotionIds ?? []);
  const matching = candidates.filter((promotion) => {
    if (!promotion.isActive || excludedIds.has(promotion.id)) return false;
    if (!activeAt(promotion, context.asOf)) return false;
    if (promotion.couponCode === null) return true;
    return promotion.couponCode.toUpperCase() === requestedCode || requestedIds.has(promotion.id);
  }).sort((a, b) => a.id.localeCompare(b.id));

  if (!options.skipSelectionValidation) {
    if (requestedCode && !matching.some((promotion) => promotion.couponCode?.toUpperCase() === requestedCode)) {
      throw new ValidationError("Coupon code is invalid or inactive");
    }
    for (const id of requestedIds) if (!excludedIds.has(id) && !matching.some((promotion) => promotion.id === id)) throw new ValidationError("Selected promotion is invalid or inactive");
  }

  // Stage 1 snapshots category identity into each priced line, so promotion
  // evaluation never reaches back into mutable menu data.
  const categoryByItem = new Map<string, string>();
  for (const line of inputLines) {
    if (line.menuItemId && line.pricingAttribution.CATEGORY_ID) {
      categoryByItem.set(line.menuItemId, line.pricingAttribution.CATEGORY_ID);
    }
  }

  const lines = inputLines.map((line) => ({
    ...line,
    pricingAttribution: { ...line.pricingAttribution },
  }));
  const discounts = lines.map(() => 0);
  const redemptionAmounts = new Map<string, number>();

  for (const promotion of matching) {
    if (promotion.ruleType === "BOGO") {
      const triggerItemId = promotion.triggerMenuItemId;
      const triggerCategoryId = promotion.triggerCategoryId;
      const rewardItemId = promotion.rewardMenuItemId ?? triggerItemId;
      const rewardCategoryId = promotion.rewardCategoryId ?? (promotion.rewardMenuItemId ? null : triggerCategoryId);
      const triggerQuantity = promotion.triggerQuantity ?? 0;
      const rewardQuantity = promotion.rewardQuantity ?? 0;
      const rewardDiscountPercent = Number(promotion.rewardDiscountPercent ?? 0);
      if ((!triggerItemId && !triggerCategoryId) || triggerQuantity < 1 || rewardQuantity < 1 || rewardDiscountPercent <= 0) continue;

      const triggerIndexes = lines.flatMap((line, index) =>
        selectorMatches(line, categoryByItem, triggerItemId, triggerCategoryId) ? [index] : [],
      );
      const rewardIndexes = lines.flatMap((line, index) =>
        selectorMatches(line, categoryByItem, rewardItemId, rewardCategoryId) ? [index] : [],
      );

      const triggerSet = new Set(triggerIndexes);
      const rewardSet = new Set(rewardIndexes);
      const triggerOnlyUnits = triggerIndexes
        .filter((index) => !rewardSet.has(index))
        .reduce((sum, index) => sum + lines[index]!.quantity, 0);
      const rewardOnlyUnits = rewardIndexes
        .filter((index) => !triggerSet.has(index))
        .reduce((sum, index) => sum + lines[index]!.quantity, 0);
      const overlapUnits = triggerIndexes
        .filter((index) => rewardSet.has(index))
        .reduce((sum, index) => sum + lines[index]!.quantity, 0);

      const triggerUnits = triggerOnlyUnits + overlapUnits;
      const rewardUnitsAvailable = rewardOnlyUnits + overlapUnits;
      let groupCount = Math.min(
        Math.floor(triggerUnits / triggerQuantity),
        Math.floor(rewardUnitsAvailable / rewardQuantity),
      );
      // Physical units cannot satisfy both sides of a BOGO pair. Reduce the
      // group count until the overlapping pool can cover both shortfalls.
      while (groupCount > 0) {
        const overlapNeededForTrigger = Math.max(0, triggerQuantity * groupCount - triggerOnlyUnits);
        const overlapNeededForReward = Math.max(0, rewardQuantity * groupCount - rewardOnlyUnits);
        if (overlapNeededForTrigger + overlapNeededForReward <= overlapUnits) break;
        groupCount -= 1;
      }
      const rewardUnitsToDiscount = groupCount * rewardQuantity;
      if (rewardUnitsToDiscount <= 0) continue;

      const allRewardUnits = rewardIndexes.flatMap((lineIndex) => {
        const line = lines[lineIndex]!;
        const remainingLineCents = Math.max(0, Math.round(line.subtotal * 100) - Math.round(discounts[lineIndex]! * 100));
        const unitBase = Math.floor(remainingLineCents / line.quantity);
        const unitRemainder = remainingLineCents - unitBase * line.quantity;
        return Array.from({ length: line.quantity }, (_, unitIndex) => ({
          lineIndex,
          unitIndex,
          cents: unitBase + (unitIndex < unitRemainder ? 1 : 0),
          overlapsTrigger: triggerSet.has(lineIndex),
        }));
      });

      const overlapNeededForTrigger = Math.max(0, triggerQuantity * groupCount - triggerOnlyUnits);
      // When trigger/reward pools overlap, reserve the most expensive overlap
      // units for the trigger so the standard lowest-price reward convention
      // remains deterministic on the disjoint remainder.
      const reservedForTrigger = new Set(
        allRewardUnits
          .filter((unit) => unit.overlapsTrigger)
          .sort((a, b) => b.cents - a.cents || a.lineIndex - b.lineIndex || a.unitIndex - b.unitIndex)
          .slice(0, overlapNeededForTrigger)
          .map((unit) => `${unit.lineIndex}:${unit.unitIndex}`),
      );
      const rewardUnits = allRewardUnits
        .filter((unit) => !reservedForTrigger.has(`${unit.lineIndex}:${unit.unitIndex}`))
        .sort((a, b) => a.cents - b.cents || a.lineIndex - b.lineIndex || a.unitIndex - b.unitIndex);

      const perLineCents = new Map<number, number>();
      for (const unit of rewardUnits.slice(0, rewardUnitsToDiscount)) {
        const discountCents = Math.min(unit.cents, Math.round(unit.cents * rewardDiscountPercent / 100));
        perLineCents.set(unit.lineIndex, (perLineCents.get(unit.lineIndex) ?? 0) + discountCents);
      }
      let applied = 0;
      for (const [lineIndex, cents] of perLineCents) {
        const amount = cents / 100;
        discounts[lineIndex]! += amount;
        applied += amount;
        addPromotionAttribution(lines[lineIndex]!, promotion, amount);
      }
      if (applied > 0) redemptionAmounts.set(promotion.id, (redemptionAmounts.get(promotion.id) ?? 0) + applied);
      continue;
    }

    const eligibleIndexes = lines.flatMap((line, index) => {
      if (!line.menuItemId || line.subtotal <= 0) return [];
      if (promotion.scope === "ITEM" && line.menuItemId !== promotion.scopeMenuItemId) return [];
      if (promotion.scope === "CATEGORY" && categoryByItem.get(line.menuItemId) !== promotion.scopeCategoryId) return [];
      return [index];
    });
    if (!eligibleIndexes.length) continue;

    const remainingCents = eligibleIndexes.map((index) => Math.max(0, Math.round(lines[index]!.subtotal * 100) - Math.round(discounts[index]! * 100)));
    const remainingTotal = remainingCents.reduce((sum, value) => sum + value, 0);
    if (!remainingTotal) continue;
    const wanted = promotion.ruleType === "PERCENTAGE"
      ? Math.round(remainingTotal * Number(promotion.value) / 100)
      : Math.min(
          remainingTotal,
          Math.max(0, Math.round((Number(promotion.value) - (options.priorRedemptions?.[promotion.id] ?? 0)) * 100)),
        );
    const allocation = allocateCents(wanted, remainingCents);
    let applied = 0;
    eligibleIndexes.forEach((lineIndex, allocationIndex) => {
      const amount = (allocation[allocationIndex] ?? 0) / 100;
      if (!amount) return;
      applied += amount;
      discounts[lineIndex]! += amount;
      addPromotionAttribution(lines[lineIndex]!, promotion, amount);
    });
    if (applied > 0) redemptionAmounts.set(promotion.id, (redemptionAmounts.get(promotion.id) ?? 0) + applied);
  }

  const subtotal = lines.reduce((sum, line) => sum + line.subtotal, 0);
  const discountAmount = discounts.reduce((sum, amount) => sum + amount, 0);
  const taxAmount = lines.reduce((sum, line, index) => {
    const taxable = Math.max(0, line.subtotal - discounts[index]!);
    return sum + taxable * line.taxRate / 100;
  }, 0);
  return {
    lines,
    subtotal,
    discountAmount,
    taxAmount,
    redemptions: [...redemptionAmounts].map(([promotionId, discountAmount]) => ({
      promotionId,
      customerId: options.customerId ?? null,
      discountAmount,
    })),
    appliedPromotions: [...redemptionAmounts].map(([promotionId, discountAmount]) => {
      const promotion = matching.find((candidate) => candidate.id === promotionId)!;
      return { promotionId, stackableWithLoyalty: promotion.stackableWithLoyalty, discountAmount };
    }),
  };
}
