import { Card, CardContent } from "@/components/ui/card";
import { roleLabels, roleOptions, rolePermissions } from "@/lib/roles";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";

export default async function AdminRolesPage() {
  const identity = await ensureAdminAccess("roles");
  const totalPermissions = Array.from(new Set(roleOptions.flatMap((roleOption) => rolePermissions[roleOption]))).length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Roles"
        title="Access policy and permission model"
        description="Review which capabilities belong to super admins, store owners, and regular users across the marketplace."
        stats={[
          { label: "Role types", value: String(roleOptions.length), tone: "warm" },
          { label: "Permission keys", value: String(totalPermissions), tone: "mint" },
          { label: "Current role", value: roleLabels[identity.role], tone: "sun" },
        ]}
      />

      <AdminSection title="Role definitions" description="Use this as the policy reference for what each admin identity can access.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {roleOptions.map((roleOption) => (
            <Card key={roleOption} className="border-border/70 bg-background/70">
              <CardContent className="space-y-4 p-5">
                <div>
                  <p className="text-lg font-semibold tracking-[-0.03em]">{roleLabels[roleOption]}</p>
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{roleOption}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {rolePermissions[roleOption].map((permission) => (
                    <span key={permission} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-foreground">
                      {permission}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
