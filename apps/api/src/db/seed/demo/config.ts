import { buildBrands } from "./data/brands";
import type { DemoConfig, DemoPreset } from "./types";

export const resolvePreset = (preset: DemoPreset): DemoConfig => {
  if (preset === "stress") return {
    preset, historyDays: 365, ordersPerBranchPerDay: 55, customersPerTenant: 12000,
    tablesPerBranch: 28, inventoryItemsPerBranch: 90, staffPerBranch: 14,
    brands: buildBrands(12, 180),
  };
  if (preset === "demo") return {
    preset, historyDays: 365, ordersPerBranchPerDay: 22, customersPerTenant: 2500,
    tablesPerBranch: 24, inventoryItemsPerBranch: 70, staffPerBranch: 10,
    brands: buildBrands(6, 160),
  };
  return {
    preset, historyDays: 30, ordersPerBranchPerDay: 5, customersPerTenant: 80,
    tablesPerBranch: 10, inventoryItemsPerBranch: 24, staffPerBranch: 4,
    brands: buildBrands(2, 40),
  };
};
