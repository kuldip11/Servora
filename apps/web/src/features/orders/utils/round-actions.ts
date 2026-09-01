export const getRoundActionPermissions = (
  roles: string[],
  hasPermission: (permission: string) => boolean,
) => {
  const management = roles.some((role) =>
    ["OWNER", "FRANCHISE_ADMIN", "MANAGER"].includes(role),
  );
  const kitchen = hasPermission("kitchen:update");
  return {
    canFire: kitchen || (management && hasPermission("orders:update")),
    canPrepare:
      kitchen || (management && hasPermission("orders:update_status")),
    canServe:
      kitchen ||
      ((management || roles.includes("WAITER")) &&
        hasPermission("orders:update_status")),
  };
};
