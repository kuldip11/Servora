import {
  loyaltyRepository,
  type LoyaltyTierRow,
} from "../../loyalty/loyalty.repository";
import type { PricedLine, PricingContext } from "./pricing.types";
import {
  allocateCents,
  applyPromotionStage,
  type PromotionStageOptions,
  type PromotionStageResult,
} from "./promotion-stage";

export interface LoyaltyStageResult extends PromotionStageResult {
  loyaltyDiscountAmount: number;
}

function cloneLines(lines: PricedLine[]) {
  return lines.map((line) => ({
    ...line,
    pricingAttribution: {
      ...line.pricingAttribution,
      ...(line.pricingAttribution.PROMOTION_DETAILS
        ? { PROMOTION_DETAILS: [...line.pricingAttribution.PROMOTION_DETAILS] }
        : {}),
    },
  }));
}

function linePromotionDiscount(line: PricedLine) {
  return Math.max(0, -(line.pricingAttribution.PROMOTION ?? 0));
}

export function applyLoyaltyDiscount(
  linesInput: PricedLine[],
  tier: LoyaltyTierRow,
) {
  const lines = cloneLines(linesInput);
  const remainingCents = lines.map((line) =>
    Math.max(
      0,
      Math.round((line.subtotal - linePromotionDiscount(line)) * 100),
    ),
  );
  const remainingTotal = remainingCents.reduce((sum, value) => sum + value, 0);
  const wantedCents =
    tier.discountPercent !== null
      ? Math.round((remainingTotal * Number(tier.discountPercent)) / 100)
      : Math.min(
          remainingTotal,
          Math.max(0, Math.round(Number(tier.discountFixed ?? 0) * 100)),
        );
  const allocations = allocateCents(wantedCents, remainingCents);
  let loyaltyDiscountAmount = 0;
  lines.forEach((line, index) => {
    const amount = (allocations[index] ?? 0) / 100;
    if (!amount) return;
    loyaltyDiscountAmount += amount;
    line.pricingAttribution.LOYALTY =
      (line.pricingAttribution.LOYALTY ?? 0) - amount;
    line.pricingAttribution.LOYALTY_DETAILS = {
      tierId: tier.id,
      name: tier.name,
      discountAmount: amount,
    };
  });
  return { lines, loyaltyDiscountAmount };
}

function recomputeExclusiveTax(lines: PricedLine[]) {
  return lines.reduce((sum, line) => {
    const promotionDiscount = linePromotionDiscount(line);
    const loyaltyDiscount = Math.max(
      0,
      -(line.pricingAttribution.LOYALTY ?? 0),
    );
    const taxable = Math.max(
      0,
      line.subtotal - promotionDiscount - loyaltyDiscount,
    );
    return sum + (taxable * line.taxRate) / 100;
  }, 0);
}

export async function applyDiscountStages(
  context: PricingContext,
  inputLines: PricedLine[],
  options: PromotionStageOptions = {},
): Promise<LoyaltyStageResult> {
  const promotions = await applyPromotionStage(context, inputLines, options);
  const customerId = options.customerId ?? context.customerId;
  if (!customerId) return { ...promotions, loyaltyDiscountAmount: 0 };

  const customer = await loyaltyRepository.findCustomer(
    context.tenantId,
    customerId,
  );
  const tier =
    (await loyaltyRepository.findOrganizationTierForCustomer(
      context.tenantId,
      customerId,
    )) ?? customer?.loyaltyTier;
  if (!tier) return { ...promotions, loyaltyDiscountAmount: 0 };

  const nonStackableIds = promotions.appliedPromotions
    .filter((promotion) => !promotion.stackableWithLoyalty)
    .map((promotion) => promotion.promotionId);

  let chosenPromotions = promotions;
  if (nonStackableIds.length) {
    const stackableOnly = await applyPromotionStage(context, inputLines, {
      ...options,
      excludePromotionIds: [
        ...new Set([
          ...(options.excludePromotionIds ?? []),
          ...nonStackableIds,
        ]),
      ],
      skipSelectionValidation: true,
    });
    const loyaltyCandidate = applyLoyaltyDiscount(stackableOnly.lines, tier);
    const nonStackableAmount = Math.max(
      0,
      ...promotions.appliedPromotions
        .filter((promotion) => !promotion.stackableWithLoyalty)
        .map((promotion) => promotion.discountAmount),
    );
    if (loyaltyCandidate.loyaltyDiscountAmount <= nonStackableAmount) {
      return { ...promotions, loyaltyDiscountAmount: 0 };
    }
    chosenPromotions = stackableOnly;
  }

  const loyalty = applyLoyaltyDiscount(chosenPromotions.lines, tier);
  const discountAmount =
    chosenPromotions.discountAmount + loyalty.loyaltyDiscountAmount;
  return {
    ...chosenPromotions,
    lines: loyalty.lines,
    discountAmount,
    taxAmount: recomputeExclusiveTax(loyalty.lines),
    loyaltyDiscountAmount: loyalty.loyaltyDiscountAmount,
  };
}
