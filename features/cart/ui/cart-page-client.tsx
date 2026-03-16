"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { Gift, Minus, Plus, ShieldCheck, Sparkles, Store, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/features/cart/store";
import { CartSnapshot } from "@/lib/server/cart-service";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient({ snapshot }: { snapshot: CartSnapshot }) {
  const { status } = useSession();
  const { items, hydrateFromCookie, removeItem, updateQty, setOffer, setVariant, clear } = useCartStore();

  useEffect(() => {
    if (status !== "authenticated") {
      hydrateFromCookie();
    }
  }, [hydrateFromCookie, status]);

  const keyOf = (productId: string, variantId?: string) => `${productId}::${variantId ?? "default"}`;
  const quantityById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId), entry.quantity]));
  const offerById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId), entry.offerId]));
  const variantById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId), entry.variantId]));

  const liveLines = snapshot.lines.map((line) => {
    const lineKey = keyOf(line.product.id, line.selectedVariant?.id);
    const liveQty = quantityById.get(lineKey) ?? line.quantity;
    const selectedOffer =
      line.offers.find((offer) => offer.id === offerById.get(lineKey)) ?? line.selectedOffer;
    const selectedVariant =
      line.product.variants?.find((variant) => variant.id === variantById.get(lineKey)) ?? line.selectedVariant;
    const unitPrice = selectedVariant?.salePrice ?? selectedOffer?.price ?? line.product.price;
    const variantLabel = selectedVariant
      ? Object.entries(selectedVariant.options)
          .map(([name, value]) => `${name}: ${value}`)
          .join(" | ")
      : line.variantLabel;

    return {
      ...line,
      quantity: liveQty,
      selectedOffer,
      selectedVariant,
      variantLabel,
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
    <div className="space-y-6">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 sm:p-8 lg:p-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Multi-vendor cart</p>
            <h1 className="font-display mt-3 text-4xl font-semibold leading-tight sm:text-5xl">A cleaner cart with bigger product blocks and a stronger order summary</h1>
            <p className="mt-3 max-w-2xl text-sm text-[#5f5047] sm:text-base">The cart now uses wider cards, calmer spacing, and clearer vendor grouping before checkout.</p>
          </div>
          {hasItems ? (
            <Button onClick={clear} type="button" variant="outline">
              Clear cart
            </Button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
        <section className="space-y-4">

          {!hasItems ? (
          <Card className="rounded-4xl border-dashed border-[#e5c9bb] bg-white/78 text-slate-950">
            <CardContent className="p-10 text-center">
              <Gift className="mx-auto h-10 w-10 text-primary" />
              <h2 className="font-display mt-4 text-3xl font-semibold">Cart is empty</h2>
              <p className="mt-2 text-sm text-[#5f5047]">Add gifts from multiple vendors and compare live offers.</p>
              <Button asChild className="mt-5">
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
              <Card key={`${line.product.id}-${line.selectedVariant?.id ?? "default"}`} className="glass-panel rounded-4xl border-white/60">
                <CardContent className="grid grid-cols-[96px_1fr] gap-3 p-3 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5 sm:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#fff2e8]">
                    <Image
                      src={line.product.images[0]}
                      alt={line.product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 96px, 120px"
                    />
                  </div>

                  <div className="min-w-0 space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#74655c]">{line.product.category}</p>
                    <h3 className="text-lg font-semibold leading-snug">{line.product.name}</h3>

                    {line.selectedVariant ? (
                      <p className="text-sm text-[#5f5047]">Variant: {line.variantLabel}</p>
                    ) : null}

                    {line.selectedVariant ? (
                      <p className="text-sm text-[#5f5047]">{formatCurrency(line.selectedVariant.salePrice)} each</p>
                    ) : line.offers.length > 0 ? (
                      <select
                        className="app-input-surface min-h-11 w-full rounded-full px-3 py-2 text-sm"
                        value={line.selectedOffer?.id ?? ""}
                        onChange={(event) => setOffer(line.product.id, event.target.value || undefined, line.selectedVariant?.id)}
                      >
                        {line.offers.map((offer) => (
                          <option key={offer.id} value={offer.id}>
                            {offer.store?.name ?? "Vendor"} • {formatCurrency(offer.price)} • ETA {offer.deliveryEtaHours}h
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-sm text-[#5f5047]">{formatCurrency(line.product.price)} each</p>
                    )}

                    {(line.product.variants?.length ?? 0) > 0 ? (
                      <select
                        className="app-input-surface min-h-11 w-full rounded-full px-3 py-2 text-sm"
                        value={line.selectedVariant?.id ?? ""}
                        onChange={(event) => {
                          const nextVariant = line.product.variants?.find((variant) => variant.id === event.target.value);
                          setVariant(line.product.id, nextVariant?.id, nextVariant?.options, line.selectedVariant?.id);
                        }}
                      >
                        {(line.product.variants ?? []).map((variant) => {
                          const optionLabel = Object.entries(variant.options)
                            .map(([name, value]) => `${name}: ${value}`)
                            .join(" | ");
                          return (
                            <option key={variant.id} value={variant.id}>
                              {optionLabel} • {formatCurrency(variant.salePrice)}
                            </option>
                          );
                        })}
                      </select>
                    ) : null}
                  </div>

                  <div className="col-span-2 flex flex-col space-y-3 sm:col-span-1 sm:items-end">
                    <div className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background/90 px-1">
                      <Button variant="ghost" size="icon" onClick={() => updateQty(line.product.id, line.quantity - 1, minQty, maxQty, line.selectedVariant?.id)} disabled={line.quantity <= minQty}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">{line.quantity}</span>
                      <Button variant="ghost" size="icon" onClick={() => updateQty(line.product.id, line.quantity + 1, minQty, maxQty, line.selectedVariant?.id)} disabled={line.quantity >= maxQty}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-[#74655c] sm:text-right">Min {minQty} • Max {maxQty}</p>
                    <p className="text-sm font-semibold text-primary sm:text-right">{formatCurrency(line.lineSubtotal)}</p>
                    <Button
                      onClick={() => removeItem(line.product.id, line.selectedVariant?.id)}
                      variant="outline"
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
        <Card className="h-fit rounded-4xl border-white/60 bg-[linear-gradient(180deg,#fffaf5_0%,#fff4ed_100%)] lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle className="font-display text-3xl">Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {vendorRows.length > 0 ? (
              <div className="app-data-panel space-y-3 rounded-3xl p-4">
                {vendorRows.map((vendor) => (
                  <div key={vendor.storeId} className="space-y-1 text-sm">
                    <p className="flex items-center gap-2 font-medium"><Store className="h-3.5 w-3.5" />{vendor.name}</p>
                    <p className="text-[#5f5047]">Subtotal {formatCurrency(vendor.subtotal)}</p>
                    <p className="flex items-center gap-2 text-[#5f5047]"><Truck className="h-3.5 w-3.5" />Shipping {vendor.shipping === 0 ? "Free" : formatCurrency(vendor.shipping)}</p>
                  </div>
                ))}
              </div>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <div className="rounded-3xl border border-white/70 bg-white/75 p-4">
                <Sparkles className="h-4 w-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Premium presentation</p>
                <p className="mt-1 text-sm text-[#5f5047]">Cleaner review before payment.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-4">
                <Truck className="h-4 w-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Shipping visibility</p>
                <p className="mt-1 text-sm text-[#5f5047]">Vendor-level freight remains visible.</p>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/75 p-4">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="mt-3 text-sm font-semibold">Checkout ready</p>
                <p className="mt-1 text-sm text-[#5f5047]">Proceed with a calmer summary state.</p>
              </div>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#5f5047]">Subtotal</dt>
                <dd>{formatCurrency(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5f5047]">Shipping</dt>
                <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5f5047]">Tax (5%)</dt>
                <dd>{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5f5047]">Platform fee</dt>
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
    </div>
  );
}
