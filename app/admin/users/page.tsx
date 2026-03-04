import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/roles";
import { getAdminUsers } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const identity = await ensureAdminAccess("users");

  const users = await getAdminUsers().catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Users</Badge>
        <h1 className="mt-2 text-2xl font-bold">User Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">View customer and owner user records. Active role: {roleLabels[identity.role]}.</p>
      </header>

      <UsersClient users={users} />
    </div>
  );
}
