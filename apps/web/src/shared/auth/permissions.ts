import { useMemo } from 'react';
import { useAuthStore } from '../../store/auth';

export type PermissionKey = string;

export function getUserPermissions(user: ReturnType<typeof useAuthStore.getState>['user']): Set<string> {
  const permissions = new Set<string>();
  for (const role of user?.roles ?? []) {
    for (const permission of role.permissions ?? []) permissions.add(permission.key);
  }
  return permissions;
}

export function userHasPermission(
  user: ReturnType<typeof useAuthStore.getState>['user'],
  permission: PermissionKey,
): boolean {
  return getUserPermissions(user).has(permission);
}

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const permissions = useMemo(() => getUserPermissions(user), [user]);
  return {
    permissions,
    has: (permission: PermissionKey) => permissions.has(permission),
    hasAny: (required: PermissionKey[]) => required.some((permission) => permissions.has(permission)),
    hasAll: (required: PermissionKey[]) => required.every((permission) => permissions.has(permission)),
  };
}
