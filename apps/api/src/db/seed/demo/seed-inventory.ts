import { db } from "@/db";
import {
  inventoryItems,
  inventoryTransactions,
  wasteReasons,
} from "@/db/schema";
import type { DemoConfig, SeedContext } from "./types";
import { money, qty, uuidFor } from "./utils";

const ingredients = [
  "Tomatoes",
  "Onions",
  "Potatoes",
  "Paneer",
  "Chicken Breast",
  "Rice",
  "Flour",
  "Butter",
  "Cheese",
  "Milk",
  "Cream",
  "Coffee Beans",
  "Tea Leaves",
  "Sugar",
  "Cooking Oil",
  "Capsicum",
  "Mushrooms",
  "Lettuce",
  "Bread",
  "Pasta",
  "Chocolate",
  "Vanilla",
  "Lemon",
  "Mint",
  "Ginger",
  "Garlic",
  "Yogurt",
  "Coriander",
  "Spice Mix",
  "Soft Drink Syrup",
];
const units = [
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "LITERS",
  "LITERS",
  "KG",
  "KG",
  "KG",
  "LITERS",
  "KG",
  "KG",
  "KG",
  "PACKETS",
  "KG",
  "KG",
  "LITERS",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "KG",
  "LITERS",
] as const;

export const seedInventory = async (
  config: DemoConfig,
  ctx: SeedContext,
): Promise<void> => {
  for (const brand of config.brands) {
    const tenantId = ctx.tenantIds[brand.key]!;
    await db.insert(wasteReasons).values([
      {
        id: uuidFor(`waste:${brand.key}:expired`),
        tenantId,
        label: "Expired / shelf life",
      },
      {
        id: uuidFor(`waste:${brand.key}:prep`),
        tenantId,
        label: "Preparation waste",
      },
      {
        id: uuidFor(`waste:${brand.key}:damage`),
        tenantId,
        label: "Damaged stock",
      },
    ]);
    for (const [branchIndex, branchId] of ctx.branchIds[brand.key]!.entries()) {
      const performedBy =
        ctx.staffUserIdsByBranch[branchId]![0] ?? ctx.ownerUserId;
      const rows = Array.from(
        { length: config.inventoryItemsPerBranch },
        (_, index) => {
          const base = ingredients[index % ingredients.length]!;
          const cycle = Math.floor(index / ingredients.length);
          const name = cycle ? `${base} ${cycle + 1}` : base;
          const current = 18 + ((index * 17 + branchIndex * 7) % 95);
          return {
            id: uuidFor(`inventory:${brand.key}:${branchIndex}:${index}`),
            tenantId,
            branchId,
            name,
            unit: units[index % units.length]!,
            currentStock: qty(current),
            minimumStock: qty(8 + (index % 8)),
            reorderPoint: qty(12 + (index % 10)),
            costPerUnit: money(35 + ((index * 29) % 420)),
            isActive: true,
          };
        },
      );
      await db.insert(inventoryItems).values(rows);
      const tx: (typeof inventoryTransactions.$inferInsert)[] = rows.map(
        (row, index) => ({
          id: uuidFor(`inventory-opening:${brand.key}:${branchIndex}:${index}`),
          inventoryItemId: row.id,
          transactionType: "IN",
          quantity: row.currentStock,
          balanceBefore: "0.000",
          balanceAfter: row.currentStock,
          notes: "Demo opening stock",
          performedBy,
          createdAt: new Date(Date.now() - 30 * 86400000),
        }),
      );
      const sample = rows.slice(0, 3);
      tx.push(
        {
          id: uuidFor(`inventory-out:${brand.key}:${branchIndex}`),
          inventoryItemId: sample[0]!.id,
          transactionType: "OUT",
          quantity: "1.000",
          balanceBefore: sample[0]!.currentStock,
          balanceAfter: qty(Number(sample[0]!.currentStock) - 1),
          notes: "Demo stock usage",
          performedBy,
          createdAt: new Date(Date.now() - 2 * 86400000),
        },
        {
          id: uuidFor(`inventory-adjust:${brand.key}:${branchIndex}`),
          inventoryItemId: sample[1]!.id,
          transactionType: "ADJUSTMENT",
          quantity: "0.500",
          balanceBefore: sample[1]!.currentStock,
          balanceAfter: qty(Number(sample[1]!.currentStock) + 0.5),
          notes: "Demo cycle-count adjustment",
          performedBy,
          createdAt: new Date(Date.now() - 86400000),
        },
        {
          id: uuidFor(`inventory-waste:${brand.key}:${branchIndex}`),
          inventoryItemId: sample[2]!.id,
          transactionType: "WASTE",
          quantity: "0.250",
          balanceBefore: sample[2]!.currentStock,
          balanceAfter: qty(Number(sample[2]!.currentStock) - 0.25),
          notes: "Demo preparation waste",
          performedBy,
          wasteReasonId: uuidFor(`waste:${brand.key}:prep`),
          createdAt: new Date(Date.now() - 3600000),
        },
      );
      await db.insert(inventoryTransactions).values(tx);
    }
  }
};
