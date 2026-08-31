import { t } from "elysia";

const ITEM_STATUS = t.Union([
  t.Literal("ACTIVE"),
  t.Literal("OUT_OF_STOCK"),
  t.Literal("HIDDEN"),
  t.Literal("SEASONAL"),
  t.Literal("DISCONTINUED"),
]);

const SCHEDULE_TYPE = t.Union([
  t.Literal("DAILY"),
  t.Literal("WEEKLY"),
  t.Literal("SPECIFIC_DATE"),
  t.Literal("HOLIDAY"),
]);

export const createScheduleBody = t.Object({
  scheduleType: SCHEDULE_TYPE,
  startTime: t.Optional(t.String()),
  endTime: t.Optional(t.String()),
  dayOfWeek: t.Optional(t.Number({ minimum: 0, maximum: 6 })),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  holidayName: t.Optional(t.String()),
  statusDuringPeriod: t.Optional(ITEM_STATUS),
  branchId: t.Optional(t.String()),
});

export const updateScheduleBody = t.Object({
  startTime: t.Optional(t.String()),
  endTime: t.Optional(t.String()),
  dayOfWeek: t.Optional(t.Number({ minimum: 0, maximum: 6 })),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  holidayName: t.Optional(t.String()),
  statusDuringPeriod: t.Optional(ITEM_STATUS),
  branchId: t.Optional(t.Union([t.String(), t.Null()])),
  isActive: t.Optional(t.Boolean()),
});

export const itemIdParams = t.Object({ id: t.String() });

export const manualOverrideBody = t.Object({
  status: ITEM_STATUS,
  reason: t.String({ minLength: 1, maxLength: 500 }),
});
export const scheduleIdParams = t.Object({ scheduleId: t.String() });
export const itemBranchParams = t.Object({
  id: t.String(),
  branchId: t.String(),
});

export const currentStatusQuery = t.Object({
  timestamp: t.Optional(t.String()),
});

export const holidayQuery = t.Object({
  year: t.Optional(t.String()),
  region: t.Optional(t.String()),
});

export const createHolidayBody = t.Object({
  name: t.String(),
  holidayDate: t.String(),
  region: t.Optional(t.String()),
});

export const updateHolidayBody = t.Object({
  name: t.Optional(t.String()),
  holidayDate: t.Optional(t.String()),
  region: t.Optional(t.Union([t.String(), t.Null()])),
});

export const holidayIdParams = t.Object({ id: t.String() });

export const upsertOverrideBody = t.Object({
  price: t.Optional(t.Union([t.Number(), t.Null()])),
  taxRate: t.Optional(t.Union([t.Number(), t.Null()])),
  prepTimeMinutes: t.Optional(t.Union([t.Number(), t.Null()])),
  status: t.Optional(t.Union([ITEM_STATUS, t.Null()])),
  isHidden: t.Optional(t.Boolean()),
  availabilityReason: t.Optional(t.Union([t.String(), t.Null()])),
});
export const channelOverrideBody = t.Object({
  channel: t.Union([t.Literal("STAFF"), t.Literal("CUSTOMER_QR")]),
  fulfillmentType: t.Optional(t.Union([t.Literal("DINE_IN"), t.Literal("TAKEAWAY"), t.Literal("DELIVERY"), t.Literal("ONLINE"), t.Null()])),
  status: t.Optional(t.Union([ITEM_STATUS, t.Null()])),
  isHidden: t.Optional(t.Boolean()),
  availabilityReason: t.Optional(t.Union([t.String(), t.Null()])),
});
export const variantOverrideBody = t.Object({ status: t.Union([ITEM_STATUS, t.Null()]), reason: t.Optional(t.Union([t.String(), t.Null()])) });

export const stockCountBody = t.Object({
  count: t.Union([t.Integer({ minimum: 0 }), t.Null()]),
  variantId: t.Optional(t.Union([t.String({ format: "uuid" }), t.Null()])),
});
