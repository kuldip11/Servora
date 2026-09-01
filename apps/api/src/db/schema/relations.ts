import { relations } from "drizzle-orm";
import { tenants } from "./tenant.schema";
import { organizations, organizationMemberships } from "./organization.schema";
import { branches } from "./branch.schema";
import {
  users,
  roles,
  permissions,
  rolePermissions,
  globalUserRoles,
  tenantMemberships,
  membershipRoles,
  membershipBranches,
  refreshTokens,
  userSessions,
} from "./auth.schema";
import { restaurantTables } from "./restaurant-table.schema";
import {
  menuCategories,
  menus,
  menuMemberships,
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
  menuSchedules,
  holidays,
  menuItemBranchOverrides,
  menuItemChannelOverrides,
  menuTemplates,
  menuTemplateItems,
  menuChangeEvents,
  combos,
  comboSlots,
  comboSlotOptions,
  modifierOptionVariantPrices,
  organizationMenuItems,
} from "./menu.schema";
import {
  recipes,
  subRecipes,
  subRecipeIngredients,
} from "./menu-recipe.schema";
import {
  inventoryItems,
  inventoryTransactions,
  orderInventoryDeductions,
  wasteReasons,
} from "./inventory.schema";
import { orders } from "./order.schema";
import {
  kitchenTickets,
  orderCourses,
  orderItems,
  orderItemModifiers,
  orderStatusHistory,
  kitchenStations,
  cancellationReasons,
  orderItemSeatShares,
} from "./kitchen.schema";
import {
  bills,
  billOrderItems,
  payments,
  paymentRefunds,
} from "./billing.schema";
import { customerSessions } from "./customer-session.schema";
import { customerLoyaltyTiers, customers } from "./loyalty.schema";
import { customerGroups } from "./customer-group.schema";

export const organizationsRelations = relations(
  organizations,
  ({ one, many }) => ({
    creator: one(users, {
      fields: [organizations.createdBy],
      references: [users.id],
    }),
    memberships: many(organizationMemberships),
    tenants: many(tenants),
    menus: many(menus),
  }),
);

export const organizationMembershipsRelations = relations(
  organizationMemberships,
  ({ one }) => ({
    user: one(users, {
      fields: [organizationMemberships.userId],
      references: [users.id],
    }),
    organization: one(organizations, {
      fields: [organizationMemberships.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const tenantsRelations = relations(tenants, ({ one, many }) => ({
  creator: one(users, { fields: [tenants.createdBy], references: [users.id] }),
  organization: one(organizations, {
    fields: [tenants.organizationId],
    references: [organizations.id],
  }),
  branches: many(branches),
  memberships: many(tenantMemberships),
  menuCategories: many(menuCategories),
  menuItems: many(menuItems),
  menus: many(menus),
  orders: many(orders),
  inventoryItems: many(inventoryItems),
  loyaltyTiers: many(customerLoyaltyTiers),
  customers: many(customers),
  customerGroups: many(customerGroups),
}));

export const usersRelations = relations(users, ({ many }) => ({
  globalUserRoles: many(globalUserRoles),
  memberships: many(tenantMemberships),
  refreshTokens: many(refreshTokens),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  tenant: one(tenants, { fields: [orders.tenantId], references: [tenants.id] }),
  branch: one(branches, {
    fields: [orders.branchId],
    references: [branches.id],
  }),
  table: one(restaurantTables, {
    fields: [orders.tableId],
    references: [restaurantTables.id],
  }),
  createdByUser: one(users, {
    fields: [orders.createdBy],
    references: [users.id],
  }),
  customerSession: one(customerSessions, {
    fields: [orders.customerSessionId],
    references: [customerSessions.id],
  }),
  customer: one(customers, {
    fields: [orders.customerId],
    references: [customers.id],
  }),
  customerGroup: one(customerGroups, {
    fields: [orders.customerGroupId],
    references: [customerGroups.id],
  }),
  items: many(orderItems),
  kitchenTickets: many(kitchenTickets),
  courses: many(orderCourses),
  statusHistory: many(orderStatusHistory),
  bills: many(bills),
  payments: many(payments),
  mergedInto: one(orders, {
    fields: [orders.mergedIntoOrderId],
    references: [orders.id],
    relationName: "orderMerge",
  }),
  mergedOrders: many(orders, { relationName: "orderMerge" }),
}));

export const customerSessionsRelations = relations(
  customerSessions,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [customerSessions.tenantId],
      references: [tenants.id],
    }),
    branch: one(branches, {
      fields: [customerSessions.branchId],
      references: [branches.id],
    }),
    table: one(restaurantTables, {
      fields: [customerSessions.tableId],
      references: [restaurantTables.id],
    }),
    orders: many(orders),
  }),
);

export const customerLoyaltyTiersRelations = relations(
  customerLoyaltyTiers,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [customerLoyaltyTiers.tenantId],
      references: [tenants.id],
    }),
    organization: one(organizations, {
      fields: [customerLoyaltyTiers.organizationId],
      references: [organizations.id],
    }),
    customers: many(customers),
  }),
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [customers.tenantId],
    references: [tenants.id],
  }),
  loyaltyTier: one(customerLoyaltyTiers, {
    fields: [customers.loyaltyTierId],
    references: [customerLoyaltyTiers.id],
  }),
  orders: many(orders),
}));

