import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PackageCheck, ShieldCheck, Truck } from "lucide-react";
import { auth } from "@/auth";
import { OrdersAuthGuard } from "@/app/orders/orders-auth-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { resolveProductImage } from "@/lib/product-image";
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

  const dbUser = userId ? await getAuthUserById(userId) : null;
  const order = userId ? await getUserOrderDetails(orderRef, userId, dbUser?.email ?? undefined).catch(() => null) : null;
  if (userId && !order) {
    notFound();
  }

  return (
    <OrdersAuthGuard>
      {order ? (
        <div className="space-y-6">
          <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 sm:p-8 lg:p-10">
            <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Order details</Badge>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-4xl font-semibold leading-tight sm:text-5xl">{order.orderRef}</h1>
                <p className="mt-3 text-sm text-[#5f5047]">Placed {formatDateTime(order.placedAt)} · Last update {formatDateTime(order.lastUpdatedAt)}</p>
              </div>
              <Badge variant={toStatusBadgeVariant(order.status)}>{statusLabel[order.status]}</Badge>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <InfoTile label="Line items" value={String(order.items.length)} />
              <InfoTile label="Units" value={`${order.itemCount} unit(s)`} />
              <InfoTile label="Status" value={statusLabel[order.status]} />
              <InfoTile label="Total" value={formatCurrency(order.totalAmount)} tone="primary" />
            </div>
          </header>

          <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <Card className="glass-panel rounded-4xl border-white/60">
              <CardContent className="space-y-3 p-6 text-sm text-[#5f5047]">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#74655c]">Customer snapshot</p>
                <p><span className="font-semibold text-foreground">Name:</span> {order.customerName ?? "-"}</p>
                <p><span className="font-semibold text-foreground">Email:</span> {order.customerEmail ?? "-"}</p>
                <p><span className="font-semibold text-foreground">Phone:</span> {order.customerPhone ?? "-"}</p>
                {order.deliveryAddressLabel ? <p><span className="font-semibold text-foreground">Address label:</span> {order.deliveryAddressLabel}</p> : null}

                <div className="grid gap-3 pt-2 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-white/75 p-3">
                    <p className="font-semibold text-foreground">Payment</p>
                    <p className="mt-1">Method: {(order.paymentMethod ?? "razorpay").toUpperCase()}</p>
                    <p>Status: {order.transactionStatus ?? "pending"}</p>
                    <p>Txn ID: {order.transactionId ?? "-"}</p>
                    <p>Payment ID: {order.paymentId ?? "-"}</p>
                    <p>Razorpay order: {order.razorpayOrderId ?? "-"}</p>
                    <p>Promo: {order.promoCode ?? "-"}</p>
                    <p>Discount: {typeof order.discountAmount === "number" ? formatCurrency(order.discountAmount) : "-"}</p>
                    <p>Delivery fee: {typeof order.deliveryFee === "number" ? formatCurrency(order.deliveryFee) : "-"}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-white/75 p-3">
                    <p className="font-semibold text-foreground">Shipping</p>
                    <p className="mt-1">Provider: {(order.shippingProvider ?? "delhivery").toUpperCase()}</p>
                    <p>Status: {order.shippingProviderStatus ?? "pending-shipment"}</p>
                    <p>AWB: {order.shippingAwb ?? "-"}</p>
                    <p>Shipment ID: {order.shippingShipmentId ?? "-"}</p>
                    <p>Pickup request: {order.shippingPickupRequestId ?? "-"}</p>
                    <p>Last synced: {order.shippingLastSyncedAt ? formatDateTime(order.shippingLastSyncedAt) : "-"}</p>
                    {order.shippingError ? <p className="text-destructive">Error: {order.shippingError}</p> : null}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-4xl border-white/60 bg-[linear-gradient(135deg,#1f1418_0%,#2e1d23_100%)] text-white">
              <CardContent className="p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#ffc9a6]">Tracking timeline</p>
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

                {order.shippingAwb ? (
                  <Button asChild variant="outline" className="mt-4 border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white">
                    <Link href={`https://www.delhivery.com/track/package/${encodeURIComponent(order.shippingAwb)}`} target="_blank" rel="noopener noreferrer">Track on Delhivery</Link>
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-3xl font-semibold">Order lines</h2>
            {order.items.map((item) => (
              <Card key={item.id} className="glass-panel rounded-4xl border-white/60">
                <CardContent className="space-y-3 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                        <Image src={resolveProductImage(item.productImage)} alt={item.productName} fill className="object-cover" sizes="56px" />
                      </div>
                      <div className="space-y-1 text-sm text-[#5f5047]">
                        <p className="font-semibold text-foreground">{item.productName}</p>
                        <p>Row ID: {item.id}</p>
                        <p>Product ID: {item.productId}</p>
                        <p>Store: {item.storeName ?? item.storeId}</p>
                        <p>Rider: {item.riderName ?? item.riderId ?? "-"}</p>
                      </div>
                    </div>

                    <div className="space-y-1 text-right text-sm text-[#5f5047]">
                      <Badge variant={toStatusBadgeVariant(item.status)}>{statusLabel[item.status]}</Badge>
                      <p className="font-semibold text-primary">{formatCurrency(item.totalAmount)}</p>
                      <p>Qty: {item.quantity}</p>
                      <p>Created: {formatDateTime(item.createdAt)}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 text-sm text-[#5f5047] md:grid-cols-2">
                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">Payment</p>
                      <p>Method: {(item.paymentMethod ?? "razorpay").toUpperCase()}</p>
                      <p>Status: {item.transactionStatus ?? "pending"}</p>
                      <p>Txn ID: {item.transactionId ?? "-"}</p>
                      <p>Payment ID: {item.paymentId ?? "-"}</p>
                      <p>Razorpay order: {item.razorpayOrderId ?? "-"}</p>
                      <p>Promo: {item.promoCode ?? "-"}</p>
                    </div>

                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">Shipping</p>
                      <p>Provider: {(item.shippingProvider ?? "delhivery").toUpperCase()}</p>
                      <p>Status: {item.shippingProviderStatus ?? "pending-shipment"}</p>
                      <p>AWB: {item.shippingAwb ?? "-"}</p>
                      <p>Shipment ID: {item.shippingShipmentId ?? "-"}</p>
                      <p>Pickup request: {item.shippingPickupRequestId ?? "-"}</p>
                      <p>Last synced: {item.shippingLastSyncedAt ? formatDateTime(item.shippingLastSyncedAt) : "-"}</p>
                      {item.shippingError ? <p className="text-destructive">Error: {item.shippingError}</p> : null}
                    </div>
                  </div>

                  {(item.deliveryAddress || item.pickupAddress || item.shippingPackage) ? (
                    <div className="grid gap-3 text-sm text-[#5f5047] md:grid-cols-3">
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                        <p className="font-semibold text-foreground">Delivery address</p>
                        {item.deliveryAddress ? (
                          <>
                            <p>{item.deliveryAddress.receiverName ?? "-"} · {item.deliveryAddress.receiverPhone ?? "-"}</p>
                            <p>{item.deliveryAddress.line1}</p>
                            <p>{item.deliveryAddress.city}, {item.deliveryAddress.state} {item.deliveryAddress.pinCode}</p>
                          </>
                        ) : <p>-</p>}
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                        <p className="font-semibold text-foreground">Pickup address</p>
                        {item.pickupAddress ? (
                          <>
                            <p>{item.pickupAddress.receiverName ?? "-"} · {item.pickupAddress.receiverPhone ?? "-"}</p>
                            <p>{item.pickupAddress.line1}</p>
                            <p>{item.pickupAddress.city}, {item.pickupAddress.state} {item.pickupAddress.pinCode}</p>
                          </>
                        ) : <p>-</p>}
                      </div>
                      <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                        <p className="font-semibold text-foreground">Shipping package</p>
                        {item.shippingPackage ? (
                          <>
                            <p>Qty: {item.shippingPackage.quantity}</p>
                            <p>Weight: {item.shippingPackage.deadWeightKg} kg</p>
                            <p>{item.shippingPackage.lengthCm} x {item.shippingPackage.breadthCm} x {item.shippingPackage.heightCm} cm</p>
                          </>
                        ) : <p>-</p>}
                      </div>
                    </div>
                  ) : null}

                  {item.customization ? <CustomizationBlock customization={item.customization} /> : null}

                  {item.shippingEvents?.length ? (
                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2 text-sm text-[#5f5047]">
                      <p className="font-semibold text-foreground">Shipping events</p>
                      <div className="mt-2 space-y-1.5">
                        {item.shippingEvents.slice(-4).map((event, index) => (
                          <div key={`${item.id}-event-${index}`} className="rounded-md border border-border/60 bg-background/70 px-2 py-1.5">
                            <p className="text-xs font-medium text-foreground">{event.status}</p>
                            <p className="text-xs">{event.description ?? "Status update"}</p>
                            <p className="text-[11px] text-[#74655c]">{formatDateTime(event.timestamp)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </section>

          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <InfoPill icon={PackageCheck} label="Order summary" text="Line-level amounts, shipping, and payment context stay visible together." />
            <InfoPill icon={Truck} label="Delivery status" text="Timeline plus AWB metadata gives clearer shipment visibility." />
            <InfoPill icon={ShieldCheck} label="Customization context" text="All uploaded media and personalization notes remain attached to each line." />
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
      ) : null}
    </OrdersAuthGuard>
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
}: {
  customization: NonNullable<NonNullable<Awaited<ReturnType<typeof getUserOrderDetails>>>["items"][number]["customization"]>;
}) {
  return (
    <div className="rounded-xl border border-[#e4cf9e] bg-[#fffaf0] px-3 py-2 text-sm text-[#5f5047]">
      <p className="font-semibold text-foreground">Customization details</p>
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
        <p className="mt-1 text-xs text-[#74655c]">+{customization.images.length - 5} more image(s)</p>
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
      {customization.description ? <p className="mt-1">{customization.description}</p> : null}
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
