export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

export type SystemRoleName =
  | "OWNER"
  | "FRANCHISE_ADMIN"
  | "MANAGER"
  | "CHEF"
  | "WAITER"
  | "CASHIER"
  | "INVENTORY_MANAGER"
  | "RECEPTIONIST"
  | "ACCOUNTANT";

/** System role names plus tenant-defined custom role names. */
export type RoleName = SystemRoleName | (string & {});

export interface User {
  id: string;
  tenantId: string | null;
  branchId: string | null;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: string;
  name: RoleName;
  description: string;
  permissions: Permission[];
}

export interface Permission {
  id: string;
  key: string;
  module: string;
}

export type RoundingPolicy = "NONE" | "NEAREST_1" | "NEAREST_5" | "NEAREST_10";
export type TaxMode = "INCLUSIVE" | "EXCLUSIVE";

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  serviceChargePercent?: string | null;
  serviceChargeTaxable?: boolean;
  roundingPolicy?: RoundingPolicy;
  defaultTaxMode?: TaxMode;
  courseSequencingEnabled?: boolean;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  timezone: string;
  currency: string;
  address: string;
  phone: string;
  isActive: boolean;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
}

export interface OrganizationSummary {
  id: string;
  name: string;
  isActive: boolean;
}

export interface AvailableMembership {
  membershipId: string;
  /** True when the authenticated user has a GLOBAL OWNER role. */
  isGlobalOwner?: boolean;
  tenant: Pick<Tenant, "id" | "name">;
  roles: Array<{
    id: string;
    name: RoleName;
    scope: "GLOBAL" | "TENANT" | "BRANCH";
  }>;
  branches: Array<
    Pick<Branch, "id" | "name" | "address" | "isActive" | "tablesEnabled">
  >;
}
