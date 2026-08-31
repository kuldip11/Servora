import { tenantRepository } from "../../tenants/tenant.repository";
import type { PricedLine, PricingContext } from "./pricing-pipeline";
import { allocateCents, type PromotionStageOptions } from "./promotion-stage";
import { applyDiscountStages, type LoyaltyStageResult } from "./loyalty-stage";

export type RoundingPolicy = "NONE" | "NEAREST_1" | "NEAREST_5" | "NEAREST_10";
export type TaxMode = "INCLUSIVE" | "EXCLUSIVE";

export interface FinalPricingResult extends LoyaltyStageResult {
  serviceChargeAmount: number;
  roundingAdjustment: number;
  totalAmount: number;
  preciseTotal: number;
  roundingPolicy: RoundingPolicy;
}

function lineDiscount(line: PricedLine) {
  return Math.max(0, -(line.pricingAttribution.PROMOTION ?? 0)) +
    Math.max(0, -(line.pricingAttribution.LOYALTY ?? 0));
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function roundTotal(preciseTotal: number, policy: RoundingPolicy) {
  const increments: Record<RoundingPolicy, number> = {
    NONE: 0,
    NEAREST_1: 1,
    NEAREST_5: 5,
    NEAREST_10: 10,
  };
  const increment = increments[policy];
  if (increment === 0) {
    return { totalAmount: money(preciseTotal), roundingAdjustment: 0 };
  }
  const rounded = Math.round(preciseTotal / increment) * increment;
  return {
    totalAmount: money(rounded),
    roundingAdjustment: money(rounded - preciseTotal),
  };
}

/**
 * Stages 7 and 8 are intentionally coupled: a taxable service charge must be
 * folded into the stage-7 tax base, while a non-taxable charge remains a
 * separate stage-8 amount. Inclusive lines back tax out of their charged
 * price; exclusive lines add tax on top.
 */
export function calculateTaxServiceAndRounding(
  lines: PricedLine[],
  settings: {
    serviceChargePercent: string | null;
    serviceChargeTaxable: boolean;
    roundingPolicy: RoundingPolicy;
    defaultTaxMode: TaxMode;
  },
) {
  const remainingCents = lines.map((line) =>
    Math.max(0, Math.round((line.subtotal - lineDiscount(line)) * 100)),
  );
  const merchandiseCents = remainingCents.reduce((sum, value) => sum + value, 0);
  const serviceChargeCents = settings.serviceChargePercent === null
    ? 0
    : Math.max(0, Math.round(merchandiseCents * Number(settings.serviceChargePercent) / 100));
  const serviceAllocations = settings.serviceChargeTaxable && serviceChargeCents > 0 && merchandiseCents > 0
    ? allocateCents(serviceChargeCents, remainingCents)
    : lines.map(() => 0);

  let taxCents = 0;
  let merchandisePayableCents = 0;
  for (const [index, line] of lines.entries()) {
    const amountCents = remainingCents[index]!;
    const mode = line.taxMode ?? settings.defaultTaxMode;
    line.taxMode = mode;
    const rate = line.taxRate / 100;
    if (mode === "INCLUSIVE" && rate > 0) {
      const netCents = Math.round(amountCents / (1 + rate));
      taxCents += amountCents - netCents;
      merchandisePayableCents += amountCents;
      line.pricingAttribution.TAXABLE_BASE = netCents / 100;
    } else {
      taxCents += Math.round(amountCents * rate);
      merchandisePayableCents += amountCents + Math.round(amountCents * rate);
      line.pricingAttribution.TAXABLE_BASE = amountCents / 100;
    }
    if (settings.serviceChargeTaxable && serviceAllocations[index]! > 0) {
      taxCents += Math.round(serviceAllocations[index]! * rate);
    }
  }

  const preciseCents = merchandisePayableCents + serviceChargeCents +
    (settings.serviceChargeTaxable ? serviceAllocations.reduce((sum, amount, index) => {
      // The tax on service was added to taxCents above but not merchandise payable.
      return sum + Math.round(amount * (lines[index]!.taxRate / 100));
    }, 0) : 0);
  const preciseTotal = preciseCents / 100;
  const rounded = roundTotal(preciseTotal, settings.roundingPolicy);
  return {
    taxAmount: taxCents / 100,
    serviceChargeAmount: serviceChargeCents / 100,
    preciseTotal,
    ...rounded,
  };
}

/** Stages 5→9 orchestration, including loyalty, tax mode, service charge and rounding. */
export async function finalizePricing(
  context: PricingContext,
  lines: PricedLine[],
  options: PromotionStageOptions = {},
): Promise<FinalPricingResult> {
  const discounts = await applyDiscountStages(context, lines, options);
  const tenant = await tenantRepository.findById(context.tenantId);
  if (!tenant) throw new Error("Tenant not found while finalizing pricing");
  const final = calculateTaxServiceAndRounding(discounts.lines, {
    serviceChargePercent: tenant.serviceChargePercent,
    serviceChargeTaxable: tenant.serviceChargeTaxable,
    roundingPolicy: tenant.roundingPolicy,
    defaultTaxMode: tenant.defaultTaxMode,
  });
  return { ...discounts, ...final, roundingPolicy: tenant.roundingPolicy };
}
