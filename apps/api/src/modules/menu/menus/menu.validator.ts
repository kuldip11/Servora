import { t } from "elysia";

export const createMenuBody = t.Object({
  name: t.String({ minLength: 1, maxLength: 200 }),
  description: t.Optional(t.String()),
});

export const updateMenuBody = t.Object({
  name: t.Optional(t.String({ minLength: 1, maxLength: 200 })),
  description: t.Optional(t.Union([t.String(), t.Null()])),
  availableChannels: t.Optional(
    t.Union([
      t.Array(t.Union([t.Literal("STAFF"), t.Literal("CUSTOMER_QR")])),
      t.Null(),
    ]),
  ),
  availableFulfillmentTypes: t.Optional(
    t.Union([
      t.Array(
        t.Union([
          t.Literal("DINE_IN"),
          t.Literal("TAKEAWAY"),
          t.Literal("DELIVERY"),
          t.Literal("ONLINE"),
        ]),
      ),
      t.Null(),
    ]),
  ),
  availableBranchIds: t.Optional(
    t.Union([t.Array(t.String({ format: "uuid" })), t.Null()]),
  ),
  effectiveFrom: t.Optional(t.Union([t.String(), t.Null()])),
});

export const activeMenusQuery = t.Object({
  channel: t.Union([t.Literal("STAFF"), t.Literal("CUSTOMER_QR")]),
  fulfillmentType: t.Union([
    t.Literal("DINE_IN"),
    t.Literal("TAKEAWAY"),
    t.Literal("DELIVERY"),
    t.Literal("ONLINE"),
  ]),
});
export const menuScheduleBody = t.Object({
  scheduleType: t.Union([
    t.Literal("DAILY"),
    t.Literal("WEEKLY"),
    t.Literal("SPECIFIC_DATE"),
    t.Literal("HOLIDAY"),
  ]),
  startTime: t.Optional(t.String()),
  endTime: t.Optional(t.String()),
  dayOfWeek: t.Optional(t.Number({ minimum: 0, maximum: 6 })),
  startDate: t.Optional(t.String()),
  endDate: t.Optional(t.String()),
  holidayName: t.Optional(t.String()),
});

export const menuIdParams = t.Object({ id: t.String() });
