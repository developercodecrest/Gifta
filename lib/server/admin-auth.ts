import { canAccess, parseRole } from "@/lib/roles";
import { resolveRequestIdentity } from "@/lib/server/request-auth";

export type AdminIdentity = {
  userId: string;
  email?: string;
  role: "SADMIN" | "STORE_OWNER";
};

export async function authorizeAdminRequest(request: Request, section: string): Promise<AdminIdentity | null> {
  const identity = await resolveRequestIdentity(request);
  if (!identity?.userId) {
    return null;
  }

  const role = parseRole(identity.role);
  if (role !== "SADMIN" && role !== "STORE_OWNER") {
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