export const orderCoursesRelations = relations(
  orderCourses,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [orderCourses.orderId],
      references: [orders.id],
    }),
    tickets: many(kitchenTickets),
  }),
);

export const kitchenTicketsRelations = relations(
  kitchenTickets,
  ({ one, many }) => ({
    order: one(orders, {
      fields: [kitchenTickets.orderId],
      references: [orders.id],
    }),
    course: one(orderCourses, {
      fields: [kitchenTickets.courseId],
      references: [orderCourses.id],
    }),
    items: many(orderItems),
  }),
);

export const orderItemsRelations = relations(orderItems, ({ one, many }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  kitchenTicket: one(kitchenTickets, {
    fields: [orderItems.kitchenTicketId],
    references: [kitchenTickets.id],
  }),
  menuItem: one(menuItems, {
    fields: [orderItems.menuItemId],
    references: [menuItems.id],
  }),
  station: one(kitchenStations, {
    fields: [orderItems.stationId],
    references: [kitchenStations.id],
  }),
  menuChangeEvent: one(menuChangeEvents, {
    fields: [orderItems.menuChangeEventId],
    references: [menuChangeEvents.id],
  }),
  voidedReasonLookup: one(cancellationReasons, {
    fields: [orderItems.voidedReasonId],
    references: [cancellationReasons.id],
    relationName: "voidedReasonLookup",
  }),
  compedReasonLookup: one(cancellationReasons, {
    fields: [orderItems.compedReasonId],
    references: [cancellationReasons.id],
    relationName: "compedReasonLookup",
  }),
  modifiers: many(orderItemModifiers),
  seatShares: many(orderItemSeatShares),
  billAssignments: many(billOrderItems),
  comboSlotOption: one(comboSlotOptions, {
    fields: [orderItems.comboSlotOptionId],
    references: [comboSlotOptions.id],
  }),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  order: one(orders, { fields: [bills.orderId], references: [orders.id] }),
  payments: many(payments),
  itemAssignments: many(billOrderItems),
}));

export const billOrderItemsRelations = relations(billOrderItems, ({ one }) => ({
  bill: one(bills, { fields: [billOrderItems.billId], references: [bills.id] }),
  orderItem: one(orderItems, {
    fields: [billOrderItems.orderItemId],
    references: [orderItems.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
  bill: one(bills, { fields: [payments.billId], references: [bills.id] }),
  refunds: many(paymentRefunds),
}));

export const paymentRefundsRelations = relations(paymentRefunds, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentRefunds.paymentId],
    references: [payments.id],
  }),
  processedByUser: one(users, {
    fields: [paymentRefunds.processedBy],
    references: [users.id],
  }),
}));

export const menuItemsRelations = relations(menuItems, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [menuItems.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [menuItems.branchId],
    references: [branches.id],
  }),
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
  variants: many(menuItemVariants),
  modifierGroupLinks: many(menuItemModifierGroups),
  tagLinks: many(menuItemTags),
  allergenLinks: many(menuItemAllergens),
  images: many(menuItemImages),
  recipeLinks: many(recipes),
  schedules: many(menuItemSchedules),
  branchOverrideLinks: many(menuItemBranchOverrides),
  channelOverrideLinks: many(menuItemChannelOverrides),
  menuMemberships: many(menuMemberships),
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
  tenant: one(tenants, { fields: [menus.tenantId], references: [tenants.id] }),
  organization: one(organizations, {
    fields: [menus.organizationId],
    references: [organizations.id],
  }),
  memberships: many(menuMemberships),
  organizationItems: many(organizationMenuItems),
  schedules: many(menuSchedules),
}));

