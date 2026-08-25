import { relations } from 'drizzle-orm';
import { tenants } from './tenant.schema';
import { branches } from './branch.schema';
import { users, roles, permissions, rolePermissions, globalUserRoles, tenantMemberships, membershipRoles, membershipBranches, refreshTokens } from './auth.schema';
import { restaurantTables } from './restaurant-table.schema';
import {
  menuCategories,
  menuItems,
  menuItemVariants,
  modifierGroups,
  modifierOptions,
  menuItemModifierGroups,
  menuTags,
  menuItemTags,
  menuAllergens,
  menuItemAllergens,
  menuItemImages,
  menuItemSchedules,
  holidays,
  menuItemBranchOverrides,
  menuTemplates,
  menuTemplateItems,
} from './menu.schema';
import { recipes } from './menu-recipe.schema';
import { inventoryItems, inventoryTransactions, orderInventoryDeductions } from './inventory.schema';
import { orders } from './order.schema';
import { kitchenTickets, orderItems, orderItemModifiers, orderStatusHistory } from './kitchen.schema';
import { bills, payments, paymentRefunds } from './billing.schema';

// ─── Relations ────────────────────────────────────────────────────────────────

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  creator: one(users, { fields: [tenants.createdBy], references: [users.id] }),
  branches: many(branches),
  memberships: many(tenantMemberships),
  menuCategories: many(menuCategories),
  menuItems: many(menuItems),
  orders: many(orders),
  inventoryItems: many(inventoryItems),
}));

export const usersRelations = relations(users, ({ many }) => ({
  globalUserRoles: many(globalUserRoles),
  memberships: many(tenantMemberships),
  refreshTokens: many(refreshTokens),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [orders.branchId], references: [branches.id] }),
  table: one(restaurantTables, { fields: [orders.tableId], references: [restaurantTables.id] }),
  createdByUser: one(users, { fields: [orders.createdBy], references: [users.id] }),
  items: many(orderItems),
  kitchenTickets: many(kitchenTickets),
  statusHistory: many(orderStatusHistory),
  bill: one(bills, { fields: [orders.id], references: [bills.orderId] }),
  payments: many(payments),
}));

export const kitchenTicketsRelations = relations(kitchenTickets, ({ one, many }) => ({
  order: one(orders, { fields: [kitchenTickets.orderId], references: [orders.id] }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  kitchenTicket: one(kitchenTickets, { fields: [orderItems.kitchenTicketId], references: [kitchenTickets.id] }),
  menuItem: one(menuItems, { fields: [orderItems.menuItemId], references: [menuItems.id] }),
  modifiers: many(orderItemModifiers),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  order: one(orders, { fields: [bills.orderId], references: [orders.id] }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  bill: one(bills, { fields: [payments.billId], references: [bills.id] }),
  refunds: many(paymentRefunds),
}));

export const paymentRefundsRelations = relations(paymentRefunds, ({ one }) => ({
  payment: one(payments, { fields: [paymentRefunds.paymentId], references: [payments.id] }),
  processedByUser: one(users, { fields: [paymentRefunds.processedBy], references: [users.id] }),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menuItems.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [menuItems.branchId], references: [branches.id] }),
  category: one(menuCategories, { fields: [menuItems.categoryId], references: [menuCategories.id] }),
  variants: many(menuItemVariants),
  modifierGroupLinks: many(menuItemModifierGroups),
  tagLinks: many(menuItemTags),
  allergenLinks: many(menuItemAllergens),
  images: many(menuItemImages),
  recipeLinks: many(recipes),
  schedules: many(menuItemSchedules),
  branchOverrideLinks: many(menuItemBranchOverrides),
}));

export const menuCategoriesRelations = relations(menuCategories, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menuCategories.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [menuCategories.branchId], references: [branches.id] }),
  menuItems: many(menuItems),
}));

export const menuItemVariantsRelations = relations(menuItemVariants, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemVariants.menuItemId], references: [menuItems.id] }),
}));

export const modifierGroupsRelations = relations(modifierGroups, ({ many }) => ({
  options: many(modifierOptions),
  itemLinks: many(menuItemModifierGroups),
}));

export const modifierOptionsRelations = relations(modifierOptions, ({ one }) => ({
  group: one(modifierGroups, { fields: [modifierOptions.modifierGroupId], references: [modifierGroups.id] }),
}));

export const menuItemModifierGroupsRelations = relations(menuItemModifierGroups, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemModifierGroups.menuItemId], references: [menuItems.id] }),
  group: one(modifierGroups, { fields: [menuItemModifierGroups.modifierGroupId], references: [modifierGroups.id] }),
}));

export const menuTagsRelations = relations(menuTags, ({ many }) => ({
  itemLinks: many(menuItemTags),
}));

export const menuItemTagsRelations = relations(menuItemTags, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemTags.menuItemId], references: [menuItems.id] }),
  tag: one(menuTags, { fields: [menuItemTags.tagId], references: [menuTags.id] }),
}));

export const menuAllergensRelations = relations(menuAllergens, ({ many }) => ({
  itemLinks: many(menuItemAllergens),
}));

export const menuItemAllergensRelations = relations(menuItemAllergens, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemAllergens.menuItemId], references: [menuItems.id] }),
  allergen: one(menuAllergens, { fields: [menuItemAllergens.allergenId], references: [menuAllergens.id] }),
}));

export const menuItemImagesRelations = relations(menuItemImages, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemImages.menuItemId], references: [menuItems.id] }),
}));

