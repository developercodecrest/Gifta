import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { listAdminCoupons } from "@/lib/server/coupon-service";
import { CouponsClient } from "./coupons-client";

export default async function AdminCouponsPage() {
  const identity = await ensureAdminAccess("coupons");
  const coupons = await listAdminCoupons().catch(() => []);
  const activeCount = coupons.filter((coupon) => coupon.active).length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Coupons"
        title="Manage checkout discounts from admin"
        description="Create, activate, and tune coupon rules that are consumed by web checkout and the mobile app checkout flow."
        stats={[
          { label: "Coupons", value: String(coupons.length), tone: "warm" },
          { label: "Active", value: String(activeCount), tone: "mint" },
          { label: "Inactive", value: String(coupons.length - activeCount), tone: "sun" },
          { label: "Your scope", value: identity.role, tone: "warm" },
        ]}
      />

      <AdminSection title="Coupon catalog" description="Add new coupons and edit current rules for discount, windows, and limits.">
        <CouponsClient initialCoupons={coupons} />
      </AdminSection>
    </div>
  );
}
