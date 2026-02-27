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
  storeOwner: ["dashboard", "vendors", "items", "orders", "settings"],
  rider: [],
  user: [],
};

export function parseRole(value: string | null | undefined): Role {
  const normalized = value?.trim().toLowerCase();
  if (normalized && /admin/i.test(normalized)) {
    return "sadmin";
  }

  return roleOptions.includes(normalized as Role) ? (normalized as Role) : "user";
}

export function canAccess(role: Role, section: string) {
  return rolePermissions[role].includes(section);
}
