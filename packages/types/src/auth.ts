export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export type RoleName =
  | 'OWNER'
  | 'FRANCHISE_ADMIN'
  | 'MANAGER'
  | 'CHEF'
  | 'WAITER'
  | 'CASHIER'
  | 'INVENTORY_MANAGER'
  | 'RECEPTIONIST'
  | 'ACCOUNTANT';

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

export interface Tenant {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
}

export interface Branch {
  id: string;
  tenantId: string;
  name: string;
  address: string;
  phone: string;
  isActive: boolean;
  dineInEnabled: boolean;
  takeawayEnabled: boolean;
  deliveryEnabled: boolean;
  onlineEnabled: boolean;
  tablesEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
export interface AvailableMembership {
  membershipId: string;
  /** True when the authenticated user has a GLOBAL OWNER role. */
  isGlobalOwner?: boolean;
  tenant: Pick<Tenant, 'id' | 'name'>;
  roles: Array<{ id: string; name: RoleName; scope: 'GLOBAL' | 'TENANT' | 'BRANCH' }>;
  branches: Array<Pick<Branch, 'id' | 'name' | 'address' | 'isActive' | 'tablesEnabled'>>;
}
