"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { products } from "@/data/products";
import { useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils";

export default function CartPage() {
  const { items, removeItem, updateQty, clear } = useCartStore();

  const mapped = items
    .map((item) => {
      const product = products.find((productItem) => productItem.id === item.productId);
      if (!product) return null;
      return { product, quantity: item.quantity, subtotal: product.price * item.quantity };
    })
    .filter(Boolean) as { product: (typeof products)[number]; quantity: number; subtotal: number }[];

  const subtotal = mapped.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = mapped.length > 0 ? (subtotal > 1999 ? 0 : 199) : 0;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shipping + tax;

  return (
    <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          {mapped.length > 0 && (
            <button onClick={clear} type="button" className="text-sm font-medium text-muted">
              Clear cart
            </button>
          )}
        </div>

        {mapped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white p-10 text-center">
            <h2 className="text-lg font-semibold">Cart is empty</h2>
            <p className="mt-2 text-sm text-muted">Add something special from our premium collections.</p>
            <Link href="/store" className="mt-4 inline-flex rounded-lg bg-foreground px-4 py-2 text-sm font-semibold text-background">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mapped.map(({ product, quantity, subtotal: lineTotal }) => (
              <article key={product.id} className="grid gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-[120px_1fr_auto] sm:items-center">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>

                <div>
                  <p className="text-xs text-muted">{product.category}</p>
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted">{formatCurrency(product.price)} each</p>
                </div>

                <div className="space-y-3">
                  <div className="inline-flex items-center rounded-md border border-border">
                    <button className="px-2 py-1" onClick={() => updateQty(product.id, quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm">{quantity}</span>
                    <button className="px-2 py-1" onClick={() => updateQty(product.id, quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-right text-sm font-semibold">{formatCurrency(lineTotal)}</p>
                  <button onClick={() => removeItem(product.id)} className="ml-auto flex items-center gap-1 text-xs text-muted" type="button">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Order Summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Tax (5%)</dt>
            <dd>{formatCurrency(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        <Link
          href={mapped.length > 0 ? "/checkout" : "/store"}
          className="mt-5 inline-flex w-full justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          {mapped.length > 0 ? "Proceed to checkout" : "Browse products"}
        </Link>
      </aside>
    </div>
  );
}
