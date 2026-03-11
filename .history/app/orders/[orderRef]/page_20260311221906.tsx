import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getUserOrderDetails } from "@/lib/server/ecommerce-service";
import { getAuthUserById } from "@/lib/server/otp-service";
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
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const dbUser = await getAuthUserById(userId);
  const order = await getUserOrderDetails(orderRef, userId, dbUser?.email ?? undefined).catch(() => null);
  if (!order) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 sm:p-8 lg:p-10">
        <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Order details</Badge>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{order.orderRef}</h1>
            <p className="mt-3 text-sm text-[#5f5047]">Placed on {formatDate(order.placedAt)} · Last update {formatDate(order.lastUpdatedAt)}</p>
          </div>
          <Badge variant={order.status === "delivered" ? "success" : "warning"}>{statusLabel[order.status]}</Badge>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
        <Card className="glass-panel rounded-4xl border-white/60">
          <CardContent className="space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[#5f5047]">{order.itemsSummary || `${order.itemCount} item(s)`}</p>
              <p className="text-lg font-semibold text-primary">{formatCurrency(order.totalAmount)}</p>
            </div>

            {order.deliveryAddressLabel ? <p className="text-sm text-[#5f5047]">Delivery to: {order.deliveryAddressLabel}</p> : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="app-data-panel rounded-3xl p-4 text-sm text-[#5f5047]">
                <p className="font-semibold text-foreground">Payment</p>
                <p className="mt-2">Method: {(order.paymentMethod ?? "razorpay").toUpperCase()}</p>
                <p className="mt-1">Transaction: {order.transactionStatus ?? "pending"}</p>
                <p className="mt-1">ID: {order.transactionId ?? order.paymentId ?? "-"}</p>
              </div>
              <div className="app-data-panel rounded-3xl p-4 text-sm text-[#5f5047]">
                <p className="font-semibold text-foreground">Shipping</p>
                <p className="mt-2">Provider: {(order.shippingProvider ?? "delhivery").toUpperCase()}</p>
                <p className="mt-1">Status: {order.shippingProviderStatus ?? "pending-shipment"}</p>
                <p className="mt-1">AWB: {order.shippingAwb ?? "-"}</p>
              </div>
            </div>

            {order.shippingAwb ? (
              <Button asChild variant="outline">
                <Link
                  href={`https://www.delhivery.com/track/package/${encodeURIComponent(order.shippingAwb)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Track on Delhivery
                </Link>
              </Button>
            ) : null}

            {order.shippingError ? <p className="text-sm text-destructive">Shipping error: {order.shippingError}</p> : null}
          </CardContent>
        </Card>

        <Card className="rounded-4xl border-white/60 bg-[linear-gradient(135deg,#1f1418_0%,#2e1d23_100%)] text-white">
          <CardContent className="p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffc9a6]">Tracking</p>
            <div className="mt-5 space-y-3">
              {order.tracking.map((step) => (
                <div key={step.status} className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/8 px-4 py-3">
                  <span className="text-sm">{step.label}</span>
                  <Badge variant={step.active ? "default" : step.completed ? "success" : "secondary"}>
                    {step.active ? "Current" : step.completed ? "Done" : "Pending"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card className="glass-panel rounded-4xl border-white/60">
        <CardContent className="p-6">
          <h2 className="font-display text-3xl font-semibold">Items</h2>
          <div className="mt-4 space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/70 bg-white/75 px-4 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{item.productName}</p>
                  <p className="font-semibold text-primary">{formatCurrency(item.totalAmount)}</p>
                </div>
                <p className="mt-1 text-xs text-[#74655c]">Qty {item.quantity} • {item.storeName ?? item.storeId}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <InfoPill icon={PackageCheck} label="Order summary" text="Cleaner presentation with better status visibility." />
        <InfoPill icon={Truck} label="Delivery status" text="Tracking remains readable at every step." />
        <InfoPill icon={ShieldCheck} label="Payment clarity" text="Transaction and shipping metadata grouped cleanly." />
      </section>

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

function InfoPill({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof PackageCheck;
  label: string;
  text: string;
}) {
  return (
    <div className="app-data-panel rounded-4xl p-5">
      <Icon className="h-5 w-5 text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-[#5f5047]">{text}</p>
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