export const globalUserRolesRelations = relations(globalUserRoles, ({ one }) => ({
  user: one(users, { fields: [globalUserRoles.userId], references: [users.id] }),
  role: one(roles, { fields: [globalUserRoles.roleId], references: [roles.id] }),
}));

export const tenantMembershipsRelations = relations(
  tenantMemberships,
  ({ one, many }) => ({
    user: one(users, {
      fields: [tenantMemberships.userId],
      references: [users.id],
    }),
    tenant: one(tenants, {
      fields: [tenantMemberships.tenantId],
      references: [tenants.id],
    }),
    roles: many(membershipRoles),
    branches: many(membershipBranches),
  }),
);

export const membershipRolesRelations = relations(
  membershipRoles,
  ({ one }) => ({
    membership: one(tenantMemberships, {
      fields: [membershipRoles.membershipId],
      references: [tenantMemberships.id],
    }),
    role: one(roles, {
      fields: [membershipRoles.roleId],
      references: [roles.id],
    }),
  }),
);

export const membershipBranchesRelations = relations(
  membershipBranches,
  ({ one }) => ({
    membership: one(tenantMemberships, {
      fields: [membershipBranches.membershipId],
      references: [tenantMemberships.id],
    }),
    branch: one(branches, {
      fields: [membershipBranches.branchId],
      references: [branches.id],
    }),
  }),
);

export const rolesRelations = relations(roles, ({ many }) => ({
  globalUserRoles: many(globalUserRoles),
  membershipRoles: many(membershipRoles),
  rolePermissions: many(rolePermissions),
}));

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(roles, { fields: [rolePermissions.roleId], references: [roles.id] }),
  permission: one(permissions, { fields: [rolePermissions.permissionId], references: [permissions.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
  membership: one(tenantMemberships, { fields: [refreshTokens.membershipId], references: [tenantMemberships.id] }),
}));

export const restaurantTablesRelations = relations(restaurantTables, ({ one }) => ({
  tenant: one(tenants, { fields: [restaurantTables.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [restaurantTables.branchId], references: [branches.id] }),
}));

export const inventoryItemsRelations = relations(inventoryItems, ({ one, many }) => ({
  tenant: one(tenants, { fields: [inventoryItems.tenantId], references: [tenants.id] }),
  branch: one(branches, { fields: [inventoryItems.branchId], references: [branches.id] }),
  transactions: many(inventoryTransactions),
  recipeLinks: many(recipes),
}));

export const recipesRelations = relations(recipes, ({ one }) => ({
  menuItem: one(menuItems, { fields: [recipes.menuItemId], references: [menuItems.id] }),
  inventoryItem: one(inventoryItems, { fields: [recipes.inventoryItemId], references: [inventoryItems.id] }),
}));

export const orderInventoryDeductionsRelations = relations(orderInventoryDeductions, ({ one }) => ({
  order: one(orders, { fields: [orderInventoryDeductions.orderId], references: [orders.id] }),
  menuItem: one(menuItems, { fields: [orderInventoryDeductions.menuItemId], references: [menuItems.id] }),
  inventoryItem: one(inventoryItems, { fields: [orderInventoryDeductions.inventoryItemId], references: [inventoryItems.id] }),
}));

export const inventoryTransactionsRelations = relations(inventoryTransactions, ({ one }) => ({
  inventoryItem: one(inventoryItems, { fields: [inventoryTransactions.inventoryItemId], references: [inventoryItems.id] }),
  performedByUser: one(users, { fields: [inventoryTransactions.performedBy], references: [users.id] }),
}));

export const orderStatusHistoryRelations = relations(orderStatusHistory, ({ one }) => ({
  order: one(orders, { fields: [orderStatusHistory.orderId], references: [orders.id] }),
  changedByUser: one(users, { fields: [orderStatusHistory.changedBy], references: [users.id] }),
}));

export const orderItemModifiersRelations = relations(orderItemModifiers, ({ one }) => ({
  orderItem: one(orderItems, { fields: [orderItemModifiers.orderItemId], references: [orderItems.id] }),
}));

export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, { fields: [branches.tenantId], references: [tenants.id] }),
}));

export const menuItemSchedulesRelations = relations(menuItemSchedules, ({ one }) => ({
  menuItem: one(menuItems, { fields: [menuItemSchedules.menuItemId], references: [menuItems.id] }),
  branch: one(branches, { fields: [menuItemSchedules.branchId], references: [branches.id] }),
  tenant: one(tenants, { fields: [menuItemSchedules.tenantId], references: [tenants.id] }),
}));

export const holidaysRelations = relations(holidays, ({ one }) => ({
  tenant: one(tenants, { fields: [holidays.tenantId], references: [tenants.id] }),
}));

export const menuItemBranchOverridesRelations = relations(menuItemBranchOverrides, ({ one }) => ({
  tenant: one(tenants, { fields: [menuItemBranchOverrides.tenantId], references: [tenants.id] }),
  menuItem: one(menuItems, { fields: [menuItemBranchOverrides.menuItemId], references: [menuItems.id] }),
  branch: one(branches, { fields: [menuItemBranchOverrides.branchId], references: [branches.id] }),
}));

export const menuTemplatesRelations = relations(menuTemplates, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menuTemplates.tenantId], references: [tenants.id] }),
  items: many(menuTemplateItems),
}));

export const menuTemplateItemsRelations = relations(menuTemplateItems, ({ one }) => ({
  template: one(menuTemplates, { fields: [menuTemplateItems.templateId], references: [menuTemplates.id] }),
}));
