import { Role } from "@/types/api";

export const roleOptions: Role[] = ["sadmin", "storeOwner", "rider", "user"];

export const roleLabels: Record<Role, string> = {
  sadmin: "Super Admin",
  storeOwner: "Store Owner",
  rider: "Rider",
  user: "User",
};

export const rolePermissions: Record<Role, string[]> = {
  sadmin: ["dashboard", "vendors", "items", "orders", "users", "riders", "roles", "settings"],
  storeOwner: ["dashboard", "items", "orders"],
  rider: ["dashboard", "orders"],
  user: ["dashboard"],
};

export function parseRole(value: string | null | undefined): Role {
  return roleOptions.includes(value as Role) ? (value as Role) : "user";
}

export function canAccess(role: Role, section: string) {
  return rolePermissions[role].includes(section);
}
