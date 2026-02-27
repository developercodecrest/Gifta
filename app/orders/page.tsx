import Link from "next/link";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserOrders } from "@/lib/server/ecommerce-service";
import { formatCurrency } from "@/lib/utils";

const statusLabel = {
  placed: "Placed",
  packed: "Packed",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

export default async function OrdersPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const orders = userId ? await getUserOrders(userId, session?.user?.email ?? undefined).catch(() => []) : [];

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <Badge variant="secondary">Order timeline</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">My orders</h1>
        <p className="mt-2 text-sm text-muted-foreground">Track deliveries and revisit your previous gifting choices.</p>
      </header>

      {orders.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No orders yet. Complete checkout to see your order history here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.orderRef}>
              <CardContent className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Order ID</p>
                    <h2 className="font-semibold">{order.orderRef}</h2>
                  </div>
                  <Badge variant={order.status === "delivered" ? "success" : "warning"}>{statusLabel[order.status]}</Badge>
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{order.itemsSummary || `${order.itemCount} item(s)`}</p>
                {order.deliveryAddressLabel ? <p className="mt-1 text-xs text-muted-foreground">Delivery to: {order.deliveryAddressLabel}</p> : null}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">Placed on {formatDate(order.placedAt)} • {order.itemCount} item(s)</span>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-primary">{formatCurrency(order.totalAmount)}</span>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/orders/${order.orderRef}`}>View details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Button asChild variant="outline">
        <Link href="/store">Shop more gifts</Link>
      </Button>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