export const organizationMenuItemsRelations = relations(
  organizationMenuItems,
  ({ one }) => ({
    menu: one(menus, {
      fields: [organizationMenuItems.menuId],
      references: [menus.id],
    }),
  }),
);

export const menuSchedulesRelations = relations(menuSchedules, ({ one }) => ({
  menu: one(menus, { fields: [menuSchedules.menuId], references: [menus.id] }),
  tenant: one(tenants, {
    fields: [menuSchedules.tenantId],
    references: [tenants.id],
  }),
}));

export const menuMembershipsRelations = relations(
  menuMemberships,
  ({ one }) => ({
    menu: one(menus, {
      fields: [menuMemberships.menuId],
      references: [menus.id],
    }),
    item: one(menuItems, {
      fields: [menuMemberships.menuItemId],
      references: [menuItems.id],
    }),
    category: one(menuCategories, {
      fields: [menuMemberships.categoryId],
      references: [menuCategories.id],
    }),
  }),
);

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [menuCategories.tenantId],
      references: [tenants.id],
    }),
    branch: one(branches, {
      fields: [menuCategories.branchId],
      references: [branches.id],
    }),
    menuItems: many(menuItems),
  }),
);

export const menuItemVariantsRelations = relations(
  menuItemVariants,
  ({ one, many }) => ({
    menuItem: one(menuItems, {
      fields: [menuItemVariants.menuItemId],
      references: [menuItems.id],
    }),
    modifierPrices: many(modifierOptionVariantPrices),
  }),
);

export const modifierGroupsRelations = relations(
  modifierGroups,
  ({ many }) => ({
    options: many(modifierOptions),
    itemLinks: many(menuItemModifierGroups),
  }),
);

export const modifierOptionsRelations = relations(
  modifierOptions,
  ({ one, many }) => ({
    group: one(modifierGroups, {
      fields: [modifierOptions.modifierGroupId],
      references: [modifierGroups.id],
    }),
    variantPrices: many(modifierOptionVariantPrices),
  }),
);

export const modifierOptionVariantPricesRelations = relations(
  modifierOptionVariantPrices,
  ({ one }) => ({
    option: one(modifierOptions, {
      fields: [modifierOptionVariantPrices.modifierOptionId],
      references: [modifierOptions.id],
    }),
    variant: one(menuItemVariants, {
      fields: [modifierOptionVariantPrices.variantId],
      references: [menuItemVariants.id],
    }),
  }),
);

export const menuItemModifierGroupsRelations = relations(
  menuItemModifierGroups,
  ({ one }) => ({
    menuItem: one(menuItems, {
      fields: [menuItemModifierGroups.menuItemId],
      references: [menuItems.id],
    }),
    group: one(modifierGroups, {
      fields: [menuItemModifierGroups.modifierGroupId],
      references: [modifierGroups.id],
    }),
  }),
);

export const menuTagsRelations = relations(menuTags, ({ many }) => ({
  itemLinks: many(menuItemTags),
}));

export const menuItemTagsRelations = relations(menuItemTags, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemTags.menuItemId],
    references: [menuItems.id],
  }),
  tag: one(menuTags, {
    fields: [menuItemTags.tagId],
    references: [menuTags.id],
  }),
}));

export const menuAllergensRelations = relations(menuAllergens, ({ many }) => ({
  itemLinks: many(menuItemAllergens),
}));

export const menuItemAllergensRelations = relations(
  menuItemAllergens,
  ({ one }) => ({
    menuItem: one(menuItems, {
      fields: [menuItemAllergens.menuItemId],
      references: [menuItems.id],
    }),
    allergen: one(menuAllergens, {
      fields: [menuItemAllergens.allergenId],
      references: [menuAllergens.id],
    }),
  }),
);

export const menuItemImagesRelations = relations(menuItemImages, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [menuItemImages.menuItemId],
    references: [menuItems.id],
  }),
}));

export const globalUserRolesRelations = relations(
  globalUserRoles,
  ({ one }) => ({
    user: one(users, {
      fields: [globalUserRoles.userId],
      references: [users.id],
    }),
    role: one(roles, {
      fields: [globalUserRoles.roleId],
      references: [roles.id],
    }),
  }),
);

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

export const rolePermissionsRelations = relations(
  rolePermissions,
  ({ one }) => ({
    role: one(roles, {
      fields: [rolePermissions.roleId],
      references: [roles.id],
    }),
    permission: one(permissions, {
      fields: [rolePermissions.permissionId],
      references: [permissions.id],
    }),
  }),
);

