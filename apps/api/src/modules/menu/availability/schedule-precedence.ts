import type { MenuItemScheduleType } from "@pos/types";

export const SCHEDULE_TYPE_PRIORITY: Record<MenuItemScheduleType, number> = {
  HOLIDAY: 3,
  SPECIFIC_DATE: 2,
  WEEKLY: 1,
  DAILY: 0,
};

function pad(value: number) { return String(value).padStart(2, "0"); }
export function scheduleDate(value: Date) { return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`; }
function scheduleTime(value: Date) { return `${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`; }
function timeInRange(now: string, start: string, end: string) { return start <= end ? now >= start && now <= end : now >= start || now <= end; }

export interface ScheduleWindow {
  scheduleType: MenuItemScheduleType;
  startTime: string | null;
  endTime: string | null;
  dayOfWeek: number | null;
  startDate: string | null;
  endDate: string | null;
  holidayName: string | null;
  isActive: boolean;
}

export async function scheduleMatches(
  schedule: ScheduleWindow,
  asOf: Date,
  holidayMatches: (name: string, date: string) => Promise<boolean>,
) {
  if (!schedule.isActive) return false;
  if (schedule.scheduleType === "DAILY") return !!schedule.startTime && !!schedule.endTime && timeInRange(scheduleTime(asOf), schedule.startTime, schedule.endTime);
  if (schedule.scheduleType === "WEEKLY") return schedule.dayOfWeek === asOf.getDay() && !!schedule.startTime && !!schedule.endTime && timeInRange(scheduleTime(asOf), schedule.startTime, schedule.endTime);
  if (schedule.scheduleType === "SPECIFIC_DATE") {
    if (!schedule.startDate) return false;
    const today = scheduleDate(asOf);
    return today >= schedule.startDate && today <= (schedule.endDate ?? schedule.startDate);
  }
  return !!schedule.holidayName && holidayMatches(schedule.holidayName, scheduleDate(asOf));
}

export async function highestPriorityActiveSchedule<T extends ScheduleWindow>(
  schedules: T[], asOf: Date, holidayMatches: (name: string, date: string) => Promise<boolean>,
) {
  let best: T | null = null;
  for (const schedule of schedules) {
    if (await scheduleMatches(schedule, asOf, holidayMatches) && (!best || SCHEDULE_TYPE_PRIORITY[schedule.scheduleType] > SCHEDULE_TYPE_PRIORITY[best.scheduleType])) best = schedule;
  }
  return best;
}
