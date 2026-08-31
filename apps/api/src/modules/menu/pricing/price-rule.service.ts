import type { AuthContext } from "../../../core/auth";
import { NotFoundError, ValidationError } from "../../../core/errors";
import { requirePermission } from "../../../core/auth";
import { customerGroupRepository } from "../../customer-groups/customer-group.repository";
import { assertMenuResourceBranch } from "../menu-authorization";
import {
  priceRuleRepository,
  type NewPriceRule,
} from "./price-rule.repository";
import { itemRepository } from "../items/item.repository";
import { compact } from "../../../lib/object-utils";
import { buildDiff, menuChangeLog } from "../change-log/menu-change-log";
import {
  ruleSpecificity,
  type MatchingPriceRule,
} from "../../orders/pricing/pricing-pipeline";

export type PriceRuleInput = Omit<
  NewPriceRule,
  "id" | "tenantId" | "createdAt" | "updatedAt" | "price" | "percentOff" | "taxRate" | "effectiveFrom"
> & {
  price?: number | null;
  percentOff?: number | null;
  taxRate?: number | null;
  effectiveFrom?: string | null;
};

export interface HappyHourInput {
  categoryId?: string;
  menuId?: string;
  percentOff: number;
  startTime: string;
  endTime: string;
  startDate?: string;
  endDate?: string;
  branchId?: string;
  channel?: PriceRuleInput["channel"];
  fulfillmentType?: PriceRuleInput["fulfillmentType"];
  priority?: number;
}

function assertExactlyOnePriceValue(input: Pick<PriceRuleInput, "price" | "percentOff">) {
  const hasPrice = input.price !== undefined && input.price !== null;
  const hasPercentOff = input.percentOff !== undefined && input.percentOff !== null;
  if (hasPrice === hasPercentOff) {
    throw new ValidationError("Price rule requires exactly one of price or percentOff");
  }
  if (hasPercentOff && (input.percentOff! <= 0 || input.percentOff! > 100)) {
    throw new ValidationError("percentOff must be greater than 0 and at most 100");
  }
  if (hasPrice && input.price! < 0) throw new ValidationError("price cannot be negative");
}

async function validateScope(auth: AuthContext, input: PriceRuleInput) {
  if (input.organizationId) {
    requirePermission(auth, "organization:manage");
    const tenantOrganizationId = await priceRuleRepository.organizationIdForTenant(auth.tenantId);
    if (tenantOrganizationId !== input.organizationId) throw new ValidationError("Organization scope is outside the active tenant organization");
    if (!input.menuItemSku?.trim() && !input.isPerCover) throw new ValidationError("Organization item price rules require menuItemSku");
    if (input.branchId || input.variantId) throw new ValidationError("Organization-level rules cannot target tenant-local branches or variants");
  } else if (!input.isPerCover) {
    if (!input.menuItemId) throw new ValidationError("Menu-item price rules require menuItemId");
    const item = await itemRepository.findById(auth.tenantId, input.menuItemId);
    if (!item) throw new NotFoundError("Menu item not found");
    assertMenuResourceBranch(auth, item.branchId, { allowShared: true });
    if (input.branchId) assertMenuResourceBranch(auth, input.branchId);
    if (input.variantId && !item.variants.some((variant) => variant.id === input.variantId)) throw new ValidationError("Variant does not belong to the selected menu item");
  }
  if (input.customerGroupId) {
    const group = await customerGroupRepository.findById(auth.tenantId, input.customerGroupId);
    if (!group) throw new ValidationError("Customer group does not belong to this tenant");
  }
  if (input.isPerCover) {
    if (input.menuItemId || input.menuItemSku) throw new ValidationError("Per-cover price rules cannot target a menu item");
    if (input.variantId) throw new ValidationError("Per-cover price rules cannot target a variant");
    if (input.percentOff != null) throw new ValidationError("Per-cover price rules require an absolute price");
  } else if (input.coverTier) {
    throw new ValidationError("coverTier is only valid on a per-cover price rule");
  }
}

