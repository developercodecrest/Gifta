"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Minus, Plus, Store, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/features/cart/store";
import { CartSnapshot } from "@/lib/server/cart-service";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient({ snapshot }: { snapshot: CartSnapshot }) {
  const { status } = useSession();
  const { items, hydrateFromCookie, removeItem, updateQty, setOffer, clear } = useCartStore();

  useEffect(() => {
    if (status !== "authenticated") {
      hydrateFromCookie();
    }
  }, [hydrateFromCookie, status]);

  const quantityById = new Map(items.map((entry) => [entry.productId, entry.quantity]));
  const offerById = new Map(items.map((entry) => [entry.productId, entry.offerId]));

  const liveLines = snapshot.lines.map((line) => {
    const liveQty = quantityById.get(line.product.id) ?? line.quantity;
    const selectedOffer =
      line.offers.find((offer) => offer.id === offerById.get(line.product.id)) ?? line.selectedOffer;
    const unitPrice = selectedOffer?.price ?? line.product.price;

    return {
      ...line,
      quantity: liveQty,
      selectedOffer,
      lineSubtotal: unitPrice * liveQty,
    };
  });

  const grouped = new Map<string, { name: string; items: typeof liveLines; shipping: number }>();

  for (const line of liveLines) {
    const key = line.selectedOffer?.storeId ?? "direct";
    const name = line.selectedOffer?.store?.name ?? "Gifta Marketplace";
    const bucket = grouped.get(key) ?? { name, items: [], shipping: 0 };
    bucket.items.push(line);
    grouped.set(key, bucket);
  }

  const vendorRows = Array.from(grouped.entries()).map(([storeId, value]) => {
    const subtotal = value.items.reduce((total, item) => total + item.lineSubtotal, 0);
    const shipping = subtotal >= 1500 ? 0 : 99;
    return { storeId, ...value, subtotal, shipping };
  });

  const subtotal = liveLines.reduce((total, line) => total + line.lineSubtotal, 0);
  const shipping = vendorRows.reduce((total, row) => total + row.shipping, 0);
  const tax = Math.round(subtotal * 0.05);
  const platformFee = subtotal > 0 && subtotal < 1000 ? 29 : 0;
  const total = subtotal + shipping + tax + platformFee;

  const hasItems = liveLines.length > 0;

  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your multi-vendor cart</h1>
          {hasItems ? (
            <Button onClick={clear} type="button" variant="ghost" size="sm">
              Clear cart
            </Button>
          ) : null}
        </div>

        {!hasItems ? (
          <Card className="border-dashed">
            <CardContent className="p-10 text-center">
              <h2 className="text-lg font-semibold">Cart is empty</h2>
              <p className="mt-2 text-sm text-muted-foreground">Add gifts from multiple vendors and compare live offers.</p>
              <Button asChild className="mt-4">
                <Link href="/store">Start shopping</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {liveLines.map((line) => {
              const minQty = line.product.minOrderQty ?? 1;
              const maxQty = line.product.maxOrderQty ?? 10;

              return (
              <Card key={line.product.id}>
                <CardContent className="grid grid-cols-[96px_1fr] gap-3 p-3 sm:grid-cols-[120px_1fr_auto] sm:gap-4 sm:p-4 sm:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <Image
                      src={line.product.images[0]}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, 120px"
                    />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <p className="text-xs text-muted-foreground">{line.product.category}</p>
                    <h3 className="font-semibold leading-snug">{line.product.name}</h3>

                    {line.offers.length > 0 ? (
                      <select
                        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                        value={line.selectedOffer?.id ?? ""}
                        onChange={(event) => setOffer(line.product.id, event.target.value || undefined)}
                      >
                        {line.offers.map((offer) => (
                          <option key={offer.id} value={offer.id}>
                            {offer.store?.name ?? "Vendor"} • {formatCurrency(offer.price)} • ETA {offer.deliveryEtaHours}h
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-muted-foreground">{formatCurrency(line.product.price)} each</p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-3 sm:col-span-1">
                    <div className="inline-flex min-h-10 items-center rounded-md border border-border bg-card">
                      <Button variant="ghost" size="icon" onClick={() => updateQty(line.product.id, line.quantity - 1, minQty, maxQty)} disabled={line.quantity <= minQty}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">{line.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => updateQty(line.product.id, line.quantity + 1, minQty, maxQty)} disabled={line.quantity >= maxQty}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground sm:text-right">Min {minQty} • Max {maxQty}</p>
                    <p className="text-sm font-semibold text-primary sm:text-right">{formatCurrency(line.lineSubtotal)}</p>
                    <Button
                      onClick={() => removeItem(line.product.id)}
                      variant="ghost"
                      size="sm"
                      className="gap-1 sm:ml-auto"
                      type="button"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
              );
            })}
          </div>
        )}
      </section>

      <aside>
        <Card className="h-fit lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendorRows.length > 0 ? (
              <div className="space-y-3 rounded-lg border border-border p-3">
                {vendorRows.map((vendor) => (
                  <div key={vendor.storeId} className="space-y-1 text-sm">
                    <p className="flex items-center gap-2 font-medium"><Store className="h-3.5 w-3.5" />{vendor.name}</p>
                    <p className="text-muted-foreground">Subtotal {formatCurrency(vendor.subtotal)}</p>
                    <p className="flex items-center gap-2 text-muted-foreground"><Truck className="h-3.5 w-3.5" />Shipping {vendor.shipping === 0 ? "Free" : formatCurrency(vendor.shipping)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Tax (5%)</dt>
                <dd>{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Platform fee</dt>
                <dd>{platformFee === 0 ? "Free" : formatCurrency(platformFee)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>

            <Button asChild className="w-full" disabled={!hasItems}>
              <Link href={hasItems ? "/checkout" : "/store"}>{hasItems ? "Proceed to checkout" : "Browse products"}</Link>
            </Button>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
