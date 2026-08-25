import { Elysia } from 'elysia';
import { requireAuthPlugin } from '../../../core/auth';
import { availabilityController } from './availability.controller';
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
} from './availability.validator';

// Mounted at the same base prefix as the legacy `menuRouter` (this
// sub-domain's endpoints don't share a clean common sub-path the way
// `items`/`categories` did — they're scattered across `/items/:id/...`
// and `/holidays`). No path collisions with the legacy router or the
// other menu sub-routers (verified — see docs/NEXT_STEPS.md).
export const menuAvailabilityRouter = new Elysia({ prefix: '/api/menu' })
  .use(requireAuthPlugin())
  // ─── Schedules ─────────────────────────────────────────────────────────────
  .get('/items/:id/schedules', ({ auth, params }) => availabilityController.listSchedules(auth, params.id), {
    params: itemIdParams,
  })
  .post(
    '/items/:id/schedules',
    ({ auth, params, body }) => availabilityController.createSchedule(auth, params.id, body),
    { params: itemIdParams, body: createScheduleBody },
  )
  .put(
    '/items/schedules/:scheduleId',
    ({ auth, params, body }) => availabilityController.updateSchedule(auth, params.scheduleId, body),
    { params: scheduleIdParams, body: updateScheduleBody },
  )
  .delete(
    '/items/schedules/:scheduleId',
    ({ auth, params }) => availabilityController.deleteSchedule(auth, params.scheduleId),
    { params: scheduleIdParams },
  )
  .get(
    '/items/:id/current-status',
    ({ auth, params, query }) => availabilityController.getCurrentStatus(auth, params.id, query.timestamp),
    { params: itemIdParams, query: currentStatusQuery },
  )
  // ─── Branch overrides ──────────────────────────────────────────────────────
  .get(
    '/items/:id/branch/:branchId',
    ({ auth, params }) => availabilityController.getEffectiveItem(auth, params.id, params.branchId),
    { params: itemBranchParams },
  )
  .put(
    '/items/:id/branch/:branchId',
    ({ auth, params, body }) => availabilityController.upsertOverride(auth, params.id, params.branchId, body),
    { params: itemBranchParams, body: upsertOverrideBody },
  )
  .delete(
    '/items/:id/branch/:branchId',
    ({ auth, params }) => availabilityController.deleteOverride(auth, params.id, params.branchId),
    { params: itemBranchParams },
  )
  .get(
    '/items/:id/branches',
    ({ auth, params }) => availabilityController.listOverridesForItem(auth, params.id),
    { params: itemIdParams },
  )
  // ─── Holidays ──────────────────────────────────────────────────────────────
  .get('/holidays', ({ auth, query }) => availabilityController.listHolidays(auth, query.year, query.region), {
    query: holidayQuery,
  })
  .post('/holidays', ({ auth, body }) => availabilityController.createHoliday(auth, body), {
    body: createHolidayBody,
  })
  .put(
    '/holidays/:id',
    ({ auth, params, body }) => availabilityController.updateHoliday(auth, params.id, body),
    { params: holidayIdParams, body: updateHolidayBody },
  )
  .delete('/holidays/:id', ({ auth, params }) => availabilityController.deleteHoliday(auth, params.id), {
    params: holidayIdParams,
  });
