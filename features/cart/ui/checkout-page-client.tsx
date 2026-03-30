"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { CreditCard, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/features/cart/store";
import { CartSnapshot } from "@/lib/server/cart-service";
import { formatCurrency } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const checkoutSchema = z.object({
  fullName: z.string().min(2, "Enter full name"),
  email: z.string().email("Enter valid email"),
  phone: z.string().min(10, "Enter phone number"),
  line1: z.string().min(4, "Enter street address"),
  city: z.string().min(2, "Enter city"),
  state: z.string().min(2, "Enter state"),
  pinCode: z.string().min(4, "Enter postal code"),
});

type CheckoutForm = z.infer<typeof checkoutSchema>;

type ProfileAddress = {
  label: string;
  receiverName: string;
  receiverPhone: string;
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};

type CreateOrderResponse = {
  success: true;
  data: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    orderRef: string;
    keyId: string;
    breakdown: {
      subtotal: number;
      shipping: number;
      tax: number;
      platformFee: number;
      discount: number;
      total: number;
    };
  };
} | {
  success: false;
  error: {
    message: string;
  };
};

type PlaceCodOrderResponse = {
  success: true;
  data: {
    orderId: string;
    paymentMethod: "cod";
    transactionStatus: "cod-pending";
  };
} | {
  success: false;
  error: {
    message: string;
  };
};

type ServiceabilityResponse = {
  success: true;
  data: {
    serviceable: boolean;
    embargoed: boolean;
    remark?: string;
  };
} | {
  success: false;
  error: {
    message: string;
  };
};

type CouponValidationResponse = {
  success: true;
  data: {
    valid: boolean;
    code: string;
    discount: number;
    message: string;
  };
} | {
  success: false;
  error: {
    message: string;
  };
};

type DeliveryEstimateResponse = {
  success: true;
  data: {
    estimatedFee: number;
    source: "delhivery" | "fallback";
    serviceable: boolean;
    remark?: string;
  };
} | {
  success: false;
  error: {
    message: string;
  };
};

