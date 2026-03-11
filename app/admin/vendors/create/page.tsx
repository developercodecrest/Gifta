import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero } from "@/app/admin/_components/admin-surface";
import { StoreCreateForm } from "@/app/admin/vendors/create/store-create-form";

export default async function AdminCreateStorePage() {
  await ensureAdminAccess("vendors");

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="New vendor"
        title="Launch a complete storefront profile"
        description="Capture commercial, operational, delivery, payout, media, and catalog metadata in one admin workflow so each store is ready for multi-vendor commerce from day one."
      />
      <StoreCreateForm />
    </div>
  );
}
