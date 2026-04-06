import { Card, CardContent } from "@/components/ui/card";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { IntegrationTestCard } from "@/app/admin/settings/integration-test-card";
import { HomeRankingSettingsCard } from "@/app/admin/settings/home-ranking-settings-card";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { getHomeRankingConfig } from "@/lib/server/ecommerce-service";

export default async function AdminSettingsPage() {
  const identity = await ensureAdminAccess("settings");
  const rankingConfig = await getHomeRankingConfig().catch(() => ({
    trending: {
      recentQuantityWeight: 8,
      recentOrdersWeight: 2,
      ratingWeight: 7,
      reviewsWeight: 3,
      offerWeight: 0.8,
      featuredBoost: 4,
    },
    bestSellers: {
      totalQuantityWeight: 6,
      totalOrdersWeight: 3,
      revenueWeight: 0.004,
      ratingWeight: 4,
      reviewsWeight: 2,
    },
    signaturePicks: {
      premiumSignalWeight: 1,
      qualityWeight: 1,
      discountWeight: 5,
      trustWeight: 1,
      demandWeight: 1,
      signaturePriceThreshold: 1200,
      highPriceThreshold: 1800,
    },
  }));

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Settings"
        title="Marketplace defaults and integration health"
        description="Review commercial defaults, settlement cadence, service-level assumptions, and the live connectivity of Razorpay plus Delhivery."
        stats={[
          { label: "Commission", value: "12%", tone: "warm" },
          { label: "Payout cadence", value: "7 days", tone: "mint" },
          { label: "SLA window", value: "24-48 hrs", tone: "sun" },
          { label: "Scope", value: identity.role, tone: "warm" },
        ]}
      />

      <AdminSection title="Operational defaults" description="These cards summarize the current platform assumptions exposed through the admin surface.">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-border/70 bg-background/70">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Commission</p>
            <p className="text-sm text-muted-foreground">Default platform commission: 12% per order.</p>
          </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/70">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Payout Cycle</p>
            <p className="text-sm text-muted-foreground">Vendor settlements every 7 days.</p>
          </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/70">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Delivery SLA</p>
            <p className="text-sm text-muted-foreground">Standard SLA: 24-48 hours in serviceable zones.</p>
          </CardContent>
          </Card>
          <Card className="border-border/70 bg-background/70">
          <CardContent className="space-y-2 p-4">
            <p className="font-semibold">Role Policy</p>
            <p className="text-sm text-muted-foreground">Only sadmin can manage roles and platform-level controls.</p>
          </CardContent>
          </Card>
        </div>
      </AdminSection>

      <AdminSection title="Integration diagnostics" description="Run live checks against payment and shipping setup from one admin card.">
        <IntegrationTestCard />
      </AdminSection>

      <AdminSection title="Home ranking controls" description="Adjust weighting signals used to rank Trending, Best Sellers, and Signature Picks.">
        <HomeRankingSettingsCard initialConfig={rankingConfig} />
      </AdminSection>
    </div>
  );
}
