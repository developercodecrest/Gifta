"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { Minus, Plus, ShoppingBag, UploadCloud, Zap, X } from "lucide-react";
import { useCartStore } from "@/features/cart/store";
import { uploadFileToCloudinary } from "@/lib/client/cloudinary-upload";
import { createCustomizationSignature } from "@/lib/cart-customization";
import { ProductAttribute, ProductVariant } from "@/types/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ProductOrderPanel({
  productId,
  offerId,
  minQty,
  maxQty,
  disabled,
  attributes,
  variants,
  fallbackPrice,
  fallbackOriginalPrice,
  customizable,
}: {
  productId: string;
  offerId?: string;
  minQty: number;
  maxQty: number;
  disabled?: boolean;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
  fallbackPrice: number;
  fallbackOriginalPrice?: number;
  customizable?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { status } = useSession();
  const addItem = useCartStore((state) => state.addItem);
  const hasVariants = (attributes?.length ?? 0) > 0 && (variants?.length ?? 0) > 0;
  const qtyMin = Math.max(1, minQty);
  const qtyMax = Math.max(qtyMin, maxQty);

  const initialOptions = useMemo(() => {
    const firstVariant = variants?.[0];
    if (!firstVariant) {
      return {} as Record<string, string>;
    }
    return { ...firstVariant.options };
  }, [variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions);
  const [selectedQty, setSelectedQty] = useState(qtyMin);
  const [customDescription, setCustomDescription] = useState("");
  const [customWhatsapp, setCustomWhatsapp] = useState("");
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftCard, setGiftCard] = useState(false);
  const [giftMessage, setGiftMessage] = useState(false);
  const [approvalByEmail, setApprovalByEmail] = useState(false);
  const [customImages, setCustomImages] = useState<string[]>([]);
  const [customUploadProgress, setCustomUploadProgress] = useState(0);
  const [customError, setCustomError] = useState<string | null>(null);

  const selectedVariant = useMemo(() => {
    if (!hasVariants) {
      return undefined;
    }

    return variants?.find((variant) =>
      (attributes ?? []).every((attribute) => variant.options[attribute.name] === selectedOptions[attribute.name]),
    );
  }, [attributes, hasVariants, selectedOptions, variants]);

  const selectedPrice = selectedVariant?.salePrice ?? (hasVariants ? undefined : fallbackPrice);
  const selectedOriginalPrice = selectedVariant?.regularPrice ?? (hasVariants ? undefined : fallbackOriginalPrice);
  const outOfStock = disabled || maxQty === 0;
  const variantPending = hasVariants && !selectedVariant;
  const actionDisabled = outOfStock || variantPending;

  const customizationPayload = useMemo(() => {
    const description = customDescription.trim();
    const whatsapp = customWhatsapp.replace(/\s+/g, "").trim();
    const validWhatsapp = /^\+?[0-9]{8,15}$/.test(whatsapp) ? whatsapp : "";
    return {
      ...(customImages.length ? { images: customImages } : {}),
      ...(description ? { description } : {}),
      ...(validWhatsapp ? { whatsappNumber: validWhatsapp } : {}),
      ...(giftWrap ? { giftWrap: true } : {}),
      ...(giftCard ? { giftCard: true } : {}),
      ...(giftMessage ? { giftMessage: true } : {}),
      ...(approvalByEmail ? { approvalByEmail: true } : {}),
    };
  }, [approvalByEmail, customDescription, customWhatsapp, customImages, giftCard, giftMessage, giftWrap]);

  const hasCustomization = Boolean(createCustomizationSignature(customizationPayload));

  const addCurrentSelectionToCart = () => {
    addItem(
      productId,
      selectedQty,
      offerId,
      minQty,
      maxQty,
      selectedVariant?.id,
      selectedVariant?.options,
      hasCustomization ? customizationPayload : undefined,
    );
  };

  const canProceedWithSelection = () => {
    if (actionDisabled) {
      return false;
    }

    if (customizable && hasCustomization && status !== "authenticated") {
      router.push(`/auth/sign-in?callbackUrl=${encodeURIComponent(pathname || "/")}`);
      return false;
    }

    return true;
  };

  const handleAddToCart = () => {
    if (!canProceedWithSelection()) {
      return;
    }

    addCurrentSelectionToCart();
  };

  const handleOrderNow = () => {
    if (!canProceedWithSelection()) {
      return;
    }

    addCurrentSelectionToCart();
    router.push("/checkout");
  };

  const uploadCustomizationImage = async (file: File) => {
    if (customImages.length >= 15) {
      setCustomError("You can upload up to 15 images.");
      return;
    }

    setCustomError(null);
    try {
      const url = await uploadFileToCloudinary(file, {
        folder: "gifta/customization",
        resourceType: "image",
        onProgress: setCustomUploadProgress,
      });
      setCustomImages((current) => {
        if (current.length >= 15) {
          return current;
        }
        return [...current, url];
      });
      setCustomUploadProgress(100);
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Unable to upload image");
    }
  };

  return (
    <div className="space-y-4">
      {hasVariants ? (
        <div className="space-y-3 rounded-3xl border border-border/70 bg-background/60 p-4">
          {(attributes ?? []).map((attribute) => (
            <div key={attribute.name} className="space-y-2">
              <Label>{attribute.name}</Label>
              <select
                className="min-h-11 w-full rounded-[1.25rem] border border-input bg-background px-4 py-2 text-sm"
                value={selectedOptions[attribute.name] ?? ""}
                onChange={(event) =>
                  setSelectedOptions((current) => ({
                    ...current,
                    [attribute.name]: event.target.value,
                  }))
                }
              >
                {attribute.values.map((value) => (
                  <option key={`${attribute.name}-${value}`} value={value}>{value}</option>
                ))}
              </select>
            </div>
          ))}
          {selectedVariant?.weight ? (
            <p className="text-sm text-[#5f5047]">
              Variant weight: {selectedVariant.weight} {selectedVariant.weightUnit ?? "g"}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-3">
        <span className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          {selectedPrice !== undefined ? formatCurrency(selectedPrice) : "Select variant"}
        </span>
        {selectedOriginalPrice ? (
          <span className="pb-1 text-base text-[#74655c] line-through">{formatCurrency(selectedOriginalPrice)}</span>
        ) : null}
      </div>

      <div className="rounded-3xl border border-[#ddcfc5] bg-white/85 p-3.5">
        <p className="text-sm font-semibold text-foreground">Quantity</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="inline-flex h-12 items-center rounded-full border border-[#ddcfc5] bg-white px-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedQty((current) => Math.max(qtyMin, current - 1))}
              disabled={selectedQty <= qtyMin || outOfStock}
              className="h-10 w-10 rounded-full"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="min-w-10 px-2 text-center text-base font-semibold">{selectedQty}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setSelectedQty((current) => Math.min(qtyMax, current + 1))}
              disabled={selectedQty >= qtyMax || outOfStock}
              className="h-10 w-10 rounded-full"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-[#74655c]">Min {qtyMin} • Max {qtyMax}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={handleAddToCart}
          disabled={actionDisabled}
          className="h-15 w-full rounded-2xl bg-[#cd9933] text-base font-semibold text-white hover:bg-[#b9882f] disabled:bg-[#cd9933]/60"
        >
          <ShoppingBag className="h-5 w-5" />
          {variantPending ? "Select variant" : outOfStock ? "Out of stock" : "Add to cart"}
        </Button>

        <Button
          type="button"
          onClick={handleOrderNow}
          disabled={actionDisabled}
          className="h-15 w-full rounded-2xl bg-[#b8872d] text-base font-semibold text-white hover:bg-[#a47728] disabled:bg-[#b8872d]/60"
        >
          <Zap className="h-5 w-5" />
          {variantPending ? "Select variant" : outOfStock ? "Out of stock" : "Order now"}
        </Button>
      </div>

      {customizable ? (
        <div className="space-y-3 rounded-3xl border border-[#ddcfc5] bg-white/85 p-4">
          <p className="text-sm font-semibold">Image upload and customization</p>
          <div className="space-y-2">
            <Label>Customization description</Label>
            <textarea
              value={customDescription}
              onChange={(event) => setCustomDescription(event.target.value)}
              rows={3}
              className="min-h-24 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40"
              placeholder="Tell us what to print, engrave, or compose"
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp number</Label>
            <Input
              value={customWhatsapp}
              onChange={(event) => setCustomWhatsapp(event.target.value)}
              placeholder="+91XXXXXXXXXX"
              inputMode="tel"
            />
          </div>
          <div className="space-y-2">
            <Label>Reference images ({customImages.length}/15)</Label>
            <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-[#cdbeb1] bg-white px-4 py-4 text-center text-sm text-[#5f5047] hover:bg-[#fff8ef]">
              <span className="inline-flex items-center gap-2 rounded-md bg-[#edf3ff] px-3 py-1 text-sm font-medium text-[#2554b0]">
                <UploadCloud className="h-4 w-4" /> Choose file
              </span>
              <span className="text-xs">or drop file to upload</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void uploadCustomizationImage(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${customUploadProgress}%` }} />
            </div>
            {customImages.length ? (
              <div className="grid gap-2 sm:grid-cols-4">
                {customImages.map((url) => (
                  <div key={url} className="relative overflow-hidden rounded-xl border border-border">
                    <div className="relative h-20 w-full bg-muted/20">
                      <Image src={url} alt="Customization reference" fill className="object-cover" sizes="120px" />
                    </div>
                    <button
                      type="button"
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                      onClick={() => setCustomImages((current) => current.filter((entry) => entry !== url))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="grid gap-3 pt-1 sm:grid-cols-3">
            <GiftToggle label="Gift Wrap" checked={giftWrap} onChange={setGiftWrap} />
            <GiftToggle label="Gift Card" checked={giftCard} onChange={setGiftCard} />
            <GiftToggle label="Gift Message" checked={giftMessage} onChange={setGiftMessage} />
          </div>

          <label className="flex cursor-pointer items-start gap-2 rounded-xl border border-[#ddcfc5] bg-white px-3 py-2 text-sm text-[#3c2a25]">
            <input
              type="checkbox"
              checked={approvalByEmail}
              onChange={(event) => setApprovalByEmail(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-[#bda992]"
            />
            <span>
              Yes send approval copy to email
              <span className="block text-xs text-[#74655c]">Delay in approval can delay delivery.</span>
            </span>
          </label>

          {customError ? <p className="text-sm text-destructive">{customError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function GiftToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-[#ddcfc5] bg-white px-3 py-2 text-sm text-[#3c2a25]">
      <span>{label}</span>
      <span className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${checked ? "bg-[#cd9933]" : "bg-[#e8e4df]"}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="sr-only"
        />
        <span className={`h-5 w-5 rounded-full bg-white shadow transition ${checked ? "translate-x-5" : "translate-x-1"}`} />
      </span>
    </label>
  );
}
