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
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-[#24438f] sm:text-3xl">Your Cart</h1>
          {mapped.length > 0 && (
            <button onClick={clear} type="button" className="text-sm font-medium text-[#2f3a5e]/70 hover:text-[#24438f]">
              Clear cart
            </button>
          )}
        </div>

        {mapped.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#e7c7cf] bg-[#fff6f8] p-10 text-center">
            <h2 className="text-lg font-semibold">Cart is empty</h2>
            <p className="mt-2 text-sm text-[#2f3a5e]/80">Add something special from our premium collections.</p>
            <Link href="/store" className="mt-4 inline-flex rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white">
              Start shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {mapped.map(({ product, quantity, subtotal: lineTotal }) => (
              <article key={product.id} className="grid grid-cols-[96px_1fr] gap-3 rounded-2xl border border-[#edd2d9] bg-white p-3 sm:grid-cols-[120px_1fr_auto] sm:gap-4 sm:p-4 sm:items-center">
                <div className="relative aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={product.images[0]}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 96px, 120px"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-xs text-[#2f3a5e]/65">{product.category}</p>
                  <h3 className="font-semibold leading-snug text-[#21212b]">{product.name}</h3>
                  <p className="mt-1 text-sm text-[#2f3a5e]/70">{formatCurrency(product.price)} each</p>
                </div>

                <div className="col-span-2 space-y-3 sm:col-span-1">
                  <div className="inline-flex min-h-10 items-center rounded-md border border-[#edd2d9] bg-[#fff8fb]">
                    <button className="min-h-10 min-w-10 px-2 py-1" onClick={() => updateQty(product.id, quantity - 1)}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm">{quantity}</span>
                    <button className="min-h-10 min-w-10 px-2 py-1" onClick={() => updateQty(product.id, quantity + 1)}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-[#24438f] sm:text-right">{formatCurrency(lineTotal)}</p>
                  <button onClick={() => removeItem(product.id)} className="flex items-center gap-1 text-xs text-[#2f3a5e]/70 sm:ml-auto" type="button">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="h-fit rounded-2xl border border-[#edd2d9] bg-[#fff1f4] p-4 sm:p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-[#24438f]">Order Summary</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Tax (5%)</dt>
            <dd>{formatCurrency(tax)}</dd>
          </div>
          <div className="flex justify-between border-t border-[#edd2d9] pt-3 text-base font-semibold text-[#24438f]">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>

        <Link
          href={mapped.length > 0 ? "/checkout" : "/store"}
          className="mt-5 inline-flex min-h-11 w-full justify-center rounded-lg bg-[#24438f] px-4 py-2.5 text-sm font-semibold text-white"
        >
          {mapped.length > 0 ? "Proceed to checkout" : "Browse products"}
        </Link>
      </aside>
    </div>
  );
}
