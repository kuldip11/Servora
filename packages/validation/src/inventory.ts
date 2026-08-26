import { z } from "zod";

export const createInventoryItemSchema = z.object({
  name: z.string().min(1).max(200),
  unit: z.enum(["KG", "GRAMS", "LITERS", "ML", "PIECES", "PACKETS"]),
  currentStock: z.number().min(0),
  minimumStock: z.number().min(0),
  reorderPoint: z.number().min(0),
  costPerUnit: z.number().min(0),
  branchId: z.string().uuid().optional(),
});

export const updateInventoryStockSchema = z.object({
  quantity: z.number().positive(),
  transactionType: z.enum(["IN", "OUT", "ADJUSTMENT", "WASTE"]),
  notes: z.string().max(500).optional(),
});

export type CreateInventoryItemInput = z.infer<
  typeof createInventoryItemSchema
>;

export type UpdateInventoryStockInput = z.infer<
  typeof updateInventoryStockSchema
>;
