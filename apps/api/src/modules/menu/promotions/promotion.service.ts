import type { AuthContext } from "../../../core/auth";
import { NotFoundError, ValidationError } from "../../../core/errors";
import { requirePermission } from "../../../core/auth";
import { menuChangeLog, buildDiff } from "../change-log/menu-change-log";
import { promotionRepository, type NewPromotion } from "./promotion.repository";
import { itemRepository } from "../items/item.repository";
import { assertMenuResourceBranch } from "../menu-authorization";
import { pricingPipeline, type OrderItemInput } from "../../orders/pricing/pricing-pipeline";
import type { PromotionRow } from "./promotion.repository";

export interface PromotionInput {
  name: string;
  ruleType: "PERCENTAGE" | "FIXED_AMOUNT" | "BOGO";
  scope: "ORDER" | "CATEGORY" | "ITEM";
  scopeCategoryId?: string | null;
  scopeMenuItemId?: string | null;
  value?: number;
  couponCode?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  maxUsesTotal?: number | null;
  maxUsesPerCustomer?: number | null;
  triggerMenuItemId?: string | null;
  triggerCategoryId?: string | null;
  rewardMenuItemId?: string | null;
  rewardCategoryId?: string | null;
  rewardDiscountPercent?: number | null;
  triggerQuantity?: number | null;
  rewardQuantity?: number | null;
  stackableWithLoyalty?: boolean;
  isActive?: boolean;
}

export interface PromotionPreviewInput {
  promotion: PromotionInput;
  items: OrderItemInput[];
}

import { PREVIEW_PROMOTION_ID } from "./constants";

function validate(input: PromotionInput) {
  if (input.ruleType === "PERCENTAGE") {
    if (input.value === undefined || input.value <= 0 || input.value > 100) {
      throw new ValidationError("Percentage promotion must be greater than 0 and at most 100%");
    }
  } else if (input.ruleType === "FIXED_AMOUNT") {
    if (input.value === undefined || input.value <= 0) throw new ValidationError("Fixed promotion amount must be greater than 0");
  } else {
    const triggerTargets = Number(Boolean(input.triggerMenuItemId)) + Number(Boolean(input.triggerCategoryId));
    const rewardTargets = Number(Boolean(input.rewardMenuItemId)) + Number(Boolean(input.rewardCategoryId));
    if (triggerTargets !== 1) throw new ValidationError("BOGO requires exactly one trigger item or category");
    if (rewardTargets > 1) throw new ValidationError("BOGO reward can target at most one item or category");
    if (!input.rewardDiscountPercent || input.rewardDiscountPercent <= 0 || input.rewardDiscountPercent > 100) {
      throw new ValidationError("BOGO reward discount must be greater than 0 and at most 100%");
    }
    if (!input.triggerQuantity || input.triggerQuantity < 1 || !input.rewardQuantity || input.rewardQuantity < 1) {
      throw new ValidationError("BOGO trigger and reward quantities must be positive integers");
    }
  }
  if (input.ruleType === "BOGO") {
    if (input.scope !== "ORDER" || input.scopeCategoryId || input.scopeMenuItemId) {
      throw new ValidationError("BOGO scope is defined by its buy/reward targets and must use ORDER scope");
    }
  } else {
    if (input.scope === "ORDER" && (input.scopeCategoryId || input.scopeMenuItemId)) throw new ValidationError("Order promotions cannot target an item/category");
    if (input.scope === "CATEGORY" && (!input.scopeCategoryId || input.scopeMenuItemId)) throw new ValidationError("Category promotion requires exactly one category target");
    if (input.scope === "ITEM" && (!input.scopeMenuItemId || input.scopeCategoryId)) throw new ValidationError("Item promotion requires exactly one item target");
  }
  if (input.startDate && input.endDate && input.startDate > input.endDate) throw new ValidationError("Promotion start date must be before end date");
}


async function validateTargets(auth: AuthContext, input: PromotionInput) {
  const itemIds = new Set<string>();
  const categoryIds = new Set<string>();
  for (const id of [input.scopeMenuItemId, input.triggerMenuItemId, input.rewardMenuItemId]) {
    if (id) itemIds.add(id);
  }
  for (const id of [input.scopeCategoryId, input.triggerCategoryId, input.rewardCategoryId]) {
    if (id) categoryIds.add(id);
  }

  for (const itemId of itemIds) {
    const item = await itemRepository.findById(auth.tenantId, itemId);
    if (!item) throw new ValidationError("Promotion menu item does not belong to this tenant");
    assertMenuResourceBranch(auth, item.branchId, { allowShared: true });
  }
  for (const categoryId of categoryIds) {
    const category = await itemRepository.findCategory(auth.tenantId, categoryId);
    if (!category) throw new ValidationError("Promotion category does not belong to this tenant");
    assertMenuResourceBranch(auth, category.branchId, { allowShared: true });
  }
}

