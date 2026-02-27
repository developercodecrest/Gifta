import { auth } from "@/auth";
import { parseRole } from "@/lib/roles";
import { getMobileSessionUserById, getUserFromAccessToken } from "@/lib/server/mobile-session-service";
import { getAuthUserByEmail } from "@/lib/server/otp-service";
import { Role } from "@/types/api";

export type RequestIdentity = {
  userId: string;
  email?: string;
  role: Role;
  source: "session" | "token";
};

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
  const sessionEmail = session?.user?.email;

  if (session?.user) {
    const liveUser = sessionUserId ? await getMobileSessionUserById(sessionUserId) : null;
    const emailUser = !liveUser && sessionEmail ? await getAuthUserByEmail(sessionEmail) : null;
    const resolvedUserId = liveUser?.id ?? emailUser?._id?.toString() ?? sessionUserId;

    if (!resolvedUserId) {
      return null;
    }

    return {
      userId: resolvedUserId,
      email: liveUser?.email ?? emailUser?.email ?? sessionEmail ?? undefined,
      role: parseRole(liveUser?.role ?? emailUser?.role ?? session.user?.role ?? "user"),
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
