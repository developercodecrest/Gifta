import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, parseRole } from "@/lib/roles";
import { getMobileSessionUserById } from "@/lib/server/mobile-session-service";
import { getAuthUserByEmail } from "@/lib/server/otp-service";
import { Role } from "@/types/api";

export type AdminPageIdentity = {
  userId: string;
  email?: string;
  role: "sadmin" | "storeOwner";
};

export async function getCurrentRole(): Promise<Role> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const liveUser = session.user.id ? await getMobileSessionUserById(session.user.id) : null;
  const emailUser = !liveUser && session.user.email ? await getAuthUserByEmail(session.user.email) : null;

  return parseRole(liveUser?.role ?? emailUser?.role ?? session.user.role);
}

export async function ensureAdminAccess(section: string): Promise<AdminPageIdentity> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const liveUser = session.user.id ? await getMobileSessionUserById(session.user.id) : null;
  const emailUser = !liveUser && session.user.email ? await getAuthUserByEmail(session.user.email) : null;
  const userId = liveUser?.id ?? emailUser?._id?.toString() ?? session.user.id ?? "";
  const role = parseRole(liveUser?.role ?? emailUser?.role ?? session.user.role);

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
    email: liveUser?.email ?? emailUser?.email ?? session.user.email ?? undefined,
    role,
  };
}
