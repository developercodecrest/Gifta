"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { products } from "@/data/products";
import { useCartStore } from "@/features/cart/store";
import { formatCurrency } from "@/lib/utils";

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(10, "Enter valid phone number"),
  address: z.string().min(8, "Enter complete address"),
  city: z.string().min(2, "Enter city"),
  pinCode: z.string().min(6, "Enter valid pin code"),
  payment: z.enum(["card", "upi", "cod"]),
  giftNote: z.string().max(150).optional(),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clear } = useCartStore();
  const [promoCodeInput, setPromoCodeInput] = useState("");

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
    defaultValues: {
      payment: "card",
    },
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
          customer: values.fullName,
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
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[2fr_1fr]">
      <section className="rounded-2xl border border-[#edd2d9] bg-white p-4 sm:p-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#24438f] sm:text-3xl">Secure Checkout</h1>
        <p className="mt-2 text-sm text-[#2f3a5e]/80">Complete your order details and place your gift in minutes.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full Name" error={errors.fullName?.message}>
              <input {...register("fullName")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
            </Field>
            <Field label="Email" error={errors.email?.message}>
              <input {...register("email")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
            </Field>
            <Field label="Phone" error={errors.phone?.message}>
              <input {...register("phone")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
            </Field>
            <Field label="City" error={errors.city?.message}>
              <input {...register("city")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
            </Field>
            <Field label="Address" error={errors.address?.message} className="sm:col-span-2">
              <textarea {...register("address")} className="w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" rows={3} />
            </Field>
            <Field label="Pin Code" error={errors.pinCode?.message}>
              <input {...register("pinCode")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm" />
            </Field>
            <Field label="Promo Code">
              <input
                value={promoCodeInput}
                onChange={(event) => setPromoCodeInput(event.target.value)}
                placeholder="Try GIFT10, WELCOME15, FREESHIP"
                className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm"
              />
            </Field>
          </div>

          <Field label="Gift Note" error={errors.giftNote?.message}>
            <textarea
              {...register("giftNote")}
              rows={3}
              placeholder="Optional note for recipient"
              className="w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm"
            />
          </Field>

          <Field label="Payment Method" error={errors.payment?.message}>
            <select {...register("payment")} className="min-h-11 w-full rounded-lg border border-[#edd2d9] px-3 py-2 text-sm">
              <option value="card">Credit / Debit Card (mock)</option>
              <option value="upi">UPI (mock)</option>
              <option value="cod">Cash on Delivery</option>
            </select>
          </Field>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 w-full rounded-lg bg-[#24438f] px-4 py-3 text-sm font-semibold text-white"
          >
            {isSubmitting ? "Placing order..." : `Place order · ${formatCurrency(total)}`}
          </button>
        </form>
      </section>

      <aside className="h-fit rounded-2xl border border-[#edd2d9] bg-[#fff1f4] p-4 sm:p-5 lg:sticky lg:top-24">
        <h2 className="text-lg font-semibold text-[#24438f]">Order Summary</h2>
        <ul className="mt-4 space-y-2 text-sm">
          {mapped.map((item) => (
            <li key={item.product.id} className="flex justify-between gap-2">
              <span className="max-w-[70%] text-[#2f3a5e]/80">
                {item.product.name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 space-y-2 border-t border-[#edd2d9] pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Subtotal</dt>
            <dd>{formatCurrency(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Shipping</dt>
            <dd>{shipping === 0 ? "Free" : formatCurrency(shipping)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#2f3a5e]/70">Tax</dt>
            <dd>{formatCurrency(tax)}</dd>
          </div>
          {promo.discount > 0 && (
            <div className="flex justify-between text-green-700">
              <dt>Discount ({promo.code})</dt>
              <dd>-{formatCurrency(promo.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between text-base font-semibold text-[#24438f]">
            <dt>Total</dt>
            <dd>{formatCurrency(total)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-xs text-[#2f3a5e]/70">{promo.message}</p>
      </aside>
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
      <label className="mb-1 block text-sm font-medium text-[#2f3a5e]">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
