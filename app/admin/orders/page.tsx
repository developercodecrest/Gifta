import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { roleLabels } from "@/lib/roles";
import { getAdminOrdersScoped } from "@/lib/server/ecommerce-service";
import { ensureAdminAccess } from "@/app/admin/_utils";

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

      <div className="grid gap-3">
        {orders.map((order) => (
          <Card key={order.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm text-muted-foreground">Store {order.storeId} • Product {order.productId} • Qty {order.quantity}</p>
                <p className="text-xs text-muted-foreground">Customer: {order.customerName}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{order.totalAmount}</p>
                <p className="text-xs text-muted-foreground">{order.status}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