function persistence(input: PromotionInput): NewPromotion {
  validate(input);
  return {
    name: input.name.trim(),
    ruleType: input.ruleType,
    scope: input.scope,
    scopeCategoryId: input.scopeCategoryId ?? null,
    scopeMenuItemId: input.scopeMenuItemId ?? null,
    value: input.ruleType === "BOGO" ? null : input.value!.toFixed(2),
    couponCode: input.couponCode?.trim().toUpperCase() ?? null,
    startDate: input.startDate ?? null,
    endDate: input.endDate ?? null,
    startTime: input.startTime ?? null,
    endTime: input.endTime ?? null,
    maxUsesTotal: input.maxUsesTotal ?? null,
    maxUsesPerCustomer: input.maxUsesPerCustomer ?? null,
    triggerMenuItemId: input.ruleType === "BOGO" ? input.triggerMenuItemId ?? null : null,
    triggerCategoryId: input.ruleType === "BOGO" ? input.triggerCategoryId ?? null : null,
    rewardMenuItemId: input.ruleType === "BOGO" ? input.rewardMenuItemId ?? null : null,
    rewardCategoryId: input.ruleType === "BOGO" ? input.rewardCategoryId ?? null : null,
    rewardDiscountPercent: input.ruleType === "BOGO" ? input.rewardDiscountPercent!.toFixed(2) : null,
    triggerQuantity: input.ruleType === "BOGO" ? input.triggerQuantity! : null,
    rewardQuantity: input.ruleType === "BOGO" ? input.rewardQuantity! : null,
    stackableWithLoyalty: input.stackableWithLoyalty ?? true,
    isActive: input.isActive ?? true,
  } as NewPromotion;
}

