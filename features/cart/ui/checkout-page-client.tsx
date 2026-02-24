"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
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

export function CheckoutPageClient({ snapshot }: { snapshot: CartSnapshot }) {
  const router = useRouter();
  const { status } = useSession();
  const { clear } = useCartStore();
  const [promoCode, setPromoCode] = useState("");
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const localPromo = useMemo(() => getPromoDetails(promoCode, snapshot.subtotal), [promoCode, snapshot.subtotal]);
  const uiTotal = Math.max(0, snapshot.total - localPromo.discount);

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
      <Card className="border-dashed">
        <CardContent className="p-10 text-center">
          <h1 className="text-2xl font-bold">Checkout is empty</h1>
          <p className="mt-2 text-sm text-muted-foreground">Add products to cart before placing your order.</p>
          <Button asChild className="mt-4">
            <Link href="/store">Continue shopping</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5 text-center sm:p-7">
        <Badge variant="secondary">Secure checkout</Badge>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">Checkout</h1>
        <p className="mt-2 text-sm text-muted-foreground">Pay with Razorpay and place your multi-vendor gift order.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)] lg:gap-10">
        <section>
          <Card>
            <CardHeader>
              <CardTitle>Delivery details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                {addresses.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <Label className="mb-0 block text-xs uppercase tracking-wide text-muted-foreground">Delivery address</Label>
                      {status === "authenticated" ? (
                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={openNewAddressModal}>New Address</Button>
                          <Button type="button" variant="outline" size="sm" onClick={openEditAddressModal} disabled={!selectedAddress}>Edit</Button>
                          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteAddressOpen(true)} disabled={!selectedAddress || newAddressSaving}>Delete</Button>
                        </div>
                      ) : null}
                    </div>
                    <select
                      className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
                  <div className="space-y-2">
                    <Label className="mb-0 block text-xs uppercase tracking-wide text-muted-foreground">Delivery address</Label>
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

                <Button type="submit" disabled={isPaying} className="w-full">
                  {isPaying ? "Processing..." : `Pay ${formatCurrency(uiTotal)} with Razorpay`}
                </Button>
                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </form>
            </CardContent>
          </Card>
        </section>

        <aside>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <CardTitle>Your order</CardTitle>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/cart">Edit cart</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="divide-y divide-border">
                {snapshot.lines.map((line) => (
                  <li key={line.product.id} className="grid grid-cols-[50px_1fr_auto] items-center gap-3 py-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-border">
                      <Image src={line.product.images[0]} alt={line.product.name} fill className="object-cover" sizes="48px" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{line.product.name}</p>
                      <p className="text-xs text-muted-foreground">{line.selectedOffer?.store?.name ?? "Gifta Marketplace"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{formatCurrency(line.lineSubtotal)}</p>
                      <span className="mt-1 inline-flex min-w-6 items-center justify-center rounded bg-secondary px-1 text-[11px] text-muted-foreground">
                        {line.quantity}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-5 space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Gift code</Label>
                <Input
                  value={promoCode}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder="GIFT10 / WELCOME15 / FREESHIP"
                />
                <p className="text-xs text-muted-foreground">{localPromo.message}</p>
              </div>

              <dl className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-semibold">{formatCurrency(snapshot.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping</dt>
                  <dd className="font-semibold">{snapshot.shipping === 0 ? "Free" : formatCurrency(snapshot.shipping)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Tax</dt>
                  <dd className="font-semibold">{formatCurrency(snapshot.tax)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Platform fee</dt>
                  <dd className="font-semibold">{snapshot.platformFee === 0 ? "Free" : formatCurrency(snapshot.platformFee)}</dd>
                </div>
                {localPromo.discount > 0 ? (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Discount</dt>
                    <dd className="font-semibold text-emerald-600">-{formatCurrency(localPromo.discount)}</dd>
                  </div>
                ) : null}
                <div className="flex justify-between border-t border-border pt-2">
                  <dt className="text-base font-semibold">Payable total</dt>
                  <dd className="text-base font-bold">{formatCurrency(uiTotal)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog open={newAddressOpen} onOpenChange={setNewAddressOpen}>
        <DialogContent>
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
        <DialogContent>
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

function getPromoDetails(rawCode: string | undefined, subtotal: number) {
  const code = (rawCode ?? "").trim().toUpperCase();

  if (!code) {
    return {
      code: "",
      discount: 0,
      message: "Promo codes: GIFT10 (10% off), WELCOME15 (15% above ₹3000), FREESHIP (₹199 off).",
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
      <Label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
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
