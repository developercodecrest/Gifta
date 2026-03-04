import { Badge } from "@/components/ui/badge";
import { roleLabels } from "@/lib/roles";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { OrdersClient } from "./orders-client";

export default async function AdminOrdersPage() {
  const identity = await ensureAdminAccess("orders");

  const orders = await getAdminOrdersScoped(identity).catch(() => []);

  return (
    <div className="space-y-6">
      <header className="rounded-xl border border-border bg-card p-5">
        <Badge variant="secondary">Orders</Badge>
        <h1 className="mt-2 text-2xl font-bold">Order Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track order status across stores and riders. Active role: {roleLabels[identity.role]}.</p>
      </header>

      <OrdersClient orders={orders} />
    </div>
  );
}
