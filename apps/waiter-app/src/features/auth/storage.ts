import { STORAGE_KEYS } from "../../shared/constants/storage-keys";
import type { User } from "@pos/types";

export function saveTokens(accessToken: string) {
  localStorage.setItem(STORAGE_KEYS.token, accessToken);
}

export function clearTokens() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.tenant);
  localStorage.removeItem(STORAGE_KEYS.branch);
}

export function saveContext(franchiseId: string, branchId: string | null) {
  localStorage.setItem(STORAGE_KEYS.tenant, franchiseId);
  if (branchId) localStorage.setItem(STORAGE_KEYS.branch, branchId);
  else localStorage.removeItem(STORAGE_KEYS.branch);
}

export function saveProfile(user: User) {
  localStorage.setItem(STORAGE_KEYS.name, `${user.firstName} ${user.lastName}`);
  localStorage.setItem(
    STORAGE_KEYS.permissions,
    JSON.stringify(Array.from(new Set((user.roles ?? []).flatMap((role) => role.permissions.map((permission) => permission.key))))),
  );
}

export function hasPermission(permission: string): boolean {
  try {
    return (JSON.parse(localStorage.getItem(STORAGE_KEYS.permissions) ?? "[]") as string[])
      .includes(permission);
  } catch {
    return false;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.token);
}

export function getWaiterName(): string {
  return localStorage.getItem(STORAGE_KEYS.name) ?? "Waiter";
}

export function logout() {
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
