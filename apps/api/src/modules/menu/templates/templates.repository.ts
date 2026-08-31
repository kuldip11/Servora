/** Persistence operations for menu templates. */
import { eq, and, isNull } from "drizzle-orm";
import { db } from "../../../db";
import {
  menuTemplates,
  menuTemplateItems,
  menuCategories,
  menuItems,
} from "../../../db/schema";
import type { FoodType, SpiceLevel } from "@pos/types";

export const templatesRepository = {
  async findMany(tenantId: string) {
    return db.query.menuTemplates.findMany({
      where: eq(menuTemplates.tenantId, tenantId),
      with: { items: { orderBy: (t, { asc: a }) => [a(t.sortOrder)] } },
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  },

  async findById(tenantId: string, templateId: string) {
    return db.query.menuTemplates.findFirst({
      where: and(
        eq(menuTemplates.id, templateId),
        eq(menuTemplates.tenantId, tenantId),
      ),
      with: { items: { orderBy: (t, { asc: a }) => [a(t.sortOrder)] } },
    });
  },

  async findCategory(tenantId: string, categoryId: string) {
    return db.query.menuCategories.findFirst({
      where: and(
        eq(menuCategories.id, categoryId),
        eq(menuCategories.tenantId, tenantId),
      ),
    });
  },

  async findTenantWideCategoryItems(tenantId: string, categoryId: string) {
    return db.query.menuItems.findMany({
      where: and(
        eq(menuItems.categoryId, categoryId),
        eq(menuItems.tenantId, tenantId),
        isNull(menuItems.deletedAt),
        isNull(menuItems.branchId),
      ),
      orderBy: (t, { asc: a }) => [a(t.sortOrder)],
    });
  },

  // Snapshots a category's tenant-wide items into a new, independent
  // template. Editing the category afterward never touches the template.
  async createFromCategory(
    tenantId: string,
    category: { name: string },
    name: string,
    description: string | undefined,
    items: Array<{
      name: string;
      description: string | null;
      basePrice: string;
      pricingMode: "FIXED" | "WEIGHT_BASED" | "OPEN";
      weightUnit: "G" | "KG" | "LB" | "OZ" | null;
      openPriceMin: string | null;
      openPriceMax: string | null;
      supportsZones: boolean;
      zonePricingRule: "AVERAGE" | "HIGHER" | "SUM_HALF";
      manualStockCount: number | null;
      manualStockCountUpdatedAt: Date | null;
      taxRate: string;
      taxMode: "INCLUSIVE" | "EXCLUSIVE" | null;
      foodType: FoodType;
      spiceLevel: SpiceLevel | null;
      prepTimeMinutes: number | null;
      hsnCode: string | null;
    }>,
  ) {
    return db.transaction(async (tx) => {
      const [template] = await tx
        .insert(menuTemplates)
        .values({
          tenantId,
          name: name.trim(),
          description: description?.trim() || null,
          sourceCategoryName: category.name,
        })
        .returning();

      if (items.length) {
        await tx.insert(menuTemplateItems).values(
          items.map((it, i) => ({
            templateId: template!.id,
            name: it.name,
            description: it.description,
            basePrice: it.basePrice,
            pricingMode: it.pricingMode,
            weightUnit: it.weightUnit,
            openPriceMin: it.openPriceMin,
            openPriceMax: it.openPriceMax,
            supportsZones: it.supportsZones,
            zonePricingRule: it.zonePricingRule,
            manualStockCount: it.manualStockCount,
            manualStockCountUpdatedAt: it.manualStockCountUpdatedAt,
            taxRate: it.taxRate,
            taxMode: it.taxMode,
            foodType: it.foodType,
            spiceLevel: it.spiceLevel,
            prepTimeMinutes: it.prepTimeMinutes,
            hsnCode: it.hsnCode,
            sortOrder: i,
          })),
        );
      }

      return tx.query.menuTemplates.findFirst({
        where: eq(menuTemplates.id, template!.id),
        with: { items: true },
      });
    });
  },

  async delete(tenantId: string, templateId: string): Promise<boolean> {
    const result = await db
      .delete(menuTemplates)
      .where(
        and(
          eq(menuTemplates.id, templateId),
          eq(menuTemplates.tenantId, tenantId),
        ),
      )
      .returning({ id: menuTemplates.id });
    return result.length > 0;
  },

  // Instantiates a template as a brand-new category + items. Items are
  // always created as drafts (isPublished: false) — a template's prices
  // and details are a starting point, not a promise, so a manager reviews
  // and publishes them rather than the branch's menu changing the instant
  // the template is applied.
  async apply(
    tenantId: string,
    template: {
      name: string;
      description: string | null;
      items: Array<{
        name: string;
        description: string | null;
        basePrice: string;
        pricingMode: "FIXED" | "WEIGHT_BASED" | "OPEN";
        weightUnit: "G" | "KG" | "LB" | "OZ" | null;
        openPriceMin: string | null;
        openPriceMax: string | null;
        supportsZones: boolean;
        zonePricingRule: "AVERAGE" | "HIGHER" | "SUM_HALF";
        manualStockCount: number | null;
        manualStockCountUpdatedAt: Date | null;
        taxRate: string;
        taxMode: "INCLUSIVE" | "EXCLUSIVE" | null;
        foodType: FoodType;
        spiceLevel: SpiceLevel | null;
        prepTimeMinutes: number | null;
        hsnCode: string | null;
        sortOrder: number;
      }>;
    },
    options: {
      branchId?: string | undefined;
      categoryName?: string | undefined;
    },
  ) {
    return db.transaction(async (tx) => {
      const [category] = await tx
        .insert(menuCategories)
        .values({
          tenantId,
          branchId: options.branchId ?? null,
          name: options.categoryName?.trim() || template.name,
          description: template.description,
          sortOrder: 0,
        })
        .returning();

      const createdItems = template.items.length
        ? await tx
            .insert(menuItems)
            .values(
              template.items.map((ti) => ({
                tenantId,
                branchId: options.branchId ?? null,
                categoryId: category!.id,
                name: ti.name,
                description: ti.description,
                basePrice: ti.basePrice,
                pricingMode: ti.pricingMode,
                weightUnit: ti.weightUnit,
                openPriceMin: ti.openPriceMin,
                openPriceMax: ti.openPriceMax,
                supportsZones: ti.supportsZones,
                zonePricingRule: ti.zonePricingRule,
                manualStockCount: ti.manualStockCount,
                manualStockCountUpdatedAt: ti.manualStockCountUpdatedAt,
                taxRate: ti.taxRate,
                taxMode: ti.taxMode,
                foodType: ti.foodType,
                spiceLevel: ti.spiceLevel,
                prepTimeMinutes: ti.prepTimeMinutes,
                hsnCode: ti.hsnCode,
                sortOrder: ti.sortOrder,
                sku: null, // SKUs are meant to be unique — never carried over from a template
                status: "ACTIVE" as const,
                isPublished: false, // draft until a manager reviews it — see function comment
                publishedAt: null,
              })),
            )
            .returning()
        : [];

      return { category, items: createdItems };
    });
  },
};
