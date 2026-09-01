import { z } from "zod";

export const createMenuCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
  branchId: z.string().uuid().optional(),
});

export const createMenuItemSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  basePrice: z.number().min(0),
  taxRate: z.number().min(0).max(100).default(0),
  branchId: z.string().uuid().optional(),
  variants: z
    .array(
      z.object({
        name: z.string().min(1),

        price: z.number().min(0),
      }),
    )
    .optional(),
  modifiers: z
    .array(
      z.object({
        name: z.string().min(1),
        additionalPrice: z.number().min(0),
        isRequired: z.boolean().default(false),
      }),
    )
    .optional(),
});

export type CreateMenuItemInput = z.infer<typeof createMenuItemSchema>;

export const menuItemFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(200, "Item name must be 200 characters or fewer"),
  description: z
    .string()
    .max(1000, "Description must be 1000 characters or fewer"),
  basePrice: z
    .string()
    .refine(
      (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
      "Base price must be 0 or greater",
    ),
  taxRate: z
    .string()
    .refine(
      (v) => Number.isFinite(Number(v)) && Number(v) >= 0 && Number(v) <= 100,
      "Tax rate must be between 0 and 100",
    ),
  foodType: z.enum(["VEG", "NON_VEG", "EGG"]),
  spiceLevel: z.enum(["", "NONE", "MILD", "MEDIUM", "HOT"]),
  sku: z.string().max(100, "SKU must be 100 characters or fewer"),
  prepTimeMinutes: z
    .string()
    .refine(
      (v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0),
      "Prep time must be a whole number of minutes",
    ),
  hsnCode: z.string().max(20, "HSN code must be 20 characters or fewer"),
  status: z.enum([
    "ACTIVE",
    "OUT_OF_STOCK",
    "HIDDEN",
    "SEASONAL",
    "DISCONTINUED",
  ]),
  availabilityReason: z
    .string()
    .max(500, "Reason must be 500 characters or fewer"),
  enableRecipeDeduction: z.boolean(),
  variants: z.array(
    z.object({
      id: z.string().uuid().optional(),
      name: z
        .string()
        .trim()
        .min(1, "Variant name is required")
        .max(100, "Variant name must be 100 characters or fewer"),
      price: z
        .string()
        .refine(
          (v) => Number.isFinite(Number(v)) && Number(v) >= 0,
          "Variant price must be 0 or greater",
        ),
    }),
  ),
  imageUrls: z.array(z.string().url("Image URL must be a valid URL")),
  modifierGroupIds: z.array(z.string().uuid()),
  tagIds: z.array(z.string().uuid()),
  allergenIds: z.array(z.string().uuid()),
});

export type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

export const advancedMenuItemPricingSchema = z
  .object({
    pricingMode: z.enum(["FIXED", "WEIGHT_BASED", "OPEN"]),
    weightUnit: z.enum(["G", "KG", "LB", "OZ"]).nullable().optional(),
    openPriceMin: z.number().min(0).nullable().optional(),
    openPriceMax: z.number().min(0).nullable().optional(),
    supportsZones: z.boolean(),
    zonePricingRule: z.enum(["AVERAGE", "HIGHER", "SUM_HALF"]),
    manualStockCount: z.number().int().min(0).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.pricingMode === "WEIGHT_BASED" && !value.weightUnit) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weightUnit"],
        message: "Weight-based items require a weight unit",
      });
    }
    if (value.pricingMode !== "WEIGHT_BASED" && value.weightUnit != null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weightUnit"],
        message: "weightUnit is only valid for weight-based items",
      });
    }
    if (
      value.pricingMode !== "OPEN" &&
      (value.openPriceMin != null || value.openPriceMax != null)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["openPriceMin"],
        message: "Open-price limits are only valid for open-priced items",
      });
    }
    if (
      value.openPriceMin != null &&
      value.openPriceMax != null &&
      value.openPriceMin > value.openPriceMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["openPriceMax"],
        message:
          "Open-price maximum must be greater than or equal to the minimum",
      });
    }
  });

export type AdvancedMenuItemPricingInput = z.infer<
  typeof advancedMenuItemPricingSchema
>;
