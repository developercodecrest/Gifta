import { Role } from "@/types/api";

export type CanonicalRole = "SADMIN" | "STORE_OWNER" | "USER" | "RIDER" | "AREA_MANAGER";

export const roleOptions: CanonicalRole[] = ["USER", "STORE_OWNER", "SADMIN", "RIDER", "AREA_MANAGER"];

export const roleLabels: Record<CanonicalRole, string> = {
  SADMIN: "Super Admin",
  STORE_OWNER: "Store Owner",
  USER: "User",
  RIDER: "Rider",
  AREA_MANAGER: "Area Manager",
};

export const rolePermissions: Record<CanonicalRole, string[]> = {
  SADMIN: ["dashboard", "vendors", "items", "orders", "riders", "users", "roles", "settings", "coupons"],
  STORE_OWNER: ["dashboard", "vendors", "items", "orders"],
  USER: [],
  RIDER: ["dashboard", "orders"],
  AREA_MANAGER: ["dashboard", "orders", "riders"],
};

export function parseRole(value: string | null | undefined): CanonicalRole {
  const normalized = value?.trim();
  if (!normalized) {
    return "USER";
  }

  const compact = normalized.replace(/[\s-]/g, "_").toUpperCase();
  if (compact === "SADMIN" || compact === "SUPERADMIN" || compact === "ADMIN") {
    return "SADMIN";
  }
  if (compact === "STOREOWNER" || compact === "STORE_OWNER") {
    return "STORE_OWNER";
  }
  if (compact === "USER") {
    return "USER";
  }
  if (compact === "RIDER") {
    return "RIDER";
  }
  if (compact === "AREAMANAGER" || compact === "AREA_MANAGER") {
    return "AREA_MANAGER";
  }

  const legacyLower = normalized.toLowerCase();
  if (legacyLower === "sadmin") return "SADMIN";
  if (legacyLower === "storeowner") return "STORE_OWNER";
  if (legacyLower === "user") return "USER";

  return "USER";
}

export function isAdminRole(role: string | null | undefined) {
  const parsed = parseRole(role);
  return parsed === "SADMIN" || parsed === "STORE_OWNER";
}

export function canAccess(role: Role | CanonicalRole, section: string) {
  return rolePermissions[parseRole(role)].includes(section);
}
