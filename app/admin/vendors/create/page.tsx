import { ensureAdminAccess } from "@/app/admin/_utils";
import { StoreCreateForm } from "@/app/admin/vendors/create/store-create-form";

export default async function AdminCreateStorePage() {
  await ensureAdminAccess("vendors");
  return <StoreCreateForm />;
}
