import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, parseRole } from "@/lib/roles";
import { getMobileSessionUserById } from "@/lib/server/mobile-session-service";
import { getAuthUserById } from "@/lib/server/otp-service";
import { Role } from "@/types/api";

export type AdminPageIdentity = {
  userId: string;
  email?: string;
  role: "sadmin" | "storeOwner";
};

function resolveHighestRole(...values: Array<string | null | undefined>): Role {
  const parsed = values.map((value) => parseRole(value));
  if (parsed.includes("sadmin")) return "sadmin";
  if (parsed.includes("storeOwner")) return "storeOwner";
  return "user";
}

export async function getCurrentRole(): Promise<Role> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const liveUser = session.user.id ? await getMobileSessionUserById(session.user.id) : null;
  const dbUser = session.user.id ? await getAuthUserById(session.user.id) : null;

  return resolveHighestRole(dbUser?.role, liveUser?.role, "user");
}

export async function ensureAdminAccess(section: string): Promise<AdminPageIdentity> {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  const liveUser = session.user.id ? await getMobileSessionUserById(session.user.id) : null;
  const dbUser = session.user.id ? await getAuthUserById(session.user.id) : null;
  const userId = dbUser?._id?.toString() ?? liveUser?.id ?? session.user.id ?? "";
  const role = resolveHighestRole(dbUser?.role, liveUser?.role, "user");
  console.log("Admin access check:", { userId, role, section });

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
