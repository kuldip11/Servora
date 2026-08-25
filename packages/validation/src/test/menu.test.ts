import { describe, expect, it } from "vitest";
import {
  createMenuCategorySchema,
  createMenuItemSchema,
  menuItemFormSchema,
} from "../menu";

const uuid = "550e8400-e29b-41d4-a716-446655440000";
const item = { categoryId: uuid, name: "Pizza", basePrice: 100 };

describe("createMenuCategorySchema", () => {
  it("defaults sortOrder to zero", () =>
    expect(createMenuCategorySchema.parse({ name: " Mains " }).sortOrder).toBe(
      0,
    ));
  it("accepts valid optional fields and rejects invalid boundaries", () => {
    expect(
      createMenuCategorySchema.safeParse({
        name: "Mains",
        description: "x".repeat(500),
        sortOrder: 0,
        branchId: uuid,
      }).success,
    ).toBe(true);
    expect(
      createMenuCategorySchema.safeParse({ name: "", sortOrder: -1 }).success,
    ).toBe(false);
    expect(
      createMenuCategorySchema.safeParse({ name: "x".repeat(101) }).success,
    ).toBe(false);
  });
});

describe("createMenuItemSchema", () => {
  it("accepts variants and modifiers with non-negative prices", () => {
    expect(
      createMenuItemSchema.safeParse({
        ...item,
        variants: [{ name: "Large", price: 150 }],
        modifiers: [{ name: "Cheese", additionalPrice: 20 }],
      }).success,
    ).toBe(true);
  });
  it("defaults taxRate and modifier required state", () => {
    const result = createMenuItemSchema.parse({
      ...item,
      modifiers: [{ name: "Cheese", additionalPrice: 20 }],
    });
    expect(result.taxRate).toBe(0);
    expect(result.modifiers?.[0]?.isRequired).toBe(false);
  });
  it("rejects invalid UUIDs, negative prices, and tax rates outside 0-100", () => {
    expect(
      createMenuItemSchema.safeParse({ ...item, categoryId: "bad" }).success,
    ).toBe(false);
    expect(
      createMenuItemSchema.safeParse({ ...item, basePrice: -1 }).success,
    ).toBe(false);
    expect(
      createMenuItemSchema.safeParse({ ...item, taxRate: 101 }).success,
    ).toBe(false);
  });
});

describe("menuItemFormSchema", () => {
  const valid = {
    name: " Pizza ",
    description: "",
    basePrice: "100",
    taxRate: "5",
    foodType: "VEG" as const,
    spiceLevel: "MILD" as const,
    sku: "",
    prepTimeMinutes: "15",
    hsnCode: "",
    status: "ACTIVE" as const,
    availabilityReason: "",
    enableRecipeDeduction: false,
    variants: [],
    imageUrls: [],
    modifierGroupIds: [],
    tagIds: [],
    allergenIds: [],
  };
  it("accepts valid HTML-form values and trims the name", () =>
    expect(menuItemFormSchema.parse(valid).name).toBe("Pizza"));
  it("rejects invalid numeric strings, URLs, UUIDs, and enum values", () => {
    expect(
      menuItemFormSchema.safeParse({ ...valid, basePrice: "-1" }).success,
    ).toBe(false);
    expect(
      menuItemFormSchema.safeParse({ ...valid, taxRate: "101" }).success,
    ).toBe(false);
    expect(
      menuItemFormSchema.safeParse({ ...valid, prepTimeMinutes: "1.5" })
        .success,
    ).toBe(false);
    expect(
      menuItemFormSchema.safeParse({ ...valid, imageUrls: ["not-a-url"] })
        .success,
    ).toBe(false);
    expect(
      menuItemFormSchema.safeParse({ ...valid, modifierGroupIds: ["bad"] })
        .success,
    ).toBe(false);
  });
});
