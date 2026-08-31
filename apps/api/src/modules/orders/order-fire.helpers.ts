import type { OrderType } from "@pos/types";
import { ValidationError } from "../../core/errors";
import { tenantRepository } from "../tenants/tenant.repository";
import { availabilityService } from "../menu/availability/availability.service";
import { menuResolver } from "../menu/menus/menu-resolver.service";
import type { ComboOrderSelection } from "../menu/combos/combo-order.service";
import type { OrderItemInput, PricableMenuItem } from "./pricing/pricing-pipeline";

export function requestedCourseNumbers(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  return [
    ...items.map((item) => item.courseNumber),
    ...combos.map((combo) => combo.courseNumber),
  ].filter((value): value is number => value !== undefined);
}

export async function assertCourseSequencingAllowed(
  tenantId: string,
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  if (!requestedCourseNumbers(items, combos).length) return;
  const tenant = await tenantRepository.findById(tenantId);
  if (!tenant?.courseSequencingEnabled) {
    throw new ValidationError("Course sequencing is not enabled for this tenant");
  }
}

export function assertInitialCourseSequence(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  const numbers = requestedCourseNumbers(items, combos);
  if (!numbers.length) return;
  const requestedLineCount = items.length + combos.length;
  if (numbers.length !== requestedLineCount) {
    throw new ValidationError(
      "Every line must have a course when course sequencing is used",
    );
  }
  const unique = [...new Set(numbers)].sort((a, b) => a - b);
  if (unique[0] !== 1 || unique.some((value, index) => value !== index + 1)) {
    throw new ValidationError("Courses must start at 1 and be contiguous");
  }
}

export function singleCourseNumber(
  items: OrderItemInput[],
  combos: ComboOrderSelection[],
) {
  const numbers = requestedCourseNumbers(items, combos);
  const unique = [...new Set(numbers)];
  if (unique.length > 1) {
    throw new ValidationError("A single fire action can contain only one course");
  }
  return unique[0];
}

export async function assertItemsInSchedule(
  tenantId: string,
  branchId: string,
  itemMap: Map<string, PricableMenuItem>,
  requestedItemIds: string[],
  orderType: OrderType,
  asOf: Date,
): Promise<void> {
  const uniqueIds = Array.from(new Set(requestedItemIds));
  const activeMenuItemIds = await menuResolver.getActiveItemIds(
    tenantId,
    branchId,
    "STAFF",
    orderType,
    asOf,
  );
  for (const id of uniqueIds) {
    const menuItem = itemMap.get(id);
    if (!menuItem) continue;
    if (!activeMenuItemIds.has(id)) {
      throw new ValidationError(
        `${menuItem.name} isn't on an active menu for this order`,
      );
    }
    const effective = await availabilityService.getEffectiveItem(
      tenantId,
      id,
      branchId,
      { channel: "STAFF", fulfillmentType: orderType, asOf },
    );
    if (effective.isHidden) {
      throw new ValidationError(
        `${menuItem.name} isn't available at this branch`,
      );
    }
    if (effective.effectiveStatus !== "ACTIVE") {
      const reason = effective.availabilityReason ?? "currently unavailable";
      throw new ValidationError(
        `${menuItem.name} isn't available right now (${reason})`,
      );
    }
  }
}