export function CheckoutPageClient({ snapshot }: { snapshot: CartSnapshot }) {
  const router = useRouter();
  const { status } = useSession();
  const { clear } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState("Enter a coupon to validate from admin-managed offers.");
  const [deliveryFee, setDeliveryFee] = useState(snapshot.shipping);
  const [deliveryRemark, setDeliveryRemark] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<ProfileAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [newAddressOpen, setNewAddressOpen] = useState(false);
  const [deleteAddressOpen, setDeleteAddressOpen] = useState(false);
  const [newAddressMode, setNewAddressMode] = useState<"create" | "edit">("create");
  const [editingAddressLabel, setEditingAddressLabel] = useState<string | null>(null);
  const [newAddressSaving, setNewAddressSaving] = useState(false);
  const [newAddressError, setNewAddressError] = useState<string | null>(null);
  const [newAddress, setNewAddress] = useState<ProfileAddress>({
    label: "",
    receiverName: "",
    receiverPhone: "",
    line1: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      line1: "",
      city: "",
      state: "",
      pinCode: "",
    },
  });

  const pinCode = watch("pinCode");
  const uiTotal = useMemo(() => {
    const totalBeforeDiscount = snapshot.subtotal + snapshot.tax + snapshot.platformFee + deliveryFee;
    return Math.max(0, totalBeforeDiscount - couponDiscount);
  }, [couponDiscount, deliveryFee, snapshot.platformFee, snapshot.subtotal, snapshot.tax]);

  useEffect(() => {
    const code = promoCode.trim();
    if (!code) {
      setCouponDiscount(0);
      setPromoMessage("Enter a coupon to validate from admin-managed offers.");
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(code)}&subtotal=${snapshot.subtotal}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (!res) {
        setCouponDiscount(0);
        setPromoMessage("Unable to validate coupon right now.");
        return;
      }

      const payload = (await res.json().catch(() => null)) as CouponValidationResponse | null;
      if (!res.ok || !payload?.success) {
        setCouponDiscount(0);
        setPromoMessage(payload && !payload.success ? payload.error.message : "Unable to validate coupon right now.");
        return;
      }

      setCouponDiscount(payload.data.valid ? payload.data.discount : 0);
      setPromoMessage(payload.data.message);
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [promoCode, snapshot.subtotal]);

  useEffect(() => {
    const currentPin = pinCode?.trim();
    if (!currentPin || currentPin.length < 4) {
      setDeliveryFee(snapshot.shipping);
      setDeliveryRemark(null);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      const res = await fetch(`/api/shipping/delhivery/estimate?pinCode=${encodeURIComponent(currentPin)}&subtotal=${snapshot.subtotal}`, {
        signal: controller.signal,
      }).catch(() => null);

      if (!res) {
        setDeliveryFee(snapshot.shipping);
        setDeliveryRemark("Delivery estimate unavailable. Default fee applied.");
        return;
      }

      const payload = (await res.json().catch(() => null)) as DeliveryEstimateResponse | null;
      if (!res.ok || !payload?.success) {
        setDeliveryFee(snapshot.shipping);
        setDeliveryRemark(payload && !payload.success ? payload.error.message : "Delivery estimate unavailable.");
        return;
      }

      if (!payload.data.serviceable) {
        setDeliveryFee(0);
        setDeliveryRemark(payload.data.remark ?? "Delivery unavailable for this pincode.");
        return;
      }

      setDeliveryFee(payload.data.estimatedFee);
      setDeliveryRemark(payload.data.remark ?? null);
    }, 350);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [pinCode, snapshot.shipping, snapshot.subtotal]);

  const openNewAddressModal = () => {
    const values = getValues();
    setNewAddressMode("create");
    setEditingAddressLabel(null);
    setNewAddressError(null);
    setNewAddress({
      label: `Address ${addresses.length + 1}`,
      receiverName: values.fullName || "",
      receiverPhone: values.phone || "",
      line1: "",
      city: "",
      state: "",
      pinCode: "",
      country: "India",
    });
    setNewAddressOpen(true);
  };

  const openEditAddressModal = () => {
    const found = addresses.find((address) => address.label === selectedAddress);
    if (!found) {
      return;
    }
    setNewAddressMode("edit");
    setEditingAddressLabel(found.label);
    setNewAddressError(null);
    setNewAddress(found);
    setNewAddressOpen(true);
  };

  const saveAddressesToProfile = async (nextAddresses: ProfileAddress[]) => {
    const checkoutValues = getValues();
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: checkoutValues.fullName,
        phone: checkoutValues.phone,
        addresses: nextAddresses,
      }),
    });

    const payload = (await response.json()) as {
      success?: boolean;
      data?: { addresses?: ProfileAddress[] };
      error?: { message?: string };
    };

    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message ?? "Unable to save address.");
    }

    return payload.data?.addresses ?? nextAddresses;
  };

  const saveNewAddress = async () => {
    setNewAddressError(null);

    if (!newAddress.label.trim() || !newAddress.receiverName.trim() || !newAddress.receiverPhone.trim() || !newAddress.line1.trim() || !newAddress.city.trim() || !newAddress.state.trim() || !newAddress.pinCode.trim() || !newAddress.country.trim()) {
      setNewAddressError("Please fill all address fields.");
      return;
    }

    const nextAddresses =
      newAddressMode === "edit" && editingAddressLabel
        ? addresses.map((address) => (address.label === editingAddressLabel ? newAddress : address))
        : [...addresses, newAddress];

    try {
      setNewAddressSaving(true);
      const updatedAddresses = await saveAddressesToProfile(nextAddresses);
      const selected = updatedAddresses.find((address) => address.label === newAddress.label) ?? newAddress;
      setAddresses(updatedAddresses);
      setSelectedAddress(selected.label);
      applyAddress(selected, setValue);
      setNewAddressOpen(false);
    } catch (caughtError) {
      setNewAddressError(caughtError instanceof Error ? caughtError.message : "Unable to save address.");
    } finally {
      setNewAddressSaving(false);
    }
  };

  const deleteSelectedAddress = async () => {
    const foundIndex = addresses.findIndex((address) => address.label === selectedAddress);
    if (foundIndex < 0) {
      return;
    }

    const nextAddresses = addresses.filter((_, index) => index !== foundIndex);

    try {
      setNewAddressError(null);
      setNewAddressSaving(true);
      const updatedAddresses = await saveAddressesToProfile(nextAddresses);
      setAddresses(updatedAddresses);

      const nextSelected = updatedAddresses[0];
      if (nextSelected) {
        setSelectedAddress(nextSelected.label);
        applyAddress(nextSelected, setValue);
      } else {
        setSelectedAddress("");
      }
    } catch (caughtError) {
      setNewAddressError(caughtError instanceof Error ? caughtError.message : "Unable to delete address.");
    } finally {
      setNewAddressSaving(false);
    }
  };

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    fetch("/api/profile")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { addresses?: ProfileAddress[]; fullName?: string; phone?: string; email?: string };
        };

        if (!response.ok || !payload.success || !payload.data) {
          return;
        }

        const profileAddresses = payload.data.addresses ?? [];
        setAddresses(profileAddresses);

        if (payload.data.fullName) {
          setValue("fullName", payload.data.fullName);
        }
        if (payload.data.phone) {
          setValue("phone", payload.data.phone);
        }
        if (payload.data.email) {
          setValue("email", payload.data.email);
        }

        if (profileAddresses[0]) {
          setSelectedAddress(profileAddresses[0].label);
          applyAddress(profileAddresses[0], setValue);
        }
      })
      .catch(() => undefined);
  }, [setValue, status]);

  const onSubmit = handleSubmit(async (values) => {
    setError(null);

    try {
      setIsPaying(true);

      const serviceabilityRes = await fetch(`/api/shipping/delhivery/serviceability?pinCode=${encodeURIComponent(values.pinCode)}`);
      const serviceabilityPayload = (await serviceabilityRes.json()) as ServiceabilityResponse;

      if (serviceabilityRes.ok && serviceabilityPayload.success && !serviceabilityPayload.data.serviceable) {
        setError(serviceabilityPayload.data.remark
          ? `Delivery unavailable for this pincode (${serviceabilityPayload.data.remark}).`
          : "Delivery unavailable for this pincode.");
        setIsPaying(false);
        return;
      }

      if (paymentMethod === "cod") {
        const codRes = await fetch("/api/checkout/place", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethod: "cod",
            promoCode,
            customer: {
              ...values,
              addressLabel: selectedAddress,
            },
          }),
        });

        const codPayload = (await codRes.json()) as PlaceCodOrderResponse;
        if (!codRes.ok || !codPayload.success) {
          setError(codPayload.success ? "Unable to place COD order." : codPayload.error.message);
          setIsPaying(false);
          return;
        }

        clear();
        router.push(`/checkout/success?orderId=${encodeURIComponent(codPayload.data.orderId)}`);
        router.refresh();
        return;
      }

      const orderRes = await fetch("/api/checkout/razorpay/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promoCode,
          customer: {
            ...values,
            addressLabel: selectedAddress,
          },
        }),
      });

      const orderPayload = (await orderRes.json()) as CreateOrderResponse;
      if (!orderRes.ok || !orderPayload.success) {
        setError(orderPayload.success ? "Unable to start payment." : orderPayload.error.message);
        setIsPaying(false);
        return;
      }

      const sdkReady = await loadRazorpaySdk();
      if (!sdkReady || !window.Razorpay) {
        setError("Razorpay SDK failed to load. Please try again.");
        setIsPaying(false);
        return;
      }

      const razorpay = new window.Razorpay({
        key: orderPayload.data.keyId,
        amount: orderPayload.data.amount,
        currency: orderPayload.data.currency,
        name: "Gifta",
        description: "Multi-vendor gift order",
        order_id: orderPayload.data.razorpayOrderId,
        prefill: {
          name: values.fullName,
          email: values.email,
          contact: values.phone,
        },
        notes: {
          orderRef: orderPayload.data.orderRef,
          address: `${values.line1}, ${values.city}`,
        },
        handler: async (response: Record<string, string>) => {
          const verifyRes = await fetch("/api/checkout/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderRef: orderPayload.data.orderRef,
            }),
          });

          const verifyPayload = (await verifyRes.json()) as {
            success: boolean;
            data?: { orderId: string };
            error?: { message: string };
          };

          if (!verifyRes.ok || !verifyPayload.success || !verifyPayload.data) {
            setError(verifyPayload.error?.message ?? "Payment verification failed.");
            setIsPaying(false);
            return;
          }

          clear();
          router.push(`/checkout/success?orderId=${verifyPayload.data.orderId}`);
          router.refresh();
        },
        theme: {
          color: "#111827",
        },
        modal: {
          ondismiss: () => setIsPaying(false),
        },
      });

      razorpay.open();
    } catch {
      setError("Unable to process checkout right now.");
      setIsPaying(false);
    }
  });

  if (snapshot.lines.length === 0) {
    return (
      <Card className="rounded-4xl border-dashed border-[#e5c9bb] bg-white/78 text-slate-950">
        <CardContent className="p-10 text-center">
          <h1 className="font-display text-3xl font-semibold">Checkout is empty</h1>
          <p className="mt-2 text-sm text-[#5f5047]">Add products to cart before placing your order.</p>
          <Button asChild className="mt-5">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="surface-mesh soft-shadow rounded-4xl border border-white/70 p-6 text-center sm:p-8 lg:p-10">
        <Badge variant="secondary" className="border-0 bg-white/80 text-slate-800">Secure checkout</Badge>
        <h1 className="font-display mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">Checkout with a cleaner form, calmer summary, and stronger payment clarity</h1>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-[#5f5047] sm:text-base">Choose online payment or Cash on Delivery and place your multi-vendor gift order in the upgraded purchase flow.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] lg:gap-10">
        <section>
          <Card className="glass-panel rounded-4xl border-white/60">
            <CardHeader>
              <CardTitle className="font-display text-3xl">Delivery details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                {addresses.length > 0 ? (
                  <div className="app-data-panel space-y-2 rounded-3xl p-4">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="mb-0 block text-xs uppercase tracking-wide text-[#74655c]">Delivery address</Label>
                      {status === "authenticated" ? (
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={openNewAddressModal}>New Address</Button>
                          <Button type="button" variant="outline" size="sm" onClick={openEditAddressModal} disabled={!selectedAddress}>Edit</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteAddressOpen(true)} disabled={!selectedAddress || newAddressSaving}>Delete</Button>
                        </div>
                      ) : null}
                    </div>
                    <select
                      className="app-input-surface min-h-11 w-full rounded-full px-3 py-2 text-sm"
                      value={selectedAddress}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSelectedAddress(value);
                        const found = addresses.find((address) => address.label === value);
                        if (found) {
                          applyAddress(found, setValue);
                        }
                      }}
                    >
                      {addresses.map((address) => (
                        <option key={`${address.label}-${address.line1}`} value={address.label}>
                          {address.label} • {address.receiverName}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : status === "authenticated" ? (
                  <div className="app-data-panel space-y-2 rounded-3xl p-4">
                    <Label className="mb-0 block text-xs uppercase tracking-wide text-[#74655c]">Delivery address</Label>
                    <Button type="button" variant="outline" size="sm" onClick={openNewAddressModal}>New Address</Button>
                  </div>
                ) : null}

                <Field label="Full name" error={errors.fullName?.message}>
                  <Input {...register("fullName")} placeholder="Aarav Sharma" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Email" error={errors.email?.message}>
                    <Input {...register("email")} placeholder="you@example.com" />
                  </Field>
                  <Field label="Phone" error={errors.phone?.message}>
                    <Input {...register("phone")} placeholder="9876543210" />
                  </Field>
                </div>

                <Field label="Address" error={errors.line1?.message}>
                  <Input {...register("line1")} placeholder="221B Celebration Street" />
                </Field>

                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="City" error={errors.city?.message}>
                    <Input {...register("city")} placeholder="Bengaluru" />
                  </Field>
                  <Field label="State" error={errors.state?.message}>
                    <Input {...register("state")} placeholder="Karnataka" />
                  </Field>
                  <Field label="PIN" error={errors.pinCode?.message}>
                    <Input {...register("pinCode")} placeholder="560001" />
                  </Field>
                </div>

                <div className="space-y-2">
                  <Label className="mb-0 block text-xs uppercase tracking-wide text-[#74655c]">Payment method</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      type="button"
                      variant={paymentMethod === "razorpay" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("razorpay")}
                    >
                      Online Payment
                    </Button>
                    <Button
                      type="button"
                      variant={paymentMethod === "cod" ? "default" : "outline"}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      Cash on Delivery
                    </Button>
                  </div>
                </div>

                <Button type="submit" disabled={isPaying} className="w-full">
                  {isPaying
                    ? "Processing..."
                    : paymentMethod === "razorpay"
                      ? `Complete Payment ${formatCurrency(uiTotal)}`
                      : `Place COD order (${formatCurrency(uiTotal)})`}
                </Button>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}

                <div className="grid gap-3 sm:grid-cols-3">
                  <CheckoutNote icon={MapPin} label="Address aware" text="Saved addresses stay in flow without leaving checkout." />
                  <CheckoutNote icon={CreditCard} label="Payment choice" text="Razorpay and COD remain clear and visible." />
                  <CheckoutNote icon={ShieldCheck} label="Secure path" text="The form and summary now feel more trustworthy." />
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card className="rounded-4xl border-white/60 bg-[linear-gradient(180deg,#fffaf5_0%,#fff4ed_100%)] lg:sticky lg:top-24">
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-display text-3xl">Your order</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cart">Edit cart</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {snapshot.lines.map((line) => (
                  <li key={`${line.product.id}-${line.selectedVariant?.id ?? "default"}-${line.customizationSignature ?? "base"}`} className="grid grid-cols-[50px_1fr_auto] items-center gap-3 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                      <Image src={line.product.images[0]} alt={line.product.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{line.product.name}</p>
                      <p className="text-xs text-[#74655c]">
                        {line.variantLabel ? `Variant: ${line.variantLabel}` : (line.selectedOffer?.store?.name ?? "Gifta Marketplace")}
                      </p>
                      {line.customization ? (
                        <p className="mt-1 text-[11px] text-[#74655c]">
                          Customized • {line.customization.images?.length ?? 0} image{(line.customization.images?.length ?? 0) === 1 ? "" : "s"}
                          {line.customization.whatsappNumber ? ` • ${line.customization.whatsappNumber}` : ""}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(line.lineSubtotal)}</p>
                      <span className="mt-1 inline-flex min-w-6 items-center justify-center rounded bg-secondary px-1 text-[11px] text-secondary-foreground">
                        {line.quantity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2">
                <Label className="text-xs uppercase tracking-wide text-[#74655c]">Gift code</Label>
                <Input
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="Enter coupon code"
                />
                <p className="text-xs text-[#74655c]">{promoMessage}</p>
              </div>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-[#5f5047]">Subtotal</dt>
                  <dd className="font-semibold">{formatCurrency(snapshot.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#5f5047]">Shipping</dt>
                  <dd className="font-semibold">{deliveryFee === 0 ? "Free" : formatCurrency(deliveryFee)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#5f5047]">Tax</dt>
                  <dd className="font-semibold">{formatCurrency(snapshot.tax)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-[#5f5047]">Platform fee</dt>
                  <dd className="font-semibold">{snapshot.platformFee === 0 ? "Free" : formatCurrency(snapshot.platformFee)}</dd>
                </div>
                {couponDiscount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-[#5f5047]">Discount</dt>
                    <dd className="font-semibold text-emerald-600">-{formatCurrency(couponDiscount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-base font-semibold">Payable total</dt>
                  <dd className="text-base font-bold">{formatCurrency(uiTotal)}</dd>
                </div>
              </dl>

              {deliveryRemark ? <p className="mt-3 text-xs text-[#74655c]">Delivery note: {deliveryRemark}</p> : null}

              <div className="app-data-panel mt-5 rounded-3xl p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-primary" />Premium checkout surface</p>
                <p className="mt-1 text-sm text-[#5f5047]">Summary, code entry, and totals are now easier to scan across desktop and mobile.</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={newAddressOpen} onOpenChange={setNewAddressOpen}>
        <DialogContent className="rounded-4xl border-white/60 bg-white">
          <DialogHeader>
            <DialogTitle>{newAddressMode === "edit" ? "Edit address" : "Add new address"}</DialogTitle>
            <DialogDescription>
              {newAddressMode === "edit" ? "Update this saved delivery address." : "Save a delivery address without leaving checkout."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input placeholder="Label" value={newAddress.label} onChange={(event) => setNewAddress((prev) => ({ ...prev, label: event.target.value }))} />
            <Input placeholder="Receiver name" value={newAddress.receiverName} onChange={(event) => setNewAddress((prev) => ({ ...prev, receiverName: event.target.value }))} />
            <Input placeholder="Receiver phone" value={newAddress.receiverPhone} onChange={(event) => setNewAddress((prev) => ({ ...prev, receiverPhone: event.target.value }))} />
            <Input placeholder="Address line" value={newAddress.line1} onChange={(event) => setNewAddress((prev) => ({ ...prev, line1: event.target.value }))} />
            <Input placeholder="City" value={newAddress.city} onChange={(event) => setNewAddress((prev) => ({ ...prev, city: event.target.value }))} />
            <Input placeholder="State" value={newAddress.state} onChange={(event) => setNewAddress((prev) => ({ ...prev, state: event.target.value }))} />
            <Input placeholder="PIN" value={newAddress.pinCode} onChange={(event) => setNewAddress((prev) => ({ ...prev, pinCode: event.target.value }))} />
            <Input placeholder="Country" value={newAddress.country} onChange={(event) => setNewAddress((prev) => ({ ...prev, country: event.target.value }))} />
          </div>

          {newAddressError ? <p className="text-sm text-destructive">{newAddressError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setNewAddressOpen(false)}>Cancel</Button>
            <Button type="button" onClick={saveNewAddress} disabled={newAddressSaving}>
              {newAddressSaving ? "Saving..." : newAddressMode === "edit" ? "Update address" : "Save address"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteAddressOpen} onOpenChange={setDeleteAddressOpen}>
        <DialogContent className="rounded-4xl border-white/60 bg-white">
          <DialogHeader>
            <DialogTitle>Delete address?</DialogTitle>
            <DialogDescription>
              {selectedAddress
                ? `This will remove the “${selectedAddress}” saved address from your profile.`
                : "This removes the selected saved address from your profile."}
            </DialogDescription>
          </DialogHeader>

          {newAddressError ? <p className="text-sm text-destructive">{newAddressError}</p> : null}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteAddressOpen(false)} disabled={newAddressSaving}>Cancel</Button>
            <Button
              type="button"
              variant="destructive"
              onClick={async () => {
                await deleteSelectedAddress();
                setDeleteAddressOpen(false);
              }}
              disabled={newAddressSaving}
            >
              {newAddressSaving ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CheckoutNote({
  icon: Icon,
  label,
  text,
}: {
  icon: typeof MapPin;
  label: string;
  text: string;
}) {
  return (
    <div className="app-data-panel rounded-3xl p-4">
      <Icon className="h-4 w-4 text-primary" />
      <p className="mt-3 text-sm font-semibold">{label}</p>
      <p className="mt-1 text-sm text-[#5f5047]">{text}</p>
    </div>
  );
}

async function loadRazorpaySdk() {
  if (typeof window === "undefined") {
    return false;
  }

  if (window.Razorpay) {
    return true;
  }

  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-xs uppercase tracking-wide text-[#74655c]">{label}</Label>
      {children}
      {error ? <p className="mt-1 text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function applyAddress(address: ProfileAddress, setValue: (name: keyof CheckoutForm, value: string) => void) {
  setValue("fullName", address.receiverName);
  setValue("phone", address.receiverPhone);
  setValue("line1", address.line1);
  setValue("city", address.city);
  setValue("state", address.state);
  setValue("pinCode", address.pinCode);
}
