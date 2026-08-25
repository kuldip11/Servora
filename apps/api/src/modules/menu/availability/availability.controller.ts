/**
 * Menu availability controller — thin handlers only. Auth comes from
 * `requireAuthPlugin` (applied in `availability.route.ts`); business
 * rules live in `availability.service.ts`.
 */
import type { AuthContext } from '../../../core/auth';
import { successResponse, createdResponse } from '../../../core/response';
import {
  availabilityService,
  type CreateScheduleInput,
  type UpdateScheduleInput,
  type UpsertOverrideInput,
} from './availability.service';

export const availabilityController = {
  async listSchedules(auth: AuthContext, itemId: string) {
    const schedules = await availabilityService.listSchedulesForItem(auth.tenantId, itemId);
    return successResponse(schedules);
  },

  async createSchedule(auth: AuthContext, itemId: string, input: CreateScheduleInput) {
    const schedule = await availabilityService.createSchedule(auth.tenantId, itemId, input);
    return createdResponse(schedule);
  },

  async updateSchedule(auth: AuthContext, scheduleId: string, input: UpdateScheduleInput) {
    const schedule = await availabilityService.updateSchedule(auth.tenantId, scheduleId, input);
    return successResponse(schedule);
  },

  async deleteSchedule(auth: AuthContext, scheduleId: string) {
    await availabilityService.deleteSchedule(auth.tenantId, scheduleId);
    return successResponse(null);
  },

  async getCurrentStatus(auth: AuthContext, itemId: string, timestamp: string | undefined) {
    const branchId = auth.branchId ?? undefined;
    const at = timestamp ? new Date(timestamp) : new Date();
    const result = await availabilityService.getEffectiveStatus(auth.tenantId, itemId, branchId, at);
    return successResponse(result);
  },

  async listHolidays(auth: AuthContext, year: string | undefined, region: string | undefined) {
    const holidays = await availabilityService.listHolidays(
      auth.tenantId,
      year ? parseInt(year, 10) : undefined,
      region,
    );
    return successResponse(holidays);
  },

  async createHoliday(auth: AuthContext, data: { name: string; holidayDate: string; region?: string | undefined }) {
    const holiday = await availabilityService.createHoliday(auth.tenantId, data);
    return successResponse(holiday);
  },

  async updateHoliday(
    auth: AuthContext,
    holidayId: string,
    data: { name?: string | undefined; holidayDate?: string | undefined; region?: string | null | undefined },
  ) {
    const holiday = await availabilityService.updateHoliday(auth.tenantId, holidayId, data);
    return successResponse(holiday);
  },

  async deleteHoliday(auth: AuthContext, holidayId: string) {
    await availabilityService.deleteHoliday(auth.tenantId, holidayId);
    return successResponse(null);
  },

  async getEffectiveItem(auth: AuthContext, itemId: string, branchId: string) {
    const result = await availabilityService.getEffectiveItem(auth.tenantId, itemId, branchId);
    return successResponse(result);
  },

  async upsertOverride(auth: AuthContext, itemId: string, branchId: string, input: UpsertOverrideInput) {
    const override = await availabilityService.upsertOverride(auth.tenantId, itemId, branchId, input);
    return successResponse(override);
  },

  async deleteOverride(auth: AuthContext, itemId: string, branchId: string) {
    await availabilityService.deleteOverride(auth.tenantId, itemId, branchId);
    return successResponse(null);
  },

  async listOverridesForItem(auth: AuthContext, itemId: string) {
    const overrides = await availabilityService.listOverridesForItem(auth.tenantId, itemId);
    return successResponse(overrides);
  },
};
