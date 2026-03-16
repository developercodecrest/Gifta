import { redirect } from "next/navigation";
import { ensureAdminAccess } from "@/app/admin/_utils";

export default async function AdminItemsPage() {
  await ensureAdminAccess("vendors");
  redirect("/admin/vendors");
}
