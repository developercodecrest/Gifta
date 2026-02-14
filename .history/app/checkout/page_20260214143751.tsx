"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { products } from "@/data/products";
import { useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils";

const checkoutSchema = z.object({
  cardName: z.string().min(2, "Enter card holder name"),
  cardNumber: z.string().min(12, "Enter valid card number"),
  expiry: z.string().min(4, "Enter expiry"),
  cvc: z.string().min(3, "Enter CVC"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const [promoCodeInput, setPromoCodeInput] = useState("");
  const [showGiftCode, setShowGiftCode] = useState(false);

  const mapped = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          if (!product) return null;
          return { product, quantity: item.quantity, subtotal: product.price * item.quantity };
        })
        .filter(Boolean) as { product: (typeof products)[number]; quantity: number; subtotal: number }[],
    [items],
  );

  const subtotal = mapped.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = mapped.length > 0 ? (subtotal > 1999 ? 0 : 199) : 0;
  const tax = Math.round(subtotal * 0.05);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
  });

  const promo = getPromoDetails(promoCodeInput, subtotal);
  const total = Math.max(0, subtotal + shipping + tax - promo.discount);

  const onSubmit = async (values: CheckoutForm) => {
    if (!mapped.length) return;
    const orderId = createOrderId();

    if (typeof window !== "undefined") {
      localStorage.setItem(
        "gifta-last-order",
        JSON.stringify({
          orderId,
          customer: values.cardName,
          total,
          promoCode: promo.code,
          items: mapped.length,
        }),
      );
    }

    clear();
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  if (!mapped.length) {
    return (
      <div className="rounded-2xl border border-dashed border-[#e7c7cf] bg-[#fff6f8] p-10 text-center">
        <h1 className="text-2xl font-bold">Checkout is empty</h1>
        <p className="mt-2 text-sm text-[#2f3a5e]/80">Add products to cart before placing your order.</p>
        <Link href="/store" className="mt-4 inline-flex rounded-lg bg-[#24438f] px-4 py-2 text-sm font-semibold text-white">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl rounded-2xl border border-[#ececec] bg-white px-4 py-6 sm:px-8 sm:py-8">
      <div className="mb-6 text-center">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#b4b4b4]">
          Back to shop  ›  Shopping bag  ›  Checkout  ›  Confirmation
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[#1c1c1c]">Checkout</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] lg:gap-12">
        <section>
          <div className="border-b border-[#ececec] pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9b9b]">Shipping details</h2>
          </div>

          <div className="grid gap-4 py-4 text-sm text-[#3e3e3e] sm:grid-cols-2">
            <div>
              <p className="font-semibold">Daniel Hecker</p>
              <p className="mt-1">Vasagatan 16</p>
              <p>111 20 Stockholm</p>
              <p>Sweden</p>
            </div>
            <div>
              <p className="font-semibold">daniel@bambora.com</p>
            </div>
          </div>

          <div className="mt-2 border-b border-[#ececec] pb-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9b9b]">Payment details</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Field label="Name on card" error={errors.cardName?.message}>
              <input {...register("cardName")} className="min-h-11 w-full rounded-md border border-[#dfdfdf] px-3 text-sm" defaultValue="Daniel Hecker" />
            </Field>

            <Field label="Card number" error={errors.cardNumber?.message}>
              <input
                {...register("cardNumber")}
                className="min-h-11 w-full rounded-md border border-[#dfdfdf] px-3 text-sm"
                placeholder="4534 5555 5555 5555"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Valid through" error={errors.expiry?.message}>
                <input {...register("expiry")} className="min-h-11 w-full rounded-md border border-[#dfdfdf] px-3 text-sm" placeholder="06/19" />
              </Field>
              <Field label="CVC code" error={errors.cvc?.message}>
                <input {...register("cvc")} className="min-h-11 w-full rounded-md border border-[#9ce6dd] px-3 text-sm" placeholder="201" />
              </Field>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 min-h-11 w-full rounded-md bg-[#44c6b8] text-xs font-semibold uppercase tracking-[0.12em] text-white"
            >
              {isSubmitting ? "Placing order..." : `Purchase ${formatCurrency(total)}`}
            </button>
          </form>
        </section>

        <aside>
          <div className="flex items-center justify-between border-b border-[#ececec] pb-3">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9b9b9b]">Your order</h2>
            <Link href="/cart" className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#b1b1b1]">
              Edit shopping bag
            </Link>
          </div>

          <ul className="divide-y divide-[#ececec]">
            {mapped.map((item) => (
              <li key={item.product.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-3 py-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-md border border-[#ececec]">
                  <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" sizes="48px" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#2d2d2d]">{item.product.name}</p>
                  <p className="text-xs text-[#9a9a9a]">{item.product.category}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#333]">{formatCurrency(item.subtotal)}</p>
                  <span className="mt-1 inline-flex min-w-6 items-center justify-center rounded bg-[#f2f2f2] px-1 text-[11px] text-[#777]">
                    {item.quantity}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <dl className="mt-4 space-y-2 border-t border-[#ececec] pt-4 text-sm">
            <div className="flex justify-between">
              <dt className="text-[#666]">Subtotal</dt>
              <dd className="font-semibold text-[#333]">{formatCurrency(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[#666]">Shipping</dt>
              <dd className="font-semibold text-[#333]">{shipping === 0 ? "0" : formatCurrency(shipping)}</dd>
            </div>
            {promo.discount > 0 && (
              <div className="flex justify-between">
                <dt className="text-[#666]">Gift Code</dt>
                <dd className="font-semibold text-[#44a56f]">-{formatCurrency(promo.discount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-[#ececec] pt-2">
              <dt className="text-base font-semibold text-[#333]">Total</dt>
              <dd className="text-base font-bold text-[#333]">{formatCurrency(total)}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowGiftCode((value) => !value)}
              className="min-h-11 w-full rounded-md border border-[#7ed8cf] bg-white text-xs font-semibold uppercase tracking-[0.12em] text-[#44c6b8]"
            >
              Add gift code
            </button>

            {showGiftCode && (
              <div className="mt-3 space-y-2">
                <input
                  value={promoCodeInput}
                  onChange={(event) => setPromoCodeInput(event.target.value)}
                  placeholder="Enter gift code"
                  className="min-h-11 w-full rounded-md border border-[#dfdfdf] px-3 text-sm"
                />
                <p className="text-xs text-[#8f8f8f]">{promo.message}</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function getPromoDetails(rawCode: string | undefined, subtotal: number) {
  const code = (rawCode ?? "").trim().toUpperCase();

  if (!code) {
    return {
      code: "",
      discount: 0,
      message: "Promo codes: GIFT10 (10% off), WELCOME15 (15% off above ₹3000), FREESHIP (₹199 off shipping).",
    };
  }

  if (code === "GIFT10") {
    return {
      code,
      discount: Math.round(subtotal * 0.1),
      message: "GIFT10 applied successfully.",
    };
  }

  if (code === "WELCOME15") {
    if (subtotal < 3000) {
      return {
        code,
        discount: 0,
        message: "WELCOME15 requires subtotal above ₹3000.",
      };
    }
    return {
      code,
      discount: Math.round(subtotal * 0.15),
      message: "WELCOME15 applied successfully.",
    };
  }

  if (code === "FREESHIP") {
    return {
      code,
      discount: 199,
      message: "FREESHIP applied successfully.",
    };
  }

  return {
    code,
    discount: 0,
    message: "Invalid promo code. Try GIFT10, WELCOME15, or FREESHIP.",
  };
}

function createOrderId() {
  return `GFT-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
}

function Field({
  label,
  children,
  error,
  className,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.12em] text-[#a0a0a0]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
