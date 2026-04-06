import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAdminOrderDetailsScoped } from "@/lib/server/ecommerce-service";
import { formatCurrency } from "@/lib/utils";

export default async function AdminOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const identity = await ensureAdminAccess("orders");
  const { id } = await params;

  const details = await getAdminOrderDetailsScoped({
    orderId: id,
    scope: identity,
  }).catch((error) => {
    if (error instanceof Error && (error.message === "ORDER_NOT_FOUND" || error.message === "FORBIDDEN_ORDER_SCOPE")) {
      return null;
    }
    throw error;
  });

  if (!details) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Order details"
        title={details.orderRef}
        description="Complete order context across customer, payment, shipping, and customization details."
        actions={(
          <Button asChild variant="outline">
            <Link href="/admin/orders">Back to orders</Link>
          </Button>
        )}
        stats={[
          { label: "Status", value: details.status, tone: "warm" },
          { label: "Line items", value: String(details.lineCount), tone: "mint" },
          { label: "Units", value: String(details.itemCount), tone: "sun" },
          { label: "Total", value: formatCurrency(details.totalAmount), tone: "warm" },
        ]}
      />

      <AdminSection title="Customer" description="User profile and order contact snapshot matched by user ID.">
        <Card className="border-border/70 bg-background/80">
          <CardContent className="space-y-3 p-4 text-sm text-[#5f5047]">
            <p><span className="font-semibold text-foreground">Name:</span> {details.customer.name ?? "-"}</p>
            <p><span className="font-semibold text-foreground">Email:</span> {details.customer.email ?? "-"}</p>
            <p><span className="font-semibold text-foreground">Phone:</span> {details.customer.phone ?? "-"}</p>
            <p><span className="font-semibold text-foreground">User ID:</span> {details.customer.userId ?? "-"}</p>
            <p><span className="font-semibold text-foreground">User ObjectId:</span> {details.customer.userObjectId ?? "-"}</p>

            {details.customer.profile?.addresses?.length ? (
              <div className="space-y-2 border-t border-border/60 pt-3">
                <p className="font-semibold text-foreground">Saved addresses</p>
                <div className="grid gap-2 md:grid-cols-2">
                  {details.customer.profile.addresses.map((address) => (
                    <div key={`${address.label}-${address.line1}`} className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-medium text-foreground">{address.label}</p>
                      <p>{address.receiverName} · {address.receiverPhone}</p>
                      <p>{address.line1}</p>
                      <p>{address.city}, {address.state} {address.pinCode}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </AdminSection>

      <AdminSection title="Order lines" description="All rows under this order reference including shipping, payment, and customization metadata.">
        <div className="space-y-3">
          {details.lines.map((line) => (
            <Card key={line.id} className="border-border/70 bg-background/80">
              <CardContent className="space-y-3 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border/70 bg-muted/20">
                      {line.productImage ? (
                        <Image src={line.productImage} alt={line.productName} fill className="object-cover" sizes="56px" />
                      ) : null}
                    </div>
                    <div className="space-y-1 text-sm text-[#5f5047]">
                      <p className="font-semibold text-foreground">{line.productName}</p>
                      <p>Row ID: {line.id}</p>
                      <p>Product ID: {line.productId}</p>
                      <p>Product ObjectId: {line.productObjectId ?? "-"}</p>
                      <p>Store: {line.storeName ?? line.storeId}</p>
                      <p>Store ObjectId: {line.storeObjectId ?? "-"}</p>
                    </div>
                  </div>

                  <div className="space-y-1 text-right text-sm text-[#5f5047]">
                    <Badge variant="secondary">{line.status}</Badge>
                    <p className="font-semibold text-foreground">{formatCurrency(line.totalAmount)}</p>
                    <p>Qty: {line.quantity}</p>
                    <p>Created: {new Date(line.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid gap-3 text-sm text-[#5f5047] md:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="font-semibold text-foreground">Payment</p>
                    <p>Method: {(line.paymentMethod ?? "razorpay").toUpperCase()}</p>
                    <p>Status: {line.transactionStatus ?? "pending"}</p>
                    <p>Txn ID: {line.transactionId ?? "-"}</p>
                    <p>Payment ID: {line.paymentId ?? "-"}</p>
                    <p>Razorpay Order: {line.razorpayOrderId ?? "-"}</p>
                    <p>Promo: {line.promoCode ?? "-"}</p>
                    <p>Discount: {typeof line.discountAmount === "number" ? formatCurrency(line.discountAmount) : "-"}</p>
                    <p>Delivery fee: {typeof line.deliveryFee === "number" ? formatCurrency(line.deliveryFee) : "-"}</p>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                    <p className="font-semibold text-foreground">Shipping</p>
                    <p>Provider: {(line.shippingProvider ?? "delhivery").toUpperCase()}</p>
                    <p>Status: {line.shippingProviderStatus ?? "pending"}</p>
                    <p>AWB: {line.shippingAwb ?? "-"}</p>
                    <p>Shipment ID: {line.shippingShipmentId ?? "-"}</p>
                    <p>Pickup Request: {line.shippingPickupRequestId ?? "-"}</p>
                    <p>Rider: {line.riderName ?? line.riderId ?? "-"}</p>
                    <p>Last synced: {line.shippingLastSyncedAt ? new Date(line.shippingLastSyncedAt).toLocaleString() : "-"}</p>
                    {line.shippingError ? <p className="text-destructive">Error: {line.shippingError}</p> : null}
                  </div>
                </div>

                {(line.deliveryAddress || line.pickupAddress || line.shippingPackage) ? (
                  <div className="grid gap-3 text-sm text-[#5f5047] md:grid-cols-3">
                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">Delivery address</p>
                      {line.deliveryAddress ? (
                        <>
                          <p>{line.deliveryAddress.receiverName ?? "-"} · {line.deliveryAddress.receiverPhone ?? "-"}</p>
                          <p>{line.deliveryAddress.line1}</p>
                          <p>{line.deliveryAddress.city}, {line.deliveryAddress.state} {line.deliveryAddress.pinCode}</p>
                        </>
                      ) : <p>-</p>}
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">Pickup address</p>
                      {line.pickupAddress ? (
                        <>
                          <p>{line.pickupAddress.receiverName ?? "-"} · {line.pickupAddress.receiverPhone ?? "-"}</p>
                          <p>{line.pickupAddress.line1}</p>
                          <p>{line.pickupAddress.city}, {line.pickupAddress.state} {line.pickupAddress.pinCode}</p>
                        </>
                      ) : <p>-</p>}
                    </div>
                    <div className="rounded-xl border border-border/70 bg-card px-3 py-2">
                      <p className="font-semibold text-foreground">Shipping package</p>
                      {line.shippingPackage ? (
                        <>
                          <p>Qty: {line.shippingPackage.quantity}</p>
                          <p>Weight: {line.shippingPackage.deadWeightKg} kg</p>
                          <p>{line.shippingPackage.lengthCm} x {line.shippingPackage.breadthCm} x {line.shippingPackage.heightCm} cm</p>
                        </>
                      ) : <p>-</p>}
                    </div>
                  </div>
                ) : null}

                {line.customization ? (
                  <div className="rounded-xl border border-[#e4cf9e] bg-[#fffaf0] px-3 py-2 text-sm text-[#5f5047]">
                    <p className="font-semibold text-foreground">Customization details</p>
                    {line.customization.images?.length ? (
                      <div className="mt-2 grid grid-cols-5 gap-1.5">
                        {line.customization.images.slice(0, 5).map((imageUrl, index) => (
                          <div key={`${line.id}-custom-${index}`} className="aspect-square overflow-hidden rounded-md border border-[#ead7cb] bg-white">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imageUrl} alt={`Customization ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    ) : null}
                    {line.customization.images && line.customization.images.length > 5 ? (
                      <p className="mt-1 text-xs text-[#74655c]">+{line.customization.images.length - 5} more image(s)</p>
                    ) : null}
                    {line.customization.whatsappNumber ? <p className="mt-1">WhatsApp: {line.customization.whatsappNumber}</p> : null}
                    {line.customization.description ? <p className="mt-1">{line.customization.description}</p> : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminSection>
    </div>
  );
}
