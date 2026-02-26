import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserOrderDetails } from "@/lib/server/ecommerce-service";
import { formatCurrency } from "@/lib/utils";

const statusLabel = {
  placed: "Placed",
  packed: "Packed",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
} as const;

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderRef: string }>;
}) {
  const { orderRef } = await params;
  const session = await auth();

  const order = await getUserOrderDetails(orderRef, session?.user?.email ?? undefined).catch(() => null);
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <Badge variant="secondary">Order details</Badge>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{order.orderRef}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Placed on {formatDate(order.placedAt)} · Last update {formatDate(order.lastUpdatedAt)}</p>
      </header>

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{order.itemsSummary || `${order.itemCount} item(s)`}</p>
            <Badge variant={order.status === "delivered" ? "success" : "warning"}>{statusLabel[order.status]}</Badge>
          </div>

          {order.deliveryAddressLabel ? <p className="text-sm text-muted-foreground">Delivery to: {order.deliveryAddressLabel}</p> : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{order.itemCount} item(s)</p>
            <p className="text-lg font-semibold text-primary">{formatCurrency(order.totalAmount)}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">Tracking</h2>
          <div className="mt-4 space-y-3">
            {order.tracking.map((step) => (
              <div key={step.status} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <span className="text-sm">{step.label}</span>
                <Badge variant={step.active ? "default" : step.completed ? "success" : "secondary"}>
                  {step.active ? "Current" : step.completed ? "Done" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h2 className="text-lg font-semibold">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-lg border border-border px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.productName}</p>
                  <p className="font-semibold text-primary">{formatCurrency(item.totalAmount)}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Qty {item.quantity} • {item.storeName ?? item.storeId}</p>
                {item.riderName ? <p className="mt-1 text-xs text-muted-foreground">Rider: {item.riderName}</p> : null}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/orders">Back to orders</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/store">Shop more gifts</Link>
        </Button>
      </div>
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
