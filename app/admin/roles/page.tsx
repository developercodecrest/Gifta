import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels, roleOptions, rolePermissions } from "@/lib/roles";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminRolesPage() {
  const identity = await ensureAdminAccess("roles");

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Roles</Badge>
        <h1 className="mt-2 text-2xl font-bold">Access Roles</h1>
        <p className="mt-1 text-sm text-muted-foreground">System roles: sadmin, storeOwner, rider, user. Active role: {roleLabels[identity.role]}.</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {roleOptions.map((roleOption) => (
          <Card key={roleOption}>
            <CardContent className="space-y-2 p-4">
              <p className="font-semibold">{roleLabels[roleOption]} ({roleOption})</p>
              <div className="flex flex-wrap gap-2">
                {rolePermissions[roleOption].map((permission) => (
                  <Badge key={permission} variant="outline">{permission}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
