import type { AuthContext } from "@/core/auth";
import { requirePermission } from "@/core/auth";
import { ValidationError } from "@/core/errors";
import { defaultMenuProtected, menuNotFound } from "./menu.errors";
import { menuRepository } from "./menu.repository";
import {
  buildDiff,
  menuChangeLog,
} from "@/modules/menu/change-log/menu-change-log";

export interface CreateMenuInput {
  name: string;
  description?: string | undefined;
}

export interface CreateMenuScheduleInput {
  scheduleType: "DAILY" | "WEEKLY" | "SPECIFIC_DATE" | "HOLIDAY";
  startTime?: string | null | undefined;
  endTime?: string | null | undefined;
  dayOfWeek?: number | null | undefined;
  startDate?: string | null | undefined;
  endDate?: string | null | undefined;
  holidayName?: string | null | undefined;
  isActive?: boolean | undefined;
}

export interface UpdateMenuInput {
  name?: string | undefined;
  description?: string | null | undefined;
  availableChannels?: string[] | null | undefined;
  availableFulfillmentTypes?: string[] | null | undefined;
  availableBranchIds?: string[] | null | undefined;
  effectiveFrom?: string | null | undefined;
}

const existingMenu = async (tenantId: string, id: string) => {
  const menu = await menuRepository.findById(tenantId, id);
  if (!menu) throw menuNotFound(id);
  return menu;
};

export const menuService = {
  async list(auth: AuthContext) {
    requirePermission(auth, "menu:read");
    return menuRepository.list(auth.tenantId);
  },

  async getById(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:read");
    return existingMenu(auth.tenantId, id);
  },
  async listActive(
    auth: AuthContext,
    channel: "STAFF" | "CUSTOMER_QR",
    fulfillmentType: "DINE_IN" | "TAKEAWAY" | "DELIVERY" | "ONLINE",
  ) {
    requirePermission(auth, "menu:read");
    if (!auth.branchId) return [];
    return menuRepository.listActive(
      auth.tenantId,
      auth.branchId,
      channel,
      fulfillmentType,
    );
  },

  async create(auth: AuthContext, input: CreateMenuInput) {
    requirePermission(auth, "menu:create");
    const created = await menuRepository.create({
      tenantId: auth.tenantId,
      ...input,
    });
    await menuChangeLog.record(
      auth,
      "MENU",
      created.id,
      "CREATED",
      buildDiff(null, created),
    );
    return created;
  },

  async update(auth: AuthContext, id: string, input: UpdateMenuInput) {
    requirePermission(auth, "menu:update");
    const existing = await existingMenu(auth.tenantId, id);
    const { effectiveFrom, ...fields } = input;
    const updated = await menuRepository.update(auth.tenantId, id, {
      ...fields,
      ...(effectiveFrom !== undefined
        ? { effectiveFrom: effectiveFrom ? new Date(effectiveFrom) : null }
        : {}),
    });
    if (!updated) throw menuNotFound(id);
    await menuChangeLog.record(
      auth,
      "MENU",
      id,
      "UPDATED",
      buildDiff(existing, updated),
    );
    return updated;
  },

  async publish(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:publish");
    const existing = await existingMenu(auth.tenantId, id);
    const updated = await menuRepository.update(auth.tenantId, id, {
      status: "PUBLISHED",
    });
    if (!updated) throw menuNotFound(id);
    await menuChangeLog.record(
      auth,
      "MENU",
      id,
      "PUBLISHED",
      buildDiff(existing, updated),
    );
    return updated;
  },

  async unpublish(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:publish");
    const existing = await existingMenu(auth.tenantId, id);
    const updated = await menuRepository.update(auth.tenantId, id, {
      status: "DRAFT",
    });
    if (!updated) throw menuNotFound(id);
    await menuChangeLog.record(
      auth,
      "MENU",
      id,
      "ARCHIVED",
      buildDiff(existing, updated),
    );
    return updated;
  },

  async remove(auth: AuthContext, id: string) {
    requirePermission(auth, "menu:delete");
    const existing = await existingMenu(auth.tenantId, id);
    if (existing.isDefault) throw defaultMenuProtected();
    await menuRepository.remove(auth.tenantId, id);
    await menuChangeLog.record(
      auth,
      "MENU",
      id,
      "DELETED",
      buildDiff(existing, null),
    );
  },
  async listSchedules(auth: AuthContext, menuId: string) {
    await this.getById(auth, menuId);
    return menuRepository.listSchedules(auth.tenantId, menuId);
  },
  async createSchedule(
    auth: AuthContext,
    menuId: string,
    input: CreateMenuScheduleInput,
  ) {
    await this.getById(auth, menuId);
    if (
      (input.scheduleType === "DAILY" || input.scheduleType === "WEEKLY") &&
      (!input.startTime || !input.endTime)
    )
      throw new ValidationError("Time schedules require a start and end time");
    if (input.scheduleType === "WEEKLY" && input.dayOfWeek == null)
      throw new ValidationError("Weekly schedules require a day");
    if (input.scheduleType === "SPECIFIC_DATE" && !input.startDate)
      throw new ValidationError("Date schedules require a start date");
    if (input.scheduleType === "HOLIDAY" && !input.holidayName)
      throw new ValidationError("Holiday schedules require a holiday name");
    return menuRepository.createSchedule({
      tenantId: auth.tenantId,
      menuId,
      scheduleType: input.scheduleType,
      ...(input.startTime !== undefined ? { startTime: input.startTime } : {}),
      ...(input.endTime !== undefined ? { endTime: input.endTime } : {}),
      ...(input.dayOfWeek !== undefined ? { dayOfWeek: input.dayOfWeek } : {}),
      ...(input.startDate !== undefined ? { startDate: input.startDate } : {}),
      ...(input.endDate !== undefined ? { endDate: input.endDate } : {}),
      ...(input.holidayName !== undefined
        ? { holidayName: input.holidayName }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  },
  async deleteSchedule(auth: AuthContext, id: string) {
    return menuRepository.deleteSchedule(auth.tenantId, id);
  },
};
