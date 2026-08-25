import { apiClient } from "../../../shared/lib/api-client";
import type {
  MenuItemSchedule,
  MenuItemScheduleType,
  MenuItemStatus,
} from "@pos/types";

export interface ScheduleFormInput {
  scheduleType: MenuItemScheduleType;
  statusDuringPeriod: MenuItemStatus;
  startTime?: string;
  endTime?: string;
  dayOfWeek?: number;
  startDate?: string;
  endDate?: string;
  holidayName?: string;
}

export const menuSchedulesService = {
  async list(itemId: string): Promise<MenuItemSchedule[]> {
    const res = await apiClient.get(`/menu/items/${itemId}/schedules`);
    return res.data.data;
  },

  async add(
    itemId: string,
    input: ScheduleFormInput,
  ): Promise<MenuItemSchedule> {
    const payload: Record<string, unknown> = {
      scheduleType: input.scheduleType,
      statusDuringPeriod: input.statusDuringPeriod,
    };
    if (input.scheduleType === "DAILY" || input.scheduleType === "WEEKLY") {
      payload["startTime"] = input.startTime;
      payload["endTime"] = input.endTime;
    }
    if (input.scheduleType === "WEEKLY") payload["dayOfWeek"] = input.dayOfWeek;
    if (input.scheduleType === "SPECIFIC_DATE") {
      payload["startDate"] = input.startDate;
      payload["endDate"] = input.endDate || input.startDate;
    }
    if (input.scheduleType === "HOLIDAY")
      payload["holidayName"] = input.holidayName;
    const res = await apiClient.post(
      `/menu/items/${itemId}/schedules`,
      payload,
    );
    return res.data.data;
  },

  async remove(scheduleId: string): Promise<void> {
    await apiClient.delete(`/menu/items/schedules/${scheduleId}`);
  },
};
