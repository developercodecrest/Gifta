import { AdminShell } from "@/app/admin/_components/admin-shell";
import { getCurrentRole } from "@/app/admin/_utils";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getCurrentRole();

  return (
    <AdminShell role={role}>{children}</AdminShell>
  );
}
