

import * as XLSX from "xlsx";
import type { MenuItemStatus, FoodType, SpiceLevel } from "@pos/types";

export interface ImportItemRow {
  id?: string;
  name?: string;
  category?: string;
  description?: string;
  basePrice?: string | number;
  taxRate?: string | number;
  foodType?: string;
  spiceLevel?: string;
  sku?: string;
  status?: string;
  hsnCode?: string;
  prepTimeMinutes?: string | number;
}

export interface RowError {
  row: number;
  field?: string;
  message: string;
}

export interface ValidatedRow {
  row: number;
  action: "insert" | "update";
  data: {
    id?: string;
    categoryId: string;
    name: string;
    description: string | null;
    basePrice: string;
    taxRate: string;
    foodType: FoodType;
    spiceLevel: SpiceLevel | null;
    sku: string | null;
    status: MenuItemStatus;
    hsnCode: string | null;
    prepTimeMinutes: number | null;
  };
}

const FOOD_TYPES = new Set(["VEG", "NON_VEG", "EGG"]);
const SPICE_LEVELS = new Set(["NONE", "MILD", "MEDIUM", "HOT"]);
const STATUSES = new Set([
  "ACTIVE",
  "OUT_OF_STOCK",
  "HIDDEN",
  "SEASONAL",
  "DISCONTINUED",
]);

export function parseFile(
  buffer: ArrayBuffer,
  filename: string,
): ImportItemRow[] {
  const isCsv = filename.toLowerCase().endsWith(".csv");
  const book = XLSX.read(buffer, { type: "array", raw: false });
  const sheet = book.Sheets[book.SheetNames[0]!]!;
  return XLSX.utils.sheet_to_json<ImportItemRow>(sheet, {
    defval: undefined,
    raw: isCsv ? false : true,
  });
}

export function buildTemplate(format: "csv" | "xlsx"): {
  content: string | Buffer;
  contentType: string;
} {
  const rows = [
    {
      id: "",
      name: "Margherita Pizza",
      category: "Pizza",
      description: "Classic cheese pizza",
      basePrice: 250,
      taxRate: 5,
      foodType: "VEG",
      spiceLevel: "NONE",
      sku: "PIZZA-001",
      status: "ACTIVE",
      hsnCode: "",
      prepTimeMinutes: 15,
    },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  if (format === "csv")
    return { content: XLSX.utils.sheet_to_csv(sheet), contentType: "text/csv" };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Sheet1");
  return {
    content: XLSX.write(book, { type: "buffer", bookType: "xlsx" }) as Buffer,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };
}

export function validateRows(
  rows: ImportItemRow[],
  categoryByName: Map<string, string>,
  existingItemIds: Set<string>,
  skuToItemId: Map<string, string>,
): { valid: ValidatedRow[]; errors: RowError[] } {
  const errors: RowError[] = [];
  const valid: ValidatedRow[] = [];
  const seenSkusInBatch = new Set<string>();

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const rowErrors: RowError[] = [];

    const name = String(raw.name ?? "").trim();
    if (!name)
      rowErrors.push({
        row: rowNum,
        field: "name",
        message: "Name is required",
      });

    const categoryName = String(raw.category ?? "").trim();
    const categoryId = categoryByName.get(categoryName.toLowerCase());
    if (!categoryName)
      rowErrors.push({
        row: rowNum,
        field: "category",
        message: "Category is required",
      });
    else if (!categoryId)
      rowErrors.push({
        row: rowNum,
        field: "category",
        message: `Category "${categoryName}" does not exist`,
      });

    const basePriceNum =
      typeof raw.basePrice === "number"
        ? raw.basePrice
        : parseFloat(String(raw.basePrice ?? ""));
    if (!Number.isFinite(basePriceNum) || basePriceNum <= 0) {
      rowErrors.push({
        row: rowNum,
        field: "basePrice",
        message: "Price must be a positive number",
      });
    }

    const taxRateNum =
      raw.taxRate != null && raw.taxRate !== "" ? Number(raw.taxRate) : 0;
    if (!Number.isFinite(taxRateNum) || taxRateNum < 0) {
      rowErrors.push({
        row: rowNum,
        field: "taxRate",
        message: "Tax rate must be a non-negative number",
      });
    }

    const foodType = String(raw.foodType ?? "VEG")
      .trim()
      .toUpperCase();
    if (!FOOD_TYPES.has(foodType))
      rowErrors.push({
        row: rowNum,
        field: "foodType",
        message: `foodType must be one of ${[...FOOD_TYPES].join(", ")}`,
      });

    const spiceLevelRaw =
      raw.spiceLevel != null ? String(raw.spiceLevel).trim().toUpperCase() : "";
    if (spiceLevelRaw && !SPICE_LEVELS.has(spiceLevelRaw)) {
      rowErrors.push({
        row: rowNum,
        field: "spiceLevel",
        message: `spiceLevel must be one of ${[...SPICE_LEVELS].join(", ")}`,
      });
    }

    const status = raw.status
      ? String(raw.status).trim().toUpperCase()
      : "ACTIVE";
    if (!STATUSES.has(status))
      rowErrors.push({
        row: rowNum,
        field: "status",
        message: `status must be one of ${[...STATUSES].join(", ")}`,
      });

    const skuRaw = raw.sku != null ? String(raw.sku).trim() : "";
    let itemId = raw.id ? String(raw.id).trim() : undefined;
    if (skuRaw) {
      const skuKey = skuRaw.toLowerCase();
      const existingOwnerId = skuToItemId.get(skuKey);

      if (seenSkusInBatch.has(skuKey)) {
        rowErrors.push({
          row: rowNum,
          field: "sku",
          message: `Duplicate SKU "${skuRaw}" within this file`,
        });
      } else if (existingOwnerId && existingOwnerId !== itemId) {
        rowErrors.push({
          row: rowNum,
          field: "sku",
          message: `SKU "${skuRaw}" is already used by another item`,
        });
      }
      seenSkusInBatch.add(skuKey);
    }

    if (itemId && !existingItemIds.has(itemId)) {
      rowErrors.push({
        row: rowNum,
        field: "id",
        message: `No existing item with id "${itemId}" — remove the id column to insert a new item instead`,
      });
      itemId = undefined;
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
      return;
    }

    valid.push({
      row: rowNum,
      action: itemId ? "update" : "insert",
      data: {
        ...(itemId ? { id: itemId } : {}),
        categoryId: categoryId!,
        name,
        description: raw.description ? String(raw.description).trim() : null,
        basePrice: basePriceNum.toFixed(2),
        taxRate: taxRateNum.toFixed(2),
        foodType: foodType as FoodType,
        spiceLevel: (spiceLevelRaw || null) as SpiceLevel | null,
        sku: skuRaw || null,
        status: status as MenuItemStatus,
        hsnCode: raw.hsnCode ? String(raw.hsnCode).trim() : null,
        prepTimeMinutes:
          raw.prepTimeMinutes != null && raw.prepTimeMinutes !== ""
            ? Number(raw.prepTimeMinutes)
            : null,
      },
    });
  });

  return { valid, errors };
}
