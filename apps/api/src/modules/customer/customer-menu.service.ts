import { db } from "../../db";
import { availabilityService } from "../menu/availability/availability.service";
import { menuResolver } from "../menu/menus/menu-resolver.service";
import { customerRepository } from "./customer.repository";
import { customerSessionService } from "./customer-session.service";

export const customerMenuService = {
  async getMenu(token: string) {
    const session = await customerSessionService.getSession(token);
    const activeMenus = await menuResolver.getActiveMenus(
      session.tenantId, session.branchId, "CUSTOMER_QR", session.mode, new Date(),
    );
    const activeItemIds = new Set(activeMenus.flatMap((menu) => menu.memberships.map((membership) => membership.menuItemId)));
    const menu = await customerRepository.listMenu(
      session.tenantId,
      session.branchId,
    );
    const comboRows = await db.query.combos.findMany({
      where: (table, { and, eq }) =>
        and(eq(table.tenantId, session.tenantId), eq(table.status, "ACTIVE")),
      with: { slots: { with: { options: true } } },
    });
    const asOf = new Date();
    const effectiveItems = await Promise.all(
      menu.items.map(async (item) => {
        const effective = await availabilityService.getEffectiveItem(
          session.tenantId,
          item.id,
          session.branchId,
          {
            channel: "CUSTOMER_QR",
            fulfillmentType: session.mode,
            asOf,
          },
        );
        if (effective.effectiveStatus !== "ACTIVE" || effective.isHidden)
          return null;
        return {
          ...item,
          basePrice: effective.effectivePrice,
          taxRate: effective.effectiveTaxRate,
          prepTimeMinutes: effective.effectivePrepTimeMinutes,
        };
      }),
    );
    return {
      restaurant: {
        id: session.branch.id,
        name: session.branch.name,
        address: session.branch.address,
      },
      mode: session.mode,
      table: session.table
        ? {
            id: session.table.id,
            name: session.table.name,
            section: session.table.section,
          }
        : null,
      categories: menu.categories,
      menus: activeMenus,
      combos: comboRows
        .map((combo) => ({
          ...combo,
          slots: combo.slots.map((slot) => ({
            ...slot,
            options: slot.options.filter((option) =>
              activeItemIds.has(option.menuItemId),
            ),
          })),
        }))
        .filter((combo) =>
          combo.slots.every(
            (slot) => slot.options.length >= slot.minSelections,
          ),
        ),
      items: effectiveItems.filter(
        (item): item is NonNullable<typeof item> => item !== null && activeItemIds.has(item.id),
      ),
    };
  }
};
