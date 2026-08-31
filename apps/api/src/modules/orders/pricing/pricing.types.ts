import type { OrderType } from "@pos/types";
import type { AvailabilityChannel } from "../../menu/availability/availability.service";

export type PricingReplayPriceRule = Omit<MatchingPriceRule, "effectiveFrom"> & {
  /** JSON evidence deserializes timestamps as strings; live candidates use Date. */
  effectiveFrom?: Date | string | null;
};

export interface PricingReplayEvidence {
  requestedLine: OrderItemInput;
  item: PricableMenuItem;
  branchOverride: BranchPricingOverride | null;
  priceRules: PricingReplayPriceRule[];
}

export interface PricingContext {
  tenantId: string;
  branchId: string;
  channel: AvailabilityChannel;
  fulfillmentType: OrderType;
  customerId?: string | undefined;
  customerGroupId?: string | undefined;
  coverTier?: "ADULT" | "CHILD" | undefined;
  asOf: Date;
  /** Reporting-only escape hatch. Order flows omit this and therefore keep
   * normal availability enforcement while read-only reports can still ask
   * the authoritative pipeline what an unavailable item would price at. */
  allowUnavailable?: boolean | undefined;
  /** Read-only reporting escape hatch. When true, stage 3 still validates
   * supplied modifiers but does not require minimum selections that only make
   * sense during order entry. Pricing remains inside this one pipeline. */
  allowIncompleteModifierSelection?: boolean | undefined;
  /** H1 read-only deterministic replay. When present, price() executes the
   * normal stage code against the immutable fire-time inputs instead of
   * today's mutable repositories. Only the explain path supplies this. */
  historicalReplay?: PricingReplayEvidence | undefined;
}

export interface OrderItemInput {
  menuItemId: string;
  variantId?: string | undefined;
  quantity: number;
  weightQuantity?: number | undefined;
  manualPrice?: number | undefined;
  chefNotes?: string | undefined;
  seatLabel?: string | undefined;
  courseNumber?: number | undefined;
  fulfillmentType?: "DINE_IN" | "TAKEAWAY" | undefined;
  selectedOptions?:
    | Array<{ optionId: string; quantity?: number | undefined; zoneLabel?: string | undefined }>
    | undefined;
}

export interface PricableMenuItem {
  id: string;
  branchId: string | null;
  name: string;
  categoryId: string;
  isAvailable: boolean;
  manualOverrideStatus?: string | null;
  manualStockCount?: number | null;
  basePrice: string;
  pricingMode?: "FIXED" | "WEIGHT_BASED" | "OPEN";
  weightUnit?: "G" | "KG" | "LB" | "OZ" | null;
  openPriceMin?: string | null;
  openPriceMax?: string | null;
  supportsZones?: boolean;
  zonePricingRule?: "AVERAGE" | "HIGHER" | "SUM_HALF";
  sku?: string | null;
  taxRate: string;
  taxMode?: "INCLUSIVE" | "EXCLUSIVE" | null;
  variants: Array<{ id: string; name: string; price: string; status?: string; manualOverrideStatus?: string | null; manualOverrideReason?: string | null; manualStockCount?: number | null }>;
  modifierGroupLinks: Array<{
    group: {
      id: string;
      name: string;
      minSelections: number;
      maxSelections: number | null;
      selectionType: "SINGLE" | "MULTIPLE";
      dependsOnOptionId?: string | null;
      groupType?: "ADDON" | "SUBSTITUTION";
      options: Array<{
        id: string;
        name: string;
        isAvailable: boolean;
        maxQuantity: number | null;
        additionalPrice: string;
        isDefault?: boolean;
        replacesDefaultComponent?: string | null;
        variantPrices?: Array<{ variantId: string; additionalPrice: string }>;
      }>;
    };
  }>;
}

export interface BranchPricingOverride {
  id?: string | undefined;
  menuItemId: string | null;
  price: string | null;
  taxRate: string | null;
  percentOff?: string | null;
}

export interface MatchingPriceRule extends BranchPricingOverride {
  id: string;
  variantId: string | null;
  branchId: string | null;
  channel: AvailabilityChannel | null;
  fulfillmentType: OrderType | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string | null;
  endTime: string | null;
  priority: number;
  effectiveFrom?: Date | null;
  tenantId?: string | null;
  organizationId?: string | null;
  menuItemSku?: string | null;
  customerGroupId?: string | null;
  coverTier?: "ADULT" | "CHILD" | null;
  isPerCover?: boolean;
}

export interface PricingAttribution {
  BASE_PRICE: number;
  VARIANT: number;
  MODIFIER: number;
  COMBO?: number;
  PROMOTION?: number;
  PROMOTION_DETAILS?: Array<{ promotionId: string; name: string; discountAmount: number }>;
  LOYALTY?: number;
  LOYALTY_DETAILS?: { tierId: string; name: string; discountAmount: number };
  TAXABLE_BASE?: number;
  /** Category captured at stage 1 so historical promotion repricing never joins mutable menu data. */
  CATEGORY_ID?: string;
  PRICE_SOURCE?: {
    kind: "PRICE_RULE" | "BRANCH_OVERRIDE" | "MENU_ITEM";
    id: string;
    description: string;
  };
}

export interface PricedLine {
  /** Null only for a persisted combo parent/grouping line. */
  menuItemId: string | null;
  menuItemName: string;
  variantId?: string | undefined;
  variantName?: string | undefined;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
  taxMode?: "INCLUSIVE" | "EXCLUSIVE" | undefined;
  chefNotes?: string | undefined;
  seatLabel?: string | undefined;
  courseNumber?: number | undefined;
  fulfillmentType: "DINE_IN" | "TAKEAWAY";
  modifiers: Array<{
    modifierId: string;
    modifierGroupName: string;
    name: string;
    price: number;
    quantity: number;
    zoneLabel?: string | undefined;
  }>;
  pricingAttribution: PricingAttribution;
  stationId?: string | null;
  menuChangeEventId?: string | null;
  resolutionAsOf?: Date | undefined;
  availabilitySnapshot?: {
    asOf: string;
    branchId: string;
    channel: AvailabilityChannel;
    fulfillmentType: OrderType;
    effectiveStatus: string;
    isHidden: boolean;
    reason: string | null;
    cause: string;
    replayEvidence?: unknown;
  } | null;
  pricingReplayEvidence?: PricingReplayEvidence | null | undefined;
  availabilityReplayEvidence?: unknown;
  comboId?: string | undefined;
  comboGroupId?: string | undefined;
  comboSlotOptionId?: string | undefined;
  weightQuantity?: number | undefined;
  weightUnit?: "G" | "KG" | "LB" | "OZ" | undefined;
  manualPrice?: number | undefined;
  billingExcluded?: boolean | undefined;
}

export interface PricingResult {
  lines: PricedLine[];
  subtotal: number;
  taxAmount: number;
}

export interface BasePriceStageResult {
  price: number;
  taxRate: number;
  attribution: number;
}

