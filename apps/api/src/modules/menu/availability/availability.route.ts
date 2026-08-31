import { Elysia } from "elysia";
import { requireAuthPlugin } from "../../../core/auth";
import { availabilityController } from "./availability.controller";
import {
  createScheduleBody,
  updateScheduleBody,
  itemIdParams,
  scheduleIdParams,
  itemBranchParams,
  currentStatusQuery,
  holidayQuery,
  createHolidayBody,
  updateHolidayBody,
  holidayIdParams,
  upsertOverrideBody,
  manualOverrideBody,
  channelOverrideBody,
  variantOverrideBody,
  stockCountBody,
} from "./availability.validator";

export const menuAvailabilityRouter = new Elysia({ prefix: "/api/menu" })
  .use(requireAuthPlugin())
  .get("/availability/dashboard", ({ auth, query }) =>
    availabilityController.dashboard(auth, query),
  )
  .put(
    "/variants/:id/availability",
    ({ auth, params, body }) =>
      availabilityController.setVariantOverride(auth, params.id, body),
    { params: itemIdParams, body: variantOverrideBody },
  )
  .post(
    "/items/:id/stock-count",
    ({ auth, params, body }) =>
      availabilityController.setStockCount(auth, params.id, body),
    { params: itemIdParams, body: stockCountBody },
  )

  .get(
    "/items/:id/schedules",
    ({ auth, params }) => availabilityController.listSchedules(auth, params.id),
    {
      params: itemIdParams,
    },
  )
  .post(
    "/items/:id/schedules",
    ({ auth, params, body }) =>
      availabilityController.createSchedule(auth, params.id, body),
    { params: itemIdParams, body: createScheduleBody },
  )
  .put(
    "/items/schedules/:scheduleId",
    ({ auth, params, body }) =>
      availabilityController.updateSchedule(auth, params.scheduleId, body),
    { params: scheduleIdParams, body: updateScheduleBody },
  )
  .delete(
    "/items/schedules/:scheduleId",
    ({ auth, params }) =>
      availabilityController.deleteSchedule(auth, params.scheduleId),
    { params: scheduleIdParams },
  )
  .get(
    "/items/:id/current-status",
    ({ auth, params, query }) =>
      availabilityController.getCurrentStatus(auth, params.id, query.timestamp),
    { params: itemIdParams, query: currentStatusQuery },
  )

  .put(
    "/items/:id/manual-override",
    ({ auth, params, body }) =>
      availabilityController.setManualOverride(auth, params.id, body),
    { params: itemIdParams, body: manualOverrideBody },
  )
  .delete(
    "/items/:id/manual-override",
    ({ auth, params }) =>
      availabilityController.clearManualOverride(auth, params.id),
    { params: itemIdParams },
  )

  .get(
    "/items/:id/branch/:branchId",
    ({ auth, params }) =>
      availabilityController.getEffectiveItem(auth, params.id, params.branchId),
    { params: itemBranchParams },
  )
  .put(
    "/items/:id/branch/:branchId",
    ({ auth, params, body }) =>
      availabilityController.upsertOverride(
        auth,
        params.id,
        params.branchId,
        body,
      ),
    { params: itemBranchParams, body: upsertOverrideBody },
  )
  .delete(
    "/items/:id/branch/:branchId",
    ({ auth, params }) =>
      availabilityController.deleteOverride(auth, params.id, params.branchId),
    { params: itemBranchParams },
  )
  .get(
    "/items/:id/branches",
    ({ auth, params }) =>
      availabilityController.listOverridesForItem(auth, params.id),
    { params: itemIdParams },
  )
  .get(
    "/items/:id/channel-overrides",
    ({ auth, params }) =>
      availabilityController.listChannelOverrides(auth, params.id),
    { params: itemIdParams },
  )
  .put(
    "/items/:id/channel-overrides",
    ({ auth, params, body }) =>
      availabilityController.upsertChannelOverride(auth, params.id, body),
    { params: itemIdParams, body: channelOverrideBody },
  )
  .delete(
    "/items/channel-overrides/:id",
    ({ auth, params }) =>
      availabilityController.deleteChannelOverride(auth, params.id),
    { params: itemIdParams },
  )

  .get(
    "/holidays",
    ({ auth, query }) =>
      availabilityController.listHolidays(auth, query.year, query.region),
    {
      query: holidayQuery,
    },
  )
  .post(
    "/holidays",
    ({ auth, body }) => availabilityController.createHoliday(auth, body),
    {
      body: createHolidayBody,
    },
  )
  .put(
    "/holidays/:id",
    ({ auth, params, body }) =>
      availabilityController.updateHoliday(auth, params.id, body),
    { params: holidayIdParams, body: updateHolidayBody },
  )
  .delete(
    "/holidays/:id",
    ({ auth, params }) => availabilityController.deleteHoliday(auth, params.id),
    {
      params: holidayIdParams,
    },
  );
