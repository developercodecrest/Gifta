import { getAdminUsers } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { UsersClient } from "./users-client";

export default async function AdminUsersPage() {
  const identity = await ensureAdminAccess("users");

  const users = await getAdminUsers().catch(() => []);
  const withPhone = users.filter((user) => user.phone).length;
  const withAddresses = users.filter((user) => user.addresses.length > 0).length;

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Users"
        title="Customer and operator account management"
        description="Review shopper profiles, edit privileged roles, and maintain the account layer behind checkout, notifications, and store operations."
        stats={[
          { label: "Profiles", value: String(users.length), tone: "warm" },
          { label: "With phone", value: String(withPhone), tone: "mint" },
          { label: "Saved addresses", value: String(withAddresses), tone: "sun" },
          { label: "Your scope", value: identity.role, tone: "warm" },
        ]}
      />

      <AdminSection title="User directory" description="Search and update user records, then apply role changes where your access level permits it.">
        <UsersClient users={users} />
      </AdminSection>
    </div>
  );
}
