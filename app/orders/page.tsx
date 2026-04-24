import Image from "next/image";
import Link from "next/link";
import { PackageCheck, Truck } from "lucide-react";
import { auth } from "@/auth";
import { OrdersAuthGuard } from "@/app/orders/orders-auth-guard";
import { OrderRealtimeRefresh } from "@/components/orders/order-realtime-refresh";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveProductImage } from "@/lib/product-image";
import { getUserOrders } from "@/lib/server/ecommerce-service";
import { getAuthUserById } from "@/lib/server/otp-service";
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
  const dbUser = userId ? await getAuthUserById(userId) : null;
  const orders = userId ? await getUserOrders(userId, dbUser?.email ?? undefined).catch(() => []) : [];
  const totalSpent = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const activeOrders = orders.filter((order) => ["placed", "packed", "out-for-delivery"].includes(order.status)).length;
  const deliveredOrders = orders.filter((order) => order.status === "delivered").length;

  return (
    <OrdersAuthGuard>
      <div className="space-y-6">
        <OrderRealtimeRefresh />
        <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 sm:p-8 lg:p-10">
          <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Order timeline</Badge>
          <h1 className="font-display mt-4 text-4xl font-semibold leading-tight sm:text-5xl">Your orders with richer tracking and full line-level details</h1>
          <p className="mt-3 max-w-3xl text-sm text-[#5f5047] sm:text-base">Review payment, shipping, item-level status, and customized details in a layout aligned with the admin-order experience.</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#74655c]">Orders</p>
              <p className="mt-1 text-lg font-semibold">{orders.length}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#74655c]">Active</p>
              <p className="mt-1 text-lg font-semibold">{activeOrders}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#74655c]">Delivered</p>
              <p className="mt-1 text-lg font-semibold">{deliveredOrders}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3">
              <p className="text-xs uppercase tracking-[0.18em] text-[#74655c]">Total spent</p>
              <p className="mt-1 text-lg font-semibold text-primary">{formatCurrency(totalSpent)}</p>
            </div>
          </div>
        </header>

        {orders.length === 0 ? (
          <Card className="rounded-4xl border-dashed border-[#e5c9bb] bg-white/78 text-slate-950">
            <CardContent className="p-8 text-center">
              <PackageCheck className="mx-auto h-10 w-10 text-primary" />
              <p className="mt-4 text-sm text-[#5f5047]">No orders yet. Complete checkout to see your order history here.</p>
              <Button asChild className="mt-5">
                <Link href="/store">Shop gifts</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.orderRef} className="glass-panel rounded-4xl border-white/60">
                <CardContent className="space-y-4 p-5 sm:p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.2em] text-[#74655c]">Order ref</p>
                      <h2 className="mt-1 text-xl font-semibold">{order.orderRef}</h2>
                      <p className="mt-1 text-xs text-[#74655c]">Placed {formatDateTime(order.placedAt)} • Last update {formatDateTime(order.lastUpdatedAt)}</p>
                    </div>
                    <Badge variant={toStatusBadgeVariant(order.status)}>{statusLabel[order.status]}</Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <InfoTile label="Items" value={`${order.itemCount} unit(s)`} />
                    <InfoTile label="Order total" value={formatCurrency(order.totalAmount)} tone="primary" />
                    <InfoTile label="Payment" value={`${(order.paymentMethod ?? "razorpay").toUpperCase()} • ${order.transactionStatus ?? "pending"}`} />
                    <InfoTile label="Shipping" value={`${(order.shippingProvider ?? "delhivery").toUpperCase()} • ${order.shippingProviderStatus ?? "pending-shipment"}`} />
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-white/75 p-3 text-sm text-[#5f5047]">
                    <p className="font-medium text-foreground">Items summary</p>
                    <p className="mt-1">{order.itemsSummary || `${order.itemCount} item(s)`}</p>
                    {order.deliveryAddressLabel ? <p className="mt-1 text-xs">Delivery label: {order.deliveryAddressLabel}</p> : null}
                    {order.shippingAwb ? <p className="mt-1 text-xs">AWB: {order.shippingAwb}</p> : null}
                    {order.shippingError ? <p className="mt-1 text-xs text-destructive">Shipping error: {order.shippingError}</p> : null}
                  </div>

                  {order.items.length ? (
                    <div className="space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-border/70 bg-white/78 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/70 bg-muted/20">
                                <Image src={resolveProductImage(item.productImage)} alt={item.productName} fill className="object-cover" sizes="48px" />
                              </div>
                              <div className="min-w-0 text-sm text-[#5f5047]">
                                <p className="truncate font-medium text-foreground">{item.productName}</p>
                                <p className="text-xs">Qty {item.quantity} • {item.storeName ?? item.storeId}</p>
                                <p className="text-xs">Line status: {statusLabel[item.status]}</p>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-primary">{formatCurrency(item.totalAmount)}</p>
                          </div>

                          {item.customization ? <CustomizationBlock customization={item.customization} compact /> : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <p className="flex items-center gap-2 text-sm text-[#5f5047]"><Truck className="h-4 w-4 text-primary" />Live payment and shipping metadata is retained per order line.</p>
                    <div className="flex flex-wrap gap-2">
                      {order.shippingAwb ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={`https://www.delhivery.com/track/package/${encodeURIComponent(order.shippingAwb)}`} target="_blank" rel="noopener noreferrer">Track shipment</Link>
                        </Button>
                      ) : null}
                      <Button asChild variant="outline" size="sm">
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
    </OrdersAuthGuard>
  );
}

function InfoTile({ label, value, tone }: { label: string; value: string; tone?: "default" | "primary" }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/75 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-[#74655c]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === "primary" ? "text-primary" : "text-foreground"}`}>{value}</p>
    </div>
  );
}

function CustomizationBlock({
  customization,
  compact,
}: {
  customization: NonNullable<(Awaited<ReturnType<typeof getUserOrders>>[number]["items"][number])["customization"]>;
  compact?: boolean;
}) {
  return (
    <div className={`mt-2 rounded-xl border border-[#e4cf9e] bg-[#fffaf0] ${compact ? "p-2" : "p-3"} text-xs text-[#5f5047]`}>
      <p className="font-medium text-[#3c2a25]">Customized item</p>
      {customization.images?.length ? (
        <div className="mt-2 grid grid-cols-5 gap-1.5">
          {customization.images.slice(0, 5).map((imageUrl, index) => (
            <div key={`${imageUrl}-${index}`} className="aspect-square overflow-hidden rounded-md border border-[#ead7cb] bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={`Customization ${index + 1}`} className="h-full w-full object-cover" />
            </div>
          ))}
        </div>
      ) : null}
      {customization.images && customization.images.length > 5 ? (
        <p className="mt-1 text-[11px] text-[#74655c]">+{customization.images.length - 5} more image(s)</p>
      ) : null}
      {customization.giftWrap || customization.giftCard || customization.giftMessage || customization.approvalByEmail ? (
        <p className="mt-1">
          {customization.giftWrap ? "Gift Wrap" : null}
          {customization.giftWrap && customization.giftCard ? " • " : null}
          {customization.giftCard ? "Gift Card" : null}
          {(customization.giftWrap || customization.giftCard) && customization.giftMessage ? " • " : null}
          {customization.giftMessage ? "Gift Message" : null}
          {(customization.giftWrap || customization.giftCard || customization.giftMessage) && customization.approvalByEmail ? " • " : null}
          {customization.approvalByEmail ? "Approval by email" : null}
        </p>
      ) : null}
      {customization.whatsappNumber ? <p className="mt-1">WhatsApp: {customization.whatsappNumber}</p> : null}
      {customization.description ? <p className="mt-1 line-clamp-2">{customization.description}</p> : null}
    </div>
  );
}

function toStatusBadgeVariant(status: keyof typeof statusLabel) {
  if (status === "delivered") return "success" as const;
  if (status === "cancelled") return "secondary" as const;
  return "warning" as const;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
