import type { OrderType } from "@pos/types";
import {
  availabilityService,
  type AvailabilityChannel,
} from "@/modules/menu/availability/availability.service";
import { menuChangeLog } from "@/modules/menu/change-log/menu-change-log";
import { stationResolver } from "@/modules/kitchen-tickets/stations/station.service";
import type { PricedLine } from "./pricing/pricing.types";

export interface OrderLineSnapshotContext {
  branchId: string;
  channel: AvailabilityChannel;
  fulfillmentType: OrderType;
  asOf: Date;
}

export const snapshotOrderLines = async (
  tenantId: string,
  lines: PricedLine[],
  context: OrderLineSnapshotContext,
): Promise<PricedLine[]> => {
  const menuItemIds = lines.flatMap((line) =>
    line.menuItemId === null ? [] : [line.menuItemId],
  );
  const versionByItem = await menuChangeLog.latestForItems(
    tenantId,
    menuItemIds,
    context.asOf,
  );

  return Promise.all(
    lines.map(async (line) => {
      if (line.menuItemId === null) {
        return {
          ...line,
          stationId: null,
          menuChangeEventId: null,
          resolutionAsOf: context.asOf,
          availabilitySnapshot: null,
        };
      }
      const [stationId, availabilityResolution] = await Promise.all([
        stationResolver.resolveForOrderItem(
          tenantId,
          line.menuItemId,
          line.modifiers.map((modifier) => modifier.modifierId),
        ),
        availabilityService.getEffectiveItemWithEvidence(
          tenantId,
          line.menuItemId,
          context.branchId,
          {
            channel: context.channel,
            fulfillmentType: context.fulfillmentType,
            asOf: context.asOf,
          },
        ),
      ]);
      const availability = availabilityResolution.effective;
      return {
        ...line,
        stationId,
        menuChangeEventId: versionByItem.get(line.menuItemId) ?? null,
        resolutionAsOf: context.asOf,
        availabilityReplayEvidence: availabilityResolution.evidence,
        availabilitySnapshot: {
          asOf: context.asOf.toISOString(),
          branchId: context.branchId,
          channel: context.channel,
          fulfillmentType: context.fulfillmentType,
          effectiveStatus: availability.effectiveStatus,
          isHidden: availability.isHidden,
          reason: availability.availabilityReason ?? null,
          cause: availability.availabilityCause ?? "BASE_STATUS",
        },
      };
    }),
  );
};