export const promotionService = {
  async preview(auth: AuthContext, input: PromotionPreviewInput) {
    requirePermission(auth, "menu:pricing:write");
    if (!auth.branchId) throw new ValidationError("Select a branch to preview pricing");
    if (!input.items.length) throw new ValidationError("Add at least one menu item to preview this promotion");
    validate(input.promotion);
    await validateTargets(auth, input.promotion);

    const asOf = new Date();
    const persisted = persistence({ ...input.promotion, isActive: true });
    const previewPromotion: PromotionRow = {
      id: PREVIEW_PROMOTION_ID,
      tenantId: auth.tenantId,
      name: persisted.name,
      ruleType: persisted.ruleType,
      scope: persisted.scope ?? "ORDER",
      scopeCategoryId: persisted.scopeCategoryId ?? null,
      scopeMenuItemId: persisted.scopeMenuItemId ?? null,
      value: persisted.value ?? null,
      couponCode: persisted.couponCode ?? null,
      startDate: persisted.startDate ?? null,
      endDate: persisted.endDate ?? null,
      startTime: persisted.startTime ?? null,
      endTime: persisted.endTime ?? null,
      maxUsesTotal: persisted.maxUsesTotal ?? null,
      maxUsesPerCustomer: persisted.maxUsesPerCustomer ?? null,
      triggerMenuItemId: persisted.triggerMenuItemId ?? null,
      triggerCategoryId: persisted.triggerCategoryId ?? null,
      rewardMenuItemId: persisted.rewardMenuItemId ?? null,
      rewardCategoryId: persisted.rewardCategoryId ?? null,
      rewardDiscountPercent: persisted.rewardDiscountPercent ?? null,
      triggerQuantity: persisted.triggerQuantity ?? null,
      rewardQuantity: persisted.rewardQuantity ?? null,
      stackableWithLoyalty: persisted.stackableWithLoyalty ?? true,
      isActive: true,
      createdAt: asOf,
      updatedAt: asOf,
    };
    const context = {
      tenantId: auth.tenantId,
      branchId: auth.branchId,
      channel: "STAFF" as const,
      fulfillmentType: "DINE_IN" as const,
      asOf,
    };
    const base = await pricingPipeline.price(context, input.items);
    const finalized = await pricingPipeline.finalize(context, base.lines, {
      promotionIds: [PREVIEW_PROMOTION_ID],
      candidatePromotions: [previewPromotion],
    });
    return {
      asOf: asOf.toISOString(),
      subtotal: finalized.subtotal,
      discountAmount: finalized.discountAmount,
      taxAmount: finalized.taxAmount,
      serviceChargeAmount: finalized.serviceChargeAmount,
      roundingAdjustment: finalized.roundingAdjustment,
      totalAmount: finalized.totalAmount,
      lines: finalized.lines,
    };
  },
  async list(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return promotionRepository.list(auth.tenantId);
  },
  async create(auth: AuthContext, input: PromotionInput) {
    requirePermission(auth, "menu:pricing:write");
    validate(input);
    await validateTargets(auth, input);
    const created = await promotionRepository.create({ ...persistence(input), tenantId: auth.tenantId });
    await menuChangeLog.record(auth, "PROMOTION", created.id, "CREATED", buildDiff(null, created));
    return created;
  },
  async update(auth: AuthContext, id: string, patch: Partial<PromotionInput>) {
    requirePermission(auth, "menu:pricing:write");
    const existing = await promotionRepository.findById(auth.tenantId, id);
    if (!existing) throw new NotFoundError("Promotion not found");
    const merged: PromotionInput = {
      name: patch.name ?? existing.name,
      ruleType: patch.ruleType ?? existing.ruleType,
      scope: patch.scope ?? existing.scope,
      ...(patch.value !== undefined ? { value: patch.value } : existing.value !== null ? { value: Number(existing.value) } : {}),
      ...(patch.scopeCategoryId !== undefined ? { scopeCategoryId: patch.scopeCategoryId } : existing.scopeCategoryId ? { scopeCategoryId: existing.scopeCategoryId } : {}),
      ...(patch.scopeMenuItemId !== undefined ? { scopeMenuItemId: patch.scopeMenuItemId } : existing.scopeMenuItemId ? { scopeMenuItemId: existing.scopeMenuItemId } : {}),
      ...(patch.couponCode !== undefined ? { couponCode: patch.couponCode } : existing.couponCode ? { couponCode: existing.couponCode } : {}),
      ...(patch.startDate !== undefined ? { startDate: patch.startDate } : existing.startDate ? { startDate: existing.startDate } : {}),
      ...(patch.endDate !== undefined ? { endDate: patch.endDate } : existing.endDate ? { endDate: existing.endDate } : {}),
      ...(patch.startTime !== undefined ? { startTime: patch.startTime } : existing.startTime ? { startTime: existing.startTime } : {}),
      ...(patch.endTime !== undefined ? { endTime: patch.endTime } : existing.endTime ? { endTime: existing.endTime } : {}),
      maxUsesTotal: patch.maxUsesTotal !== undefined ? patch.maxUsesTotal : existing.maxUsesTotal,
      maxUsesPerCustomer: patch.maxUsesPerCustomer !== undefined ? patch.maxUsesPerCustomer : existing.maxUsesPerCustomer,
      ...(patch.triggerMenuItemId !== undefined ? { triggerMenuItemId: patch.triggerMenuItemId } : existing.triggerMenuItemId ? { triggerMenuItemId: existing.triggerMenuItemId } : {}),
      ...(patch.triggerCategoryId !== undefined ? { triggerCategoryId: patch.triggerCategoryId } : existing.triggerCategoryId ? { triggerCategoryId: existing.triggerCategoryId } : {}),
      ...(patch.rewardMenuItemId !== undefined ? { rewardMenuItemId: patch.rewardMenuItemId } : existing.rewardMenuItemId ? { rewardMenuItemId: existing.rewardMenuItemId } : {}),
      ...(patch.rewardCategoryId !== undefined ? { rewardCategoryId: patch.rewardCategoryId } : existing.rewardCategoryId ? { rewardCategoryId: existing.rewardCategoryId } : {}),
      ...(patch.rewardDiscountPercent !== undefined ? { rewardDiscountPercent: patch.rewardDiscountPercent } : existing.rewardDiscountPercent ? { rewardDiscountPercent: Number(existing.rewardDiscountPercent) } : {}),
      ...(patch.triggerQuantity !== undefined ? { triggerQuantity: patch.triggerQuantity } : existing.triggerQuantity ? { triggerQuantity: existing.triggerQuantity } : {}),
      ...(patch.rewardQuantity !== undefined ? { rewardQuantity: patch.rewardQuantity } : existing.rewardQuantity ? { rewardQuantity: existing.rewardQuantity } : {}),
      stackableWithLoyalty: patch.stackableWithLoyalty ?? existing.stackableWithLoyalty,
      isActive: patch.isActive ?? existing.isActive,
    };
    validate(merged);
    await validateTargets(auth, merged);
    const updated = await promotionRepository.update(auth.tenantId, id, persistence(merged));
    if (!updated) throw new NotFoundError("Promotion not found");
    await menuChangeLog.record(auth, "PROMOTION", id, "UPDATED", buildDiff(existing, updated));
    return updated;
  },
  async remove(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:pricing:write");
    const existing = await promotionRepository.findById(auth.tenantId, id);
    if (!existing) return;
    await promotionRepository.remove(auth.tenantId, id);
    await menuChangeLog.record(auth, "PROMOTION", id, "DELETED", buildDiff(existing, null));
  },
  async stats(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:read");
    return promotionRepository.stats(auth.tenantId, id);
  },
};
