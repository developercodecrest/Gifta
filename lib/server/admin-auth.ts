import { canAccess, parseRole } from "@/lib/roles";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export type AdminIdentity = {
  userId: string;
  email?: string;
  role: "sadmin" | "storeOwner";
};

export async function authorizeAdminRequest(request: Request, section: string): Promise<AdminIdentity | null> {
  const identity = await resolveRequestIdentity(request);
  if (!identity?.userId) {
    return null;
  }

  const role = parseRole(identity.role);
  if (role !== "sadmin" && role !== "storeOwner") {
    return null;
  }

  if (!canAccess(role, section)) {
    return null;
  }

  return {
    userId: identity.userId,
    email: identity.email,
    role,
  };
}
