import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, parseRole } from "@/lib/roles";
import { getMobileSessionUserById } from "@/lib/server/mobile-session-service";
import { getAuthUserByEmail, getAuthUserById } from "@/lib/server/otp-service";
import { Role } from "@/types/api";

export type AdminPageIdentity = {
  userId: string;
  email?: string;
  role: "sadmin" | "storeOwner";
};

function resolveDbRole(authDbRole?: string | null, mobileDbRole?: string | null): Role {
  const authRole = parseRole(authDbRole);
  if (authRole === "sadmin" || authRole === "storeOwner") {
    return authRole;
  }

  const mobileRole = parseRole(mobileDbRole);
  if (mobileRole === "sadmin" || mobileRole === "storeOwner") {
    return mobileRole;
  }

  return "user";
}

export async function getCurrentRole(): Promise<Role> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [liveUser, dbUserById] = await Promise.all([
    session.user.id ? getMobileSessionUserById(session.user.id) : null,
    session.user.id ? getAuthUserById(session.user.id) : null,
  ]);

  const dbUser = dbUserById ?? (session.user.email ? await getAuthUserByEmail(session.user.email) : null);

  return resolveDbRole(dbUser?.role, liveUser?.role);
}

export async function ensureAdminAccess(section: string): Promise<AdminPageIdentity> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const [liveUser, dbUserById] = await Promise.all([
    session.user.id ? getMobileSessionUserById(session.user.id) : null,
    session.user.id ? getAuthUserById(session.user.id) : null,
  ]);
  const dbUser =
    dbUserById ?? (session.user.email ? await getAuthUserByEmail(session.user.email) : null);
  const userId = dbUser?._id?.toString() ?? liveUser?.id ?? session.user.id ?? "";
  const role = resolveDbRole(dbUser?.role, liveUser?.role);
  console.log("Admin access check:", dbUser);

  if (!userId) {
    redirect("/auth/sign-in");
  }

  if (role !== "sadmin" && role !== "storeOwner") {
    notFound();
  }

  if (!canAccess(role, section)) {
    notFound();
  }

  return {
    userId,
    email: liveUser?.email ?? dbUser?.email ?? undefined,
    role,
  };
}
