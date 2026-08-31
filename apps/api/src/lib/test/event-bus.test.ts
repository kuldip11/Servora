import { beforeEach, describe, expect, it, vi } from "vitest";

const { publish } = vi.hoisted(() => ({
  publish: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../redis", () => ({
  publisher: { publish },
  REDIS_CHANNELS: {
    ORDER_EVENTS: "orders",
    KITCHEN_EVENTS: "kitchen",
    INVENTORY_EVENTS: "inventory",
    TABLE_EVENTS: "table",
  },
}));

import { eventBus } from "../event-bus";

describe("eventBus", () => {
  beforeEach(() => publish.mockClear());
  it.each([
    ["order.created", "orders"],
    ["kitchen.ready", "kitchen"],
    ["inventory.low", "inventory"],
    ["menu.availability.updated", "inventory"],
    ["table.updated", "table"],
    ["unknown.event", "orders"],
  ])("routes %s to %s", async (type, channel) => {
    await eventBus.publish({ type } as any, "tenant-1", "branch-1");
    expect(publish).toHaveBeenCalledWith(
      channel,
      expect.stringContaining('"tenantId":"tenant-1"'),
    );
    expect(JSON.parse(publish.mock.calls[0]![1])).toMatchObject({
      type,
      tenantId: "tenant-1",
      branchId: "branch-1",
    });
  });
  it("delivers a published event to local domain subscribers with actor context", async () => {
    const handler = vi.fn();
    const unsubscribe = eventBus.subscribe("menu.availability.updated", handler);
    const event = {
      type: "menu.availability.updated" as const,
      payload: {
        source: "INVENTORY" as const,
        entityType: "ITEM" as const,
        entityId: "m1",
        menuItemId: "m1",
        computedStatus: "ACTIVE" as const,
      },
    };
    await eventBus.publish(event, "tenant-1", "branch-1", { userId: "u1", requestId: "r1" });
    expect(handler).toHaveBeenCalledWith({
      event,
      tenantId: "tenant-1",
      branchId: "branch-1",
      context: { userId: "u1", requestId: "r1" },
    });
    unsubscribe();
  });

});
