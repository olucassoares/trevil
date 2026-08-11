export type Role = "admin" | "manager" | "viewer";
export type Permission = "orders:write" | "catalog:write" | "customers:write" | "inventory:write" | "reports:view" | "reports:export";

export const rolePermissions: Record<Role, Permission[]> = {
  admin: ["orders:write", "catalog:write", "customers:write", "inventory:write", "reports:view", "reports:export"],
  manager: ["orders:write", "catalog:write", "customers:write", "inventory:write", "reports:view"],
  viewer: ["reports:view"],
};

export function hasPermission(role: Role, permission: Permission) {
  return rolePermissions[role].includes(permission);
}
