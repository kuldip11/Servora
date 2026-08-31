import type { InventoryItem, InventoryUnit } from "@pos/types";

export const toRealtimeInventoryItem = (item: {
  id: string;
  tenantId: string;
  branchId: string;
  name: string;
  unit: InventoryUnit;
  currentStock: string;
  minimumStock: string;
  reorderPoint: string;
  costPerUnit: string;
  isActive: boolean;
}): InventoryItem => {
  return {
    id: item.id,
    tenantId: item.tenantId,
    branchId: item.branchId,
    name: item.name,
    unit: item.unit,
    currentStock: Number(item.currentStock),
    minimumStock: Number(item.minimumStock),
    reorderPoint: Number(item.reorderPoint),
    costPerUnit: Number(item.costPerUnit),
    isActive: item.isActive,
  };
};
