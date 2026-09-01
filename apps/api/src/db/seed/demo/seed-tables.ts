import { db } from "@/db";
import { kitchenStations, restaurantTables } from "@/db/schema";
import type { DemoConfig, SeedContext } from "./types";
import { uuidFor } from "./utils";

export const seedTablesAndStations = async (config: DemoConfig, ctx: SeedContext): Promise<void> => {
  for (const brand of config.brands) {
    const tenantId = ctx.tenantIds[brand.key]!;
    for (const [branchIndex, branchId] of ctx.branchIds[brand.key]!.entries()) {
      const tableRows = Array.from({ length: config.tablesPerBranch }, (_, tableIndex) => ({
        id: uuidFor(`table:${brand.key}:${branchIndex}:${tableIndex}`), tenantId, branchId,
        name: `T${tableIndex + 1}`, publicQrToken: uuidFor(`table-qr:${brand.key}:${branchIndex}:${tableIndex}`),
        capacity: tableIndex % 5 === 0 ? 6 : tableIndex % 3 === 0 ? 2 : 4,
        status: tableIndex === 0 ? "OCCUPIED" as const : tableIndex === 1 ? "RESERVED" as const : "AVAILABLE" as const,
        section: tableIndex < Math.ceil(config.tablesPerBranch / 2) ? "Main Floor" : "Patio",
      }));
      await db.insert(restaurantTables).values(tableRows);
      await db.insert(kitchenStations).values([
        { id: uuidFor(`station:${brand.key}:${branchIndex}:hot`), tenantId, branchId, name: "Hot Kitchen", sortOrder: 1 },
        { id: uuidFor(`station:${brand.key}:${branchIndex}:cold`), tenantId, branchId, name: "Cold / Pantry", sortOrder: 2 },
        { id: uuidFor(`station:${brand.key}:${branchIndex}:beverage`), tenantId, branchId, name: "Beverage", sortOrder: 3 },
      ]);
    }
  }
};
