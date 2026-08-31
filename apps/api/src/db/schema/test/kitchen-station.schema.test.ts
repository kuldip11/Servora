import { describe, expect, it } from "vitest";
import { getTableConfig } from "drizzle-orm/pg-core";
import {
  itemStationRouting,
  kitchenStations,
} from "@/db/schema/kitchen.schema";

describe("kitchen station schema", () => {
  it("keeps stations tenant/branch scoped and routing normalized", () => {
    const station = getTableConfig(kitchenStations);
    const routing = getTableConfig(itemStationRouting);
    expect(station.name).toBe("kitchen_stations");
    expect(station.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining(["tenant_id", "branch_id", "printer_identifier"]),
    );
    expect(routing.columns.map((column) => column.name)).toEqual(
      expect.arrayContaining([
        "menu_item_id",
        "station_id",
        "modifier_option_id",
      ]),
    );
    expect(routing.indexes).toHaveLength(3);
  });
});
