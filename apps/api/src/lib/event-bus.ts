import { publisher, REDIS_CHANNELS } from "./redis";
import type { RealtimeEvent } from "@pos/types";

type EventChannel = keyof typeof REDIS_CHANNELS;

export const eventBus = {
  async publish(
    event: RealtimeEvent,
    tenantId: string,
    branchId?: string,
  ): Promise<void> {
    const message = JSON.stringify({
      ...event,
      tenantId,
      branchId,
      timestamp: new Date().toISOString(),
    });

    let channel: string;
    if (event.type.startsWith("order.")) {
      channel = REDIS_CHANNELS.ORDER_EVENTS;
    } else if (event.type.startsWith("kitchen.")) {
      channel = REDIS_CHANNELS.KITCHEN_EVENTS;
    } else if (event.type.startsWith("inventory.")) {
      channel = REDIS_CHANNELS.INVENTORY_EVENTS;
    } else if (event.type.startsWith("table.")) {
      channel = REDIS_CHANNELS.TABLE_EVENTS;
    } else {
      channel = REDIS_CHANNELS.ORDER_EVENTS;
    }

    await publisher.publish(channel, message);
  },
};
