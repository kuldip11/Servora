import { beforeEach, describe, expect, it, vi } from "vitest";

const instances: any[] = [];
vi.mock("ioredis", () => ({
  default: class FakeRedis {
    constructor(
      public url: string,
      public options: any,
    ) {
      instances.push(this);
    }
    on = vi.fn();
  },
}));

describe("redis configuration", () => {
  beforeEach(() => {
    instances.length = 0;
    process.env.REDIS_URL = "redis://localhost:6379";
    vi.resetModules();
  });
  it("creates dedicated cache, publisher and subscriber clients", async () => {
    const mod = await import("../redis");
    expect(instances).toHaveLength(3);
    expect(mod.redis).toBe(instances[0]);
    expect(mod.publisher).toBe(instances[1]);
    expect(mod.subscriber).toBe(instances[2]);
    expect(mod.CACHE_TTL).toEqual({
      SHORT: 60,
      MEDIUM: 300,
      LONG: 3600,
      DAY: 86400,
    });
  });
  it("exposes stable realtime channel names", async () => {
    const mod = await import("../redis");
    expect(mod.REDIS_CHANNELS).toEqual({
      ORDER_EVENTS: "pos:order_events",
      KITCHEN_EVENTS: "pos:kitchen_events",
      INVENTORY_EVENTS: "pos:inventory_events",
      TABLE_EVENTS: "pos:table_events",
    });
  });
});