/** [start, end) intervals within a single day, splitting an overnight window in two. */
function timeIntervals(
  start: string | null,
  end: string | null,
): Array<[string, string]> {
  if (start !== null && end !== null && start > end) {
    return [
      [start, "24:00:00"],
      ["00:00:00", end],
    ];
  }
  return [[start ?? "00:00:00", end ?? "24:00:00"]];
}

function timeWindowsOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null,
): boolean {
  const a = timeIntervals(aStart, aEnd);
  const b = timeIntervals(bStart, bEnd);
  return a.some(([aS, aE]) => b.some(([bS, bE]) => aS < bE && bS < aE));
}

function dateRangesOverlap(
  aStart: string | null,
  aEnd: string | null,
  bStart: string | null,
  bEnd: string | null,
): boolean {
  const aS = aStart ?? "0000-01-01";
  const aE = aEnd ?? "9999-12-31";
  const bS = bStart ?? "0000-01-01";
  const bE = bEnd ?? "9999-12-31";
  return aS <= bE && bS <= aE;
}

const scopesCanOverlap = (
  a: Pick<MatchingPriceRule, "variantId" | "branchId" | "channel" | "fulfillmentType" | "customerGroupId" | "coverTier">,
  b: Pick<MatchingPriceRule, "variantId" | "branchId" | "channel" | "fulfillmentType" | "customerGroupId" | "coverTier">,
) => {
  const overlaps = <T>(left: T | null | undefined, right: T | null | undefined) =>
    left == null || right == null || left === right;
  return (
    overlaps(a.variantId, b.variantId) &&
    overlaps(a.branchId, b.branchId) &&
    overlaps(a.channel, b.channel) &&
    overlaps(a.fulfillmentType, b.fulfillmentType) &&
    overlaps(a.customerGroupId, b.customerGroupId) &&
    overlaps(a.coverTier, b.coverTier)
  );
};

/**
 * D1: two active rules for the same item/variant/branch/channel/fulfillment
 * scope, with overlapping time windows, equal specificity, and equal
 * priority resolve ambiguously (the id-based final tiebreak would decide
 * arbitrarily). Reject that configuration at write time instead.
 */
async function assertNoAmbiguousOverlap(
  auth: AuthContext,
  candidate: MatchingPriceRule & { menuItemId: string | null; menuItemSku?: string | null; organizationId?: string | null; isPerCover?: boolean; isActive?: boolean },
  excludeId?: string,
) {
  if (candidate.isActive === false) return;
  const existingRules = candidate.organizationId
    ? await priceRuleRepository.listOrganization(candidate.organizationId, candidate.menuItemSku ?? undefined)
    : await priceRuleRepository.list(auth.tenantId, candidate.menuItemId ?? undefined);
  const candidateSpecificity = ruleSpecificity(candidate);

  for (const other of existingRules as unknown as (MatchingPriceRule & {
    isActive: boolean;
  })[]) {
    if (!other.isActive) continue;
    if (excludeId && other.id === excludeId) continue;
    if (Boolean((other as { isPerCover?: boolean }).isPerCover) !== Boolean(candidate.isPerCover)) continue;
    if (!scopesCanOverlap(candidate, other)) continue;
    if (ruleSpecificity(other) !== candidateSpecificity) continue;
    if (other.priority !== candidate.priority) continue;
    if (!dateRangesOverlap(candidate.startDate, candidate.endDate, other.startDate, other.endDate)) continue;
    if (!timeWindowsOverlap(candidate.startTime, candidate.endTime, other.startTime, other.endTime)) continue;

    throw new ValidationError(
      `This rule's scope and time window overlap ambiguously with an existing price rule (${other.id}) of equal specificity and priority. Adjust the window, scope, or priority so exactly one rule applies.`,
    );
  }
}

const toPersistence = (input: PriceRuleInput) => {
  assertExactlyOnePriceValue(input);
  const { effectiveFrom, price, percentOff, taxRate, ...fields } = input;
  return compact({
    ...fields,
    ...(effectiveFrom !== undefined ? { effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null } : {}),
    price: price === undefined ? undefined : price === null ? null : String(price),
    percentOff: percentOff === undefined ? undefined : percentOff === null ? null : String(percentOff),
    taxRate:
      taxRate === undefined
        ? undefined
        : taxRate === null
          ? null
          : String(taxRate),
  });
};

