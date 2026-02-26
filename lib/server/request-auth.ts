import { auth } from "@/auth";
import { parseRole } from "@/lib/roles";
import { getUserFromAccessToken } from "@/lib/server/mobile-session-service";
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

  if (sessionUserId) {
    return {
      userId: sessionUserId,
      email: session.user?.email ?? undefined,
      role: parseRole(session.user?.role ?? "user"),
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
