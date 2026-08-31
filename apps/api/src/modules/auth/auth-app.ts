import { ForbiddenError, UnauthorizedError } from "@/core/errors";

export const AUTH_APP_HEADER = "x-servora-app";

export const AUTH_APPS = ["web", "kitchen", "waiter"] as const;
export type AuthApp = (typeof AUTH_APPS)[number];

const AUTH_APP_SET = new Set<string>(AUTH_APPS);

const APP_ROLE_ACCESS: Record<AuthApp, ReadonlySet<string>> = {
  web: new Set([
    "OWNER",
    "FRANCHISE_ADMIN",
    "MANAGER",
    "CASHIER",
    "INVENTORY_MANAGER",
    "RECEPTIONIST",
    "ACCOUNTANT",
  ]),
  kitchen: new Set(["OWNER", "FRANCHISE_ADMIN", "MANAGER", "CHEF"]),
  waiter: new Set(["OWNER", "FRANCHISE_ADMIN", "MANAGER", "WAITER"]),
};

export const parseAuthApp = (value: string | undefined): AuthApp => {
  const normalized = value?.trim().toLowerCase() ?? "";
  if (!AUTH_APP_SET.has(normalized)) {
    throw new UnauthorizedError("Application identity is missing or invalid");
  }
  return normalized as AuthApp;
};

export const hasAppRoleAccess = (
  app: AuthApp,
  roleNames: readonly string[],
): boolean => roleNames.some((roleName) => APP_ROLE_ACCESS[app].has(roleName));

export const assertAppRoleAccess = (
  app: AuthApp,
  roleNames: readonly string[],
): void => {
  if (!hasAppRoleAccess(app, roleNames)) {
    throw new ForbiddenError("Account does not have access to this application");
  }
};

export const assertTokenApp = (
  tokenApp: string | undefined,
  requestApp: AuthApp,
): void => {
  if (tokenApp !== requestApp) {
    throw new ForbiddenError("Session is not valid for this application");
  }
};