export const priceRuleService = {
  async list(auth: AuthContext, menuItemId?: string, organizationId?: string, menuItemSku?: string) {
    requirePermission(auth, "menu:read");
    if (organizationId) {
      requirePermission(auth, "organization:manage");
      const tenantOrganizationId = await priceRuleRepository.organizationIdForTenant(auth.tenantId);
      if (tenantOrganizationId !== organizationId) throw new ValidationError("Organization scope is outside the active tenant organization");
      return priceRuleRepository.listOrganization(organizationId, menuItemSku);
    }
    return priceRuleRepository.list(auth.tenantId, menuItemId);
  },

  async create(auth: AuthContext, input: PriceRuleInput) {
    requirePermission(auth, "menu:pricing:write");
    assertExactlyOnePriceValue(input);
    await validateScope(auth, input);
    await assertNoAmbiguousOverlap(auth, {
      id: "",
      menuItemId: input.menuItemId ?? null,
      menuItemSku: input.menuItemSku ?? null,
      organizationId: input.organizationId ?? null,
      tenantId: input.organizationId ? null : auth.tenantId,
      customerGroupId: input.customerGroupId ?? null,
      coverTier: input.coverTier ?? null,
      isPerCover: input.isPerCover ?? false,
      variantId: input.variantId ?? null,
      branchId: input.branchId ?? null,
      channel: input.channel ?? null,
      fulfillmentType: input.fulfillmentType ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      priority: input.priority ?? 0,
      price: input.price == null ? null : String(input.price),
      percentOff: input.percentOff == null ? null : String(input.percentOff),
      taxRate: null,
      isActive: input.isActive ?? true,
    });
    const created = await priceRuleRepository.create({
      tenantId: input.organizationId ? null : auth.tenantId,
      ...toPersistence(input),
      organizationId: input.organizationId ?? null,
      menuItemSku: input.menuItemSku?.trim() || null,
    });
    await menuChangeLog.record(auth, "PRICE_RULE", created.id, "CREATED", buildDiff(null, created));
    return created;
  },

  async update(auth: AuthContext, id: string, input: Partial<PriceRuleInput>) {
    requirePermission(auth, "menu:pricing:write");
    const existing = await priceRuleRepository.findById(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Price rule not found");
    // G7: an organization-scoped rule remains a cross-tenant resource even
    // if an update attempts to move it back to tenant scope. Gate based on
    // both the existing and requested scope before applying any mutation.
    if (existing.organizationId || input.organizationId) {
      requirePermission(auth, "organization:manage");
    }
    const merged = { ...existing, ...input } as unknown as PriceRuleInput;
    assertExactlyOnePriceValue(merged);
    await validateScope(auth, merged);
    await assertNoAmbiguousOverlap(
      auth,
      {
        id: existing.id,
        menuItemId: merged.menuItemId ?? null,
        menuItemSku: merged.menuItemSku ?? null,
        organizationId: merged.organizationId ?? null,
        tenantId: merged.organizationId ? null : auth.tenantId,
        customerGroupId: merged.customerGroupId ?? null,
        coverTier: merged.coverTier ?? null,
        isPerCover: merged.isPerCover ?? false,
        variantId: merged.variantId ?? null,
        branchId: merged.branchId ?? null,
        channel: merged.channel ?? null,
        fulfillmentType: merged.fulfillmentType ?? null,
        startDate: merged.startDate ?? null,
        endDate: merged.endDate ?? null,
        startTime: merged.startTime ?? null,
        endTime: merged.endTime ?? null,
        priority: merged.priority ?? 0,
        price: merged.price == null ? null : String(merged.price),
        percentOff: merged.percentOff == null ? null : String(merged.percentOff),
        taxRate: null,
        isActive: merged.isActive ?? true,
      },
      existing.id,
    );
    const updated = await priceRuleRepository.update(
      auth.tenantId,
      id,
      toPersistence(merged),
    );
    if (!updated) throw new NotFoundError("Price rule not found");
    await menuChangeLog.record(auth, "PRICE_RULE", id, "UPDATED", buildDiff(existing, updated));
    return updated;
  },

  async createHappyHour(auth: AuthContext, input: HappyHourInput) {
    requirePermission(auth, "menu:pricing:write");
    if ((input.categoryId ? 1 : 0) + (input.menuId ? 1 : 0) !== 1) {
      throw new ValidationError("Happy hour requires exactly one category or menu scope");
    }
    if (input.percentOff <= 0 || input.percentOff > 100) {
      throw new ValidationError("Happy-hour discount must be greater than 0 and at most 100%");
    }
    if (input.startDate && input.endDate && input.startDate > input.endDate) {
      throw new ValidationError("Happy-hour start date must be before end date");
    }
    if (input.branchId) assertMenuResourceBranch(auth, input.branchId);

    let menuItemIds: string[] | null;
    if (input.categoryId) {
      const category = await itemRepository.findCategory(auth.tenantId, input.categoryId);
      if (!category) throw new NotFoundError("Menu category not found");
      assertMenuResourceBranch(auth, category.branchId, { allowShared: true });
      menuItemIds = await itemRepository.findIdsByCategory(auth.tenantId, input.categoryId);
    } else {
      menuItemIds = await itemRepository.findIdsByMenu(auth.tenantId, input.menuId!);
      if (menuItemIds === null) throw new NotFoundError("Menu not found");
    }
    if (menuItemIds.length === 0) throw new ValidationError("Selected happy-hour scope has no menu items");

    const candidates: PriceRuleInput[] = menuItemIds.map((menuItemId) => ({
      menuItemId,
      variantId: null,
      branchId: input.branchId ?? null,
      channel: input.channel ?? null,
      fulfillmentType: input.fulfillmentType ?? null,
      startDate: input.startDate ?? null,
      endDate: input.endDate ?? null,
      startTime: input.startTime,
      endTime: input.endTime,
      price: null,
      percentOff: input.percentOff,
      taxRate: null,
      priority: input.priority ?? 0,
      isActive: true,
    }));

    for (const candidate of candidates) {
      await validateScope(auth, candidate);
      await assertNoAmbiguousOverlap(auth, {
        id: "",
        menuItemId: candidate.menuItemId ?? null,
        variantId: null,
        branchId: candidate.branchId ?? null,
        channel: candidate.channel ?? null,
        fulfillmentType: candidate.fulfillmentType ?? null,
        startDate: candidate.startDate ?? null,
        endDate: candidate.endDate ?? null,
        startTime: candidate.startTime ?? null,
        endTime: candidate.endTime ?? null,
        priority: candidate.priority ?? 0,
        price: null,
        percentOff: String(input.percentOff),
        taxRate: null,
        isActive: true,
      });
    }

    const created = await priceRuleRepository.createMany(candidates.map((candidate) => ({
      tenantId: auth.tenantId,
      ...toPersistence(candidate),
    })));
    await Promise.all(created.map((rule) =>
      menuChangeLog.record(auth, "PRICE_RULE", rule.id, "CREATED", buildDiff(null, rule)),
    ));
    return created;
  },

  async remove(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:pricing:write");
    const existing = await priceRuleRepository.findById(auth.tenantId, id);
    if (!existing) return;
    if (existing.organizationId) {
      requirePermission(auth, "organization:manage");
      const tenantOrganizationId = await priceRuleRepository.organizationIdForTenant(auth.tenantId);
      if (tenantOrganizationId !== existing.organizationId) {
        throw new ValidationError("Organization scope is outside the active tenant organization");
      }
    }
    assertMenuResourceBranch(auth, existing.branchId);
    await priceRuleRepository.remove(auth.tenantId, id);
    await menuChangeLog.record(auth, "PRICE_RULE", id, "DELETED", buildDiff(existing, null));
  },
};
