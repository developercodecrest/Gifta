"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Gift, Loader2, Minus, Plus, ShieldCheck, Sparkles, Store, Trash2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCartStore } from "@/features/cart/store";
import { resolveProductImage } from "@/lib/product-image";
import { CartSnapshot } from "@/lib/server/cart-service";
import { formatCurrency } from "@/lib/utils";

export function CartPageClient({ snapshot }: { snapshot: CartSnapshot }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { status } = useSession();
  const { items, hydrateFromCookie, removeItem, updateQty, setOffer, setItems, clear } = useCartStore();
  const [dismissedCheckoutReadyNotice, setDismissedCheckoutReadyNotice] = useState(false);
  const [proceedingCheckout, setProceedingCheckout] = useState(false);
  const [localCartReady, setLocalCartReady] = useState(false);
  const [removingLineKey, setRemovingLineKey] = useState<string | null>(null);
  const checkoutReadyParam = searchParams.get("checkoutReady");

  useEffect(() => {
    if (status === "loading" || localCartReady) {
      return;
    }

    if (status === "authenticated") {
      setItems(
        snapshot.lines.map((line) => ({
          productId: line.product.id,
          quantity: line.quantity,
          offerId: line.selectedOffer?.id,
          variantId: line.selectedVariant?.id,
          variantOptions: line.selectedVariant?.options,
          customization: line.customization,
          customizationSignature: line.customizationSignature,
        })),
      );
    } else {
      hydrateFromCookie();
    }

    setLocalCartReady(true);
  }, [hydrateFromCookie, localCartReady, setItems, snapshot.lines, status]);

  const keyOf = (productId: string, variantId?: string, customizationSignature?: string) =>
    `${productId}::${variantId ?? "default"}::${customizationSignature ?? "base"}`;
  const quantityById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId, entry.customizationSignature), entry.quantity]));
  const offerById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId, entry.customizationSignature), entry.offerId]));
  const variantById = new Map(items.map((entry) => [keyOf(entry.productId, entry.variantId, entry.customizationSignature), entry.variantId]));

  const liveLines = snapshot.lines.map((line) => {
    const lineKey = keyOf(line.product.id, line.selectedVariant?.id, line.customizationSignature);
    const hasLocalLine = quantityById.has(lineKey);

    if (localCartReady && !hasLocalLine) {
      return null;
    }

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
  }).filter((line): line is NonNullable<typeof line> => Boolean(line));

  useEffect(() => {
    if (!removingLineKey) {
      return;
    }

    const stillPresent = liveLines.some(
      (line) => keyOf(line.product.id, line.selectedVariant?.id, line.customizationSignature) === removingLineKey,
    );

    if (!stillPresent) {
      setRemovingLineKey(null);
    }
  }, [liveLines, removingLineKey]);

  const grouped = new Map<string, { name: string; items: typeof liveLines }>();

  for (const line of liveLines) {
    const key = line.selectedOffer?.storeId ?? "direct";
    const name = line.selectedOffer?.store?.name ?? "Gifta Marketplace";
    const bucket = grouped.get(key) ?? { name, items: [] };
    bucket.items.push(line);
    grouped.set(key, bucket);
  }

  const vendorRows = Array.from(grouped.entries()).map(([storeId, value]) => {
    const subtotal = value.items.reduce((total, item) => total + item.lineSubtotal, 0);
    return { storeId, ...value, subtotal };
  });

  const subtotal = liveLines.reduce((total, line) => total + line.lineSubtotal, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  const hasItems = liveLines.length > 0;
  const showCheckoutReadyNotice = status === "authenticated" && checkoutReadyParam === "1" && !dismissedCheckoutReadyNotice;
  const signInCheckoutHref = "/auth/sign-in?callbackUrl=%2Fcart%3FcheckoutReady%3D1";

  const checkoutCartPayload = liveLines.map((line) => ({
    productId: line.product.id,
    quantity: line.quantity,
    offerId: line.selectedOffer?.id,
    variantId: line.selectedVariant?.id,
    variantOptions: line.selectedVariant?.options,
    customization: line.customization,
    customizationSignature: line.customizationSignature,
  }));

  const proceedToCheckout = async () => {
    if (!hasItems || status !== "authenticated") {
      router.push(signInCheckoutHref);
      return;
    }

    setProceedingCheckout(true);
    try {
      await fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: checkoutCartPayload }),
      });
    } catch {
      // Best-effort cart flush before checkout navigation.
    } finally {
      setProceedingCheckout(false);
      router.push("/checkout");
    }
  };

  return (
    <div className="space-y-6">
      {showCheckoutReadyNotice ? (
        <Card className="rounded-3xl border border-[#e9d3a6] bg-[#fff9ef]">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <p className="text-sm text-[#5f5047]">Signed in successfully. Continue to checkout.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setDismissedCheckoutReadyNotice(true);
                const nextParams = new URLSearchParams(searchParams.toString());
                nextParams.delete("checkoutReady");
                const nextPath = nextParams.toString() ? `${pathname}?${nextParams.toString()}` : pathname;
                router.replace(nextPath, { scroll: false });
              }}
            >
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}

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
              const lineKey = keyOf(line.product.id, line.selectedVariant?.id, line.customizationSignature);
              const removing = removingLineKey === lineKey;

              return (
              <Card key={`${line.product.id}-${line.selectedVariant?.id ?? "default"}-${line.customizationSignature ?? "base"}`} className="glass-panel rounded-4xl border-white/60">
                <CardContent className="grid grid-cols-[96px_1fr] gap-3 p-3 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:gap-5 sm:p-5 sm:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-3xl bg-[#fff2e8]">
                    <Image
                      src={resolveProductImage(line.product.images[0])}
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

                    {line.customization ? (
                      <div className="rounded-xl border border-[#e4cf9e] bg-[#fffaf0] px-3 py-2 text-xs text-[#5f5047]">
                        <p className="font-medium text-[#3c2a25]">Customized item</p>
                        {line.customization.images?.length ? (
                          <div className="mt-2 grid grid-cols-5 gap-1.5">
                            {line.customization.images.slice(0, 5).map((imageUrl, index) => (
                              <div key={`${line.product.id}-${line.customizationSignature ?? "custom"}-${index}`} className="aspect-square overflow-hidden rounded-md border border-[#ead7cb] bg-white">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={imageUrl} alt={`Customization ${index + 1}`} className="h-full w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        ) : null}
                        {line.customization.images && line.customization.images.length > 5 ? (
                          <p className="mt-1 text-[11px] text-[#74655c]">+{line.customization.images.length - 5} more image(s)</p>
                        ) : null}
                        {line.customization.giftWrap || line.customization.giftCard || line.customization.giftMessage || line.customization.approvalByEmail ? (
                          <p className="mt-1">
                            {line.customization.giftWrap ? "Gift Wrap" : null}
                            {line.customization.giftWrap && line.customization.giftCard ? " • " : null}
                            {line.customization.giftCard ? "Gift Card" : null}
                            {(line.customization.giftWrap || line.customization.giftCard) && line.customization.giftMessage ? " • " : null}
                            {line.customization.giftMessage ? "Gift Message" : null}
                            {(line.customization.giftWrap || line.customization.giftCard || line.customization.giftMessage) && line.customization.approvalByEmail ? " • " : null}
                            {line.customization.approvalByEmail ? "Approval by email" : null}
                          </p>
                        ) : null}
                        {line.customization.whatsappNumber ? <p>WhatsApp: {line.customization.whatsappNumber}</p> : null}
                        {line.customization.description ? <p className="line-clamp-2">{line.customization.description}</p> : null}
                      </div>
                    ) : null}

                    {line.selectedVariant ? (
                      <p className="text-sm text-[#5f5047]">{formatCurrency(line.selectedVariant.salePrice)} each</p>
                    ) : line.offers.length > 0 ? (
                      <select
                        className="app-input-surface min-h-11 w-full rounded-full px-3 py-2 text-sm"
                        value={line.selectedOffer?.id ?? ""}
                        onChange={(event) =>
                          setOffer(
                            line.product.id,
                            event.target.value || undefined,
                            line.selectedVariant?.id,
                            line.customizationSignature,
                          )
                        }
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

                  </div>

                  <div className="col-span-2 flex flex-col space-y-3 sm:col-span-1 sm:items-end">
                    <div className="inline-flex min-h-11 items-center rounded-full border border-border/70 bg-background/90 px-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQty(
                            line.product.id,
                            line.quantity - 1,
                            minQty,
                            maxQty,
                            line.selectedVariant?.id,
                            line.customizationSignature,
                          )
                        }
                        disabled={line.quantity <= minQty}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="px-3 text-sm">{line.quantity}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          updateQty(
                            line.product.id,
                            line.quantity + 1,
                            minQty,
                            maxQty,
                            line.selectedVariant?.id,
                            line.customizationSignature,
                          )
                        }
                        disabled={line.quantity >= maxQty}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-[#74655c] sm:text-right">Min {minQty} • Max {maxQty}</p>
                    <p className="text-sm font-semibold text-primary sm:text-right">{formatCurrency(line.lineSubtotal)}</p>
                    <Button
                      onClick={() => {
                        setRemovingLineKey(lineKey);
                        removeItem(line.product.id, line.selectedVariant?.id, line.customizationSignature);
                      }}
                      variant="outline"
                      size="sm"
                      className="gap-1 sm:ml-auto"
                      type="button"
                      disabled={removing}
                    >
                      {removing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      {removing ? "Removing..." : "Remove"}
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
                    <p className="flex items-center gap-2 text-[#5f5047]"><Truck className="h-3.5 w-3.5" />Delivery fee will be calculated at checkout by pincode.</p>
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
                <p className="mt-1 text-sm text-[#5f5047]">Delivery fee is now calculated by pincode at checkout.</p>
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
                <dd>Calculated at checkout</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-[#5f5047]">Tax (5%)</dt>
                <dd>{formatCurrency(tax)}</dd>
              </div>
              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatCurrency(total)}</dd>
              </div>
            </dl>

            {hasItems ? (
              status === "authenticated" ? (
                <Button className="w-full" disabled={proceedingCheckout} onClick={() => void proceedToCheckout()}>
                  {proceedingCheckout ? "Syncing cart..." : "Proceed to checkout"}
                </Button>
              ) : (
                <Button asChild className="w-full">
                  <Link href={signInCheckoutHref}>Proceed to checkout</Link>
                </Button>
              )
            ) : (
              <Button asChild className="w-full">
                <Link href="/store">Browse products</Link>
              </Button>
            )}
          </CardContent>
        </Card>
        </aside>
      </div>
    </div>
  );
}
