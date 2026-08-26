import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  menuCategories,
  menuItems,
  menuItemVariants,
  modifierGroups,
  modifierOptions,
  menuItemModifierGroups,
  menuTags,
  menuItemTags,
  menuAllergens,
  menuItemAllergens,
  menuItemImages,
  menuItemSchedules,
  holidays,
  menuItemBranchOverrides,
  menuTemplates,
  menuTemplateItems,
  menuItemStatusEnum,
  foodTypeEnum,
  spiceLevelEnum,
  modifierSelectionTypeEnum,
  menuItemScheduleTypeEnum,
} from "../menu.schema";

function expectTable(table: any, name: string, columns: string[]) {
  expect(getTableConfig(table).name).toBe(name);
  const actual = Object.keys(table[Symbol.for("drizzle:Columns")]);
  expect(actual).toEqual(expect.arrayContaining(columns));
  expect(actual).toHaveLength(columns.length);
}

describe("menu.schema.ts", () => {
  const cases: [any, string, string[]][] = [
    [
      menuCategories,
      "menu_categories",
      [
        "id",
        "tenantId",
        "branchId",
        "name",
        "description",
        "sortOrder",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      menuItems,
      "menu_items",
      [
        "id",
        "tenantId",
        "branchId",
        "categoryId",
        "name",
        "description",
        "basePrice",
        "taxRate",
        "isAvailable",
        "imageUrl",
        "foodType",
        "spiceLevel",
        "sku",
        "prepTimeMinutes",
        "sortOrder",
        "hsnCode",
        "status",
        "availabilityReason",
        "statusChangedAt",
        "enableRecipeDeduction",
        "isPublished",
        "publishedAt",
        "deletedAt",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      menuItemVariants,
      "menu_item_variants",
      ["id", "menuItemId", "name", "price"],
    ],
    [
      modifierGroups,
      "modifier_groups",
      [
        "id",
        "tenantId",
        "branchId",
        "name",
        "selectionType",
        "minSelections",
        "maxSelections",
        "sortOrder",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      modifierOptions,
      "modifier_options",
      [
        "id",
        "modifierGroupId",
        "name",
        "additionalPrice",
        "isAvailable",
        "maxQuantity",
        "sortOrder",
      ],
    ],
    [
      menuItemModifierGroups,
      "menu_item_modifier_groups",
      ["menuItemId", "modifierGroupId", "sortOrder"],
    ],
    [menuTags, "menu_tags", ["id", "tenantId", "name", "color", "createdAt"]],
    [menuItemTags, "menu_item_tags", ["menuItemId", "tagId"]],
    [menuAllergens, "menu_allergens", ["id", "name"]],
    [menuItemAllergens, "menu_item_allergens", ["menuItemId", "allergenId"]],
    [
      menuItemImages,
      "menu_item_images",
      ["id", "menuItemId", "url", "sortOrder"],
    ],
    [
      menuItemSchedules,
      "menu_item_schedules",
      [
        "id",
        "tenantId",
        "menuItemId",
        "branchId",
        "scheduleType",
        "startTime",
        "endTime",
        "dayOfWeek",
        "startDate",
        "endDate",
        "holidayName",
        "statusDuringPeriod",
        "isActive",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      holidays,
      "holidays",
      ["id", "tenantId", "name", "holidayDate", "region", "createdAt"],
    ],
    [
      menuItemBranchOverrides,
      "menu_item_branch_overrides",
      [
        "id",
        "tenantId",
        "menuItemId",
        "branchId",
        "price",
        "taxRate",
        "prepTimeMinutes",
        "status",
        "isHidden",
        "availabilityReason",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      menuTemplates,
      "menu_templates",
      [
        "id",
        "tenantId",
        "name",
        "description",
        "sourceCategoryName",
        "createdAt",
        "updatedAt",
      ],
    ],
    [
      menuTemplateItems,
      "menu_template_items",
      [
        "id",
        "templateId",
        "name",
        "description",
        "basePrice",
        "taxRate",
        "foodType",
        "spiceLevel",
        "prepTimeMinutes",
        "hsnCode",
        "sortOrder",
      ],
    ],
  ];

  for (const [table, name, columns] of cases) {
    it(`defines ${name} with its contract columns`, () =>
      expectTable(table, name, columns));
  }

  it("keeps menu enums stable", () => {
    expect(menuItemStatusEnum.enumValues).toEqual([
      "ACTIVE",
      "OUT_OF_STOCK",
      "HIDDEN",
      "SEASONAL",
      "DISCONTINUED",
    ]);
    expect(foodTypeEnum.enumValues).toEqual(["VEG", "NON_VEG", "EGG"]);
    expect(spiceLevelEnum.enumValues).toEqual([
      "NONE",
      "MILD",
      "MEDIUM",
      "HOT",
    ]);
    expect(modifierSelectionTypeEnum.enumValues).toEqual([
      "SINGLE",
      "MULTIPLE",
    ]);
    expect(menuItemScheduleTypeEnum.enumValues).toEqual([
      "DAILY",
      "WEEKLY",
      "SPECIFIC_DATE",
      "HOLIDAY",
    ]);
  });
});
