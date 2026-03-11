import Link from "next/link";
import { ArrowRight, Building2, PackageSearch, Settings2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAdminDashboardScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";

export default async function AdminDashboardPage() {
  const identity = await ensureAdminAccess("dashboard");

  const data = await getAdminDashboardScoped(identity).catch(() => ({
    totalVendors: 0,
    activeVendors: 0,
    totalItems: 0,
    totalOffers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRiders: 0,
    activeRiders: 0,
    totalUsers: 0,
  }));

  const metrics = [
    ["Total Vendors", data.totalVendors],
    ["Active Vendors", data.activeVendors],
    ["Marketplace Items", data.totalItems],
    ["Live Offers", data.totalOffers],
    ["Orders", data.totalOrders],
    ["Pending Orders", data.pendingOrders],
    ["Users", data.totalUsers],
  ] as const;

  const modules = [
    {
      title: "Vendor operations",
      description: "Onboard sellers, configure catalog taxonomy, and monitor active storefronts.",
      href: "/admin/vendors",
      icon: Building2,
    },
    {
      title: "Catalog control",
      description: "Create store-linked items with pricing, imagery, tags, and offer coverage.",
      href: "/admin/items",
      icon: PackageSearch,
    },
    {
      title: "Fulfillment pulse",
      description: "Track packed, out-for-delivery, and exception orders across the marketplace.",
      href: "/admin/orders",
      icon: Truck,
    },
    {
      title: "Platform settings",
      description: "Validate payment and shipping integrations and review marketplace defaults.",
      href: "/admin/settings",
      icon: Settings2,
    },
  ];

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Command Center"
        title="Marketplace control tower"
        description="Track vendor growth, catalog breadth, fulfillment load, and platform access from a single admin surface built for multi-vendor ecommerce operations."
        actions={
          <>
            <Button asChild>
              <Link href="/admin/vendors/create">Launch store setup</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/items">Open catalog</Link>
            </Button>
          </>
        }
        stats={[
          { label: "Active vendors", value: String(data.activeVendors), tone: "warm" },
          { label: "Pending orders", value: String(data.pendingOrders), tone: "sun" },
          { label: "Live riders", value: String(data.activeRiders), tone: "mint" },
          { label: "Signed in scope", value: identity.role, tone: "warm" },
        ]}
      />

      <AdminSection title="Marketplace snapshot" description="The numbers below reflect the scoped data available to your current admin role.">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map(([label, value]) => (
            <Card key={label} className="border-border/70 bg-background/70">
              <CardContent className="p-5">
                <p className="text-xs uppercase tracking-[0.22em] text-[#74655c]">{label}</p>
                <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-foreground">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminSection>

      <AdminSection title="Priority modules" description="Jump into the operational areas that matter most for a marketplace team.">
        <div className="grid gap-4 md:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <Card key={module.href} className="border-border/70 bg-background/70 transition-transform duration-200 hover:-translate-y-0.5">
                <CardHeader className="space-y-4">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle>{module.title}</CardTitle>
                    <p className="text-sm leading-6 text-[#5f5047]">{module.description}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline">
                    <Link href={module.href}>
                      Open module <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </AdminSection>
    </div>
  );
}