export const userSessionsRelations = relations(
  userSessions,
  ({ one, many }) => ({
    user: one(users, { fields: [userSessions.userId], references: [users.id] }),
    refreshTokens: many(refreshTokens),
  }),
);

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
  membership: one(tenantMemberships, {
    fields: [refreshTokens.membershipId],
    references: [tenantMemberships.id],
  }),
  session: one(userSessions, {
    fields: [refreshTokens.sessionId],
    references: [userSessions.id],
  }),
}));

export const restaurantTablesRelations = relations(
  restaurantTables,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [restaurantTables.tenantId],
      references: [tenants.id],
    }),
    branch: one(branches, {
      fields: [restaurantTables.branchId],
      references: [branches.id],
    }),
  }),
);

export const inventoryItemsRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [inventoryItems.tenantId],
      references: [tenants.id],
    }),
    branch: one(branches, {
      fields: [inventoryItems.branchId],
      references: [branches.id],
    }),
    transactions: many(inventoryTransactions),
    recipeLinks: many(recipes),
  }),
);

export const subRecipesRelations = relations(subRecipes, ({ one, many }) => ({
  tenant: one(tenants, {
    fields: [subRecipes.tenantId],
    references: [tenants.id],
  }),
  branch: one(branches, {
    fields: [subRecipes.branchId],
    references: [branches.id],
  }),
  ingredients: many(subRecipeIngredients, { relationName: "parentSubRecipe" }),
  usedByIngredients: many(subRecipeIngredients, {
    relationName: "nestedSubRecipe",
  }),
  recipeLinks: many(recipes),
}));

export const subRecipeIngredientsRelations = relations(
  subRecipeIngredients,
  ({ one }) => ({
    subRecipe: one(subRecipes, {
      fields: [subRecipeIngredients.subRecipeId],
      references: [subRecipes.id],
      relationName: "parentSubRecipe",
    }),
    inventoryItem: one(inventoryItems, {
      fields: [subRecipeIngredients.inventoryItemId],
      references: [inventoryItems.id],
    }),
    ingredientSubRecipe: one(subRecipes, {
      fields: [subRecipeIngredients.ingredientSubRecipeId],
      references: [subRecipes.id],
      relationName: "nestedSubRecipe",
    }),
  }),
);

export const recipesRelations = relations(recipes, ({ one }) => ({
  menuItem: one(menuItems, {
    fields: [recipes.menuItemId],
    references: [menuItems.id],
  }),
  inventoryItem: one(inventoryItems, {
    fields: [recipes.inventoryItemId],
    references: [inventoryItems.id],
  }),
  subRecipe: one(subRecipes, {
    fields: [recipes.subRecipeId],
    references: [subRecipes.id],
  }),
  variant: one(menuItemVariants, {
    fields: [recipes.variantId],
    references: [menuItemVariants.id],
  }),
  modifierOption: one(modifierOptions, {
    fields: [recipes.modifierOptionId],
    references: [modifierOptions.id],
  }),
}));

export const orderInventoryDeductionsRelations = relations(
  orderInventoryDeductions,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderInventoryDeductions.orderId],
      references: [orders.id],
    }),
    kitchenTicket: one(kitchenTickets, {
      fields: [orderInventoryDeductions.kitchenTicketId],
      references: [kitchenTickets.id],
    }),
    orderItem: one(orderItems, {
      fields: [orderInventoryDeductions.orderItemId],
      references: [orderItems.id],
    }),
    menuItem: one(menuItems, {
      fields: [orderInventoryDeductions.menuItemId],
      references: [menuItems.id],
    }),
    inventoryItem: one(inventoryItems, {
      fields: [orderInventoryDeductions.inventoryItemId],
      references: [inventoryItems.id],
    }),
  }),
);

export const inventoryTransactionsRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    inventoryItem: one(inventoryItems, {
      fields: [inventoryTransactions.inventoryItemId],
      references: [inventoryItems.id],
    }),
    performedByUser: one(users, {
      fields: [inventoryTransactions.performedBy],
      references: [users.id],
    }),
    reversalOfDeduction: one(orderInventoryDeductions, {
      fields: [inventoryTransactions.reversalOfDeductionId],
      references: [orderInventoryDeductions.id],
    }),
    wasteReason: one(wasteReasons, {
      fields: [inventoryTransactions.wasteReasonId],
      references: [wasteReasons.id],
    }),
  }),
);

