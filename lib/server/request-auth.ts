import { auth } from "@/auth";
import { parseRole } from "@/lib/roles";
import { getMobileSessionUserById, getUserFromAccessToken } from "@/lib/server/mobile-session-service";
import { getAuthUserById } from "@/lib/server/otp-service";
import { Role } from "@/types/api";

export type RequestIdentity = {
  userId: string;
  email?: string;
  role: Role;
  source: "session" | "token";
};

function resolveHighestRole(...values: Array<string | null | undefined>): Role {
  const parsed = values.map((value) => parseRole(value));
  if (parsed.includes("sadmin")) return "sadmin";
  if (parsed.includes("storeOwner")) return "storeOwner";
  if (parsed.includes("rider")) return "rider";
  return "user";
}

function getBearerToken(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const [scheme, token] = authHeader.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token.trim();
}

export async function resolveRequestIdentity(request: Request): Promise<RequestIdentity | null> {
  const session = await auth();
  const sessionUserId = session?.user?.id;

  if (session?.user) {
    const liveUser = sessionUserId ? await getMobileSessionUserById(sessionUserId) : null;
    const dbUser = sessionUserId ? await getAuthUserById(sessionUserId) : null;
    const resolvedUserId = dbUser?._id?.toString() ?? liveUser?.id ?? sessionUserId;

    if (!resolvedUserId) {
      return null;
    }

    return {
      userId: resolvedUserId,
      email: liveUser?.email ?? dbUser?.email ?? undefined,
      role: resolveHighestRole(dbUser?.role, liveUser?.role, "user"),
      source: "session",
    };
  }

  const bearerToken = getBearerToken(request);
  if (!bearerToken) {
    return null;
  }

  const tokenUser = await getUserFromAccessToken(bearerToken);
  if (!tokenUser) {
    return null;
  }

  return {
    userId: tokenUser.id,
    email: tokenUser.email,
    role: tokenUser.role,
    source: "token",
  };
}
