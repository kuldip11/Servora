import type { MenuItemStatus, OrderType } from "@pos/types";

export type AvailabilityChannel = "UNSCOPED" | "STAFF" | "CUSTOMER_QR";
export type AvailabilityFulfillmentType = "UNSCOPED" | OrderType;

export interface AvailabilityReplayItem {
  id: string;
  branchId: string | null;
  status: MenuItemStatus;
  basePrice: string;
  taxRate: string;
  prepTimeMinutes: number | null;
  availabilityReason: string | null;
  manualOverrideStatus: MenuItemStatus | null;
  manualOverrideReason: string | null;
  manualStockCount: number | null;
}

export interface AvailabilityReplayOverride {
  status?: MenuItemStatus | null;
  price?: string | null;
  taxRate?: string | null;
  prepTimeMinutes?: number | null;
  isHidden?: boolean | null;
  availabilityReason?: string | null;
}

export interface AvailabilityReplayEvidence {
  item: AvailabilityReplayItem;
  resolvedStatus: { status: MenuItemStatus; reason: string };
  branchOverride: AvailabilityReplayOverride | null;
  channelOverride: AvailabilityReplayOverride | null;
}

export interface AvailabilityContext {
  channel: AvailabilityChannel;
  fulfillmentType: AvailabilityFulfillmentType;
  asOf: Date;
  historicalReplay?: AvailabilityReplayEvidence | undefined;
}
