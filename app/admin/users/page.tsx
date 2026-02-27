import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getAdminUsers } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";

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

      <div className="grid gap-3 md:grid-cols-2">
        {users.map((user) => (
          <Card key={user.userId}>
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">User ID: {user.userId}</p>
              <p className="text-xs text-muted-foreground">Updated: {new Date(user.updatedAt).toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
