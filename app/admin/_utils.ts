import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { canAccess, parseRole } from "@/lib/roles";
import { Role } from "@/types/api";

export async function getCurrentRole(): Promise<Role> {
  const session = await auth();

  if (!session?.user) {
    redirect("/auth/sign-in");
  }

  return parseRole(session.user.role);
}

export async function ensureAdminAccess(section: string): Promise<Role> {
  const role = await getCurrentRole();

  if (!canAccess(role, section)) {
    notFound();
  }

  return role;
}