export const wasteReasonsRelations = relations(
  wasteReasons,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [wasteReasons.tenantId],
      references: [tenants.id],
    }),
    transactions: many(inventoryTransactions),
  }),
);

export const orderStatusHistoryRelations = relations(
  orderStatusHistory,
  ({ one }) => ({
    order: one(orders, {
      fields: [orderStatusHistory.orderId],
      references: [orders.id],
    }),
    changedByUser: one(users, {
      fields: [orderStatusHistory.changedBy],
      references: [users.id],
    }),
    cancellationReason: one(cancellationReasons, {
      fields: [orderStatusHistory.cancellationReasonId],
      references: [cancellationReasons.id],
    }),
  }),
);

export const orderItemSeatSharesRelations = relations(
  orderItemSeatShares,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemSeatShares.orderItemId],
      references: [orderItems.id],
    }),
  }),
);

export const orderItemModifiersRelations = relations(
  orderItemModifiers,
  ({ one }) => ({
    orderItem: one(orderItems, {
      fields: [orderItemModifiers.orderItemId],
      references: [orderItems.id],
    }),
  }),
);

export const branchesRelations = relations(branches, ({ one }) => ({
  tenant: one(tenants, {
    fields: [branches.tenantId],
    references: [tenants.id],
  }),
}));

export const menuItemSchedulesRelations = relations(
  menuItemSchedules,
  ({ one }) => ({
    menuItem: one(menuItems, {
      fields: [menuItemSchedules.menuItemId],
      references: [menuItems.id],
    }),
    branch: one(branches, {
      fields: [menuItemSchedules.branchId],
      references: [branches.id],
    }),
    tenant: one(tenants, {
      fields: [menuItemSchedules.tenantId],
      references: [tenants.id],
    }),
  }),
);

export const holidaysRelations = relations(holidays, ({ one }) => ({
  tenant: one(tenants, {
    fields: [holidays.tenantId],
    references: [tenants.id],
  }),
}));

export const menuItemBranchOverridesRelations = relations(
  menuItemBranchOverrides,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [menuItemBranchOverrides.tenantId],
      references: [tenants.id],
    }),
    menuItem: one(menuItems, {
      fields: [menuItemBranchOverrides.menuItemId],
      references: [menuItems.id],
    }),
    branch: one(branches, {
      fields: [menuItemBranchOverrides.branchId],
      references: [branches.id],
    }),
  }),
);

export const menuItemChannelOverridesRelations = relations(
  menuItemChannelOverrides,
  ({ one }) => ({
    tenant: one(tenants, {
      fields: [menuItemChannelOverrides.tenantId],
      references: [tenants.id],
    }),
    menuItem: one(menuItems, {
      fields: [menuItemChannelOverrides.menuItemId],
      references: [menuItems.id],
    }),
  }),
);

export const combosRelations = relations(combos, ({ one, many }) => ({
  tenant: one(tenants, { fields: [combos.tenantId], references: [tenants.id] }),
  slots: many(comboSlots),
}));
export const comboSlotsRelations = relations(comboSlots, ({ one, many }) => ({
  combo: one(combos, { fields: [comboSlots.comboId], references: [combos.id] }),
  options: many(comboSlotOptions),
}));
export const comboSlotOptionsRelations = relations(
  comboSlotOptions,
  ({ one }) => ({
    slot: one(comboSlots, {
      fields: [comboSlotOptions.slotId],
      references: [comboSlots.id],
    }),
    menuItem: one(menuItems, {
      fields: [comboSlotOptions.menuItemId],
      references: [menuItems.id],
    }),
    variant: one(menuItemVariants, {
      fields: [comboSlotOptions.variantId],
      references: [menuItemVariants.id],
    }),
  }),
);

export const menuTemplatesRelations = relations(
  menuTemplates,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [menuTemplates.tenantId],
      references: [tenants.id],
    }),
    items: many(menuTemplateItems),
  }),
);

export const menuTemplateItemsRelations = relations(
  menuTemplateItems,
  ({ one }) => ({
    template: one(menuTemplates, {
      fields: [menuTemplateItems.templateId],
      references: [menuTemplates.id],
    }),
  }),
);

export const customerGroupsRelations = relations(
  customerGroups,
  ({ one, many }) => ({
    tenant: one(tenants, {
      fields: [customerGroups.tenantId],
      references: [tenants.id],
    }),
    orders: many(orders),
  }),
);
