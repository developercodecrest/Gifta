import Link from "next/link";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminEmptyState, AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { Button } from "@/components/ui/button";
import { listVendorOnboardingSubmissions } from "@/lib/server/ecommerce-service";
import { VendorOnboardingClient } from "./onboarding-client";

export default async function AdminVendorOnboardingPage() {
  const identity = await ensureAdminAccess("vendors");

  if (identity.role !== "sadmin") {
    return (
      <div className="space-y-6">
        <AdminHero
          eyebrow="Vendor Onboarding"
          title="Vendor approval queue"
          description="Only super-admin users can review and approve onboarding submissions."
          stats={[
            { label: "Role", value: identity.role, tone: "warm" },
            { label: "Access", value: "Read only", tone: "sun" },
          ]}
        />
        <AdminSection title="No review access" description="Switch to a super-admin account to review pending vendor onboarding submissions.">
          <AdminEmptyState
            title="Super-admin required"
            description="Store owner accounts cannot approve or reject vendor onboarding requests."
            action={
              <Button asChild variant="outline">
                <Link href="/admin/vendors">Back to vendors</Link>
              </Button>
            }
          />
        </AdminSection>
      </div>
    );
  }

  const queue = await listVendorOnboardingSubmissions({
    page: 1,
    pageSize: 100,
    status: undefined,
    q: undefined,
    scope: { role: identity.role, userId: identity.userId },
  }).catch(() => ({ items: [], total: 0, page: 1, pageSize: 100, totalPages: 1 }));

  const pendingCount = queue.items.filter((entry) => entry.status === "pending").length;
  const approvedCount = queue.items.filter((entry) => entry.status === "approved").length;
  const rejectedCount = queue.items.filter((entry) => entry.status === "rejected").length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Vendor Onboarding"
        title="Review and approve vendor applications"
        description="Every submission lands here as pending. Approving creates an active store and upgrades the vendor email account role to storeOwner."
        stats={[
          { label: "Total", value: String(queue.total), tone: "warm" },
          { label: "Pending", value: String(pendingCount), tone: "sun" },
          { label: "Approved", value: String(approvedCount), tone: "mint" },
          { label: "Rejected", value: String(rejectedCount), tone: "warm" },
        ]}
      />

      <AdminSection title="Onboarding queue" description="Filter requests, inspect details, and review pending vendors.">
        <VendorOnboardingClient initialItems={queue.items} />
      </AdminSection>
    </div>
  );
}
