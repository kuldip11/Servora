import type { AuthContext } from "../../../core/auth";
import { requirePermission } from "../../../core/auth";
import { NotFoundError, ValidationError } from "../../../core/errors";
import { membershipRepository } from "./membership.repository";
import { menuChangeLog } from "../change-log/menu-change-log";

export interface MembershipInput {
  menuId: string;
  categoryId: string;
  sortOrder?: number | undefined;
}

export const membershipService = {
  async listForItem(auth: AuthContext, itemId: string) {
    requirePermission(auth, "menu:read");
    return membershipRepository.listForItem(auth.tenantId, itemId);
  },
  async listItems(auth: AuthContext, menuId: string) {
    requirePermission(auth, "menu:read");
    return membershipRepository.listItems(auth.tenantId, menuId);
  },
  async assign(auth: AuthContext, itemId: string, input: MembershipInput) {
    requirePermission(auth, "menu:update");
    const resources = await membershipRepository.findResources(
      auth.tenantId,
      input.menuId,
      itemId,
      input.categoryId,
    );
    if (!resources.menu || !resources.item || !resources.category) {
      throw new NotFoundError("Menu, item, or category not found");
    }
    if (
      resources.category.branchId &&
      resources.item.branchId !== resources.category.branchId
    ) {
      throw new ValidationError("Category branch does not match the menu item branch");
    }
    const membership = await membershipRepository.upsert({
      menuId: input.menuId,
      menuItemId: itemId,
      categoryId: input.categoryId,
      sortOrder: input.sortOrder ?? 0,
    });
    await menuChangeLog.record(auth, "MENU_MEMBERSHIP", membership.id, "UPDATED", {
      menuId: input.menuId, menuItemId: itemId, categoryId: input.categoryId,
      sortOrder: input.sortOrder ?? 0,
    });
    return membership;
  },
  async remove(auth: AuthContext, itemId: string, menuId: string) {
    requirePermission(auth, "menu:update");
    await membershipRepository.remove(auth.tenantId, itemId, menuId);
    await menuChangeLog.record(auth, "MENU_MEMBERSHIP", itemId, "DELETED", { menuId, menuItemId: itemId });
  },
};
