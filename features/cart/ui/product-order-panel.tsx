"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { UploadCloud, X } from "lucide-react";
import { AddToCartInline } from "@/features/cart/ui/add-to-cart-inline";
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
  const hasVariants = (attributes?.length ?? 0) > 0 && (variants?.length ?? 0) > 0;

  const initialOptions = useMemo(() => {
    const firstVariant = variants?.[0];
    if (!firstVariant) {
      return {} as Record<string, string>;
    }
    return { ...firstVariant.options };
  }, [variants]);

  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>(initialOptions);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [customDescription, setCustomDescription] = useState("");
  const [customWhatsapp, setCustomWhatsapp] = useState("");
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

  const customizationPayload = useMemo(() => {
    const description = customDescription.trim();
    const whatsapp = customWhatsapp.replace(/\s+/g, "").trim();
    const validWhatsapp = /^\+?[0-9]{8,15}$/.test(whatsapp) ? whatsapp : "";
    return {
      ...(customImages.length ? { images: customImages } : {}),
      ...(description ? { description } : {}),
      ...(validWhatsapp ? { whatsappNumber: validWhatsapp } : {}),
    };
  }, [customDescription, customWhatsapp, customImages]);

  const hasCustomization = Boolean(createCustomizationSignature(customizationPayload));

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
    <div className="space-y-5">
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

      <div className="grid gap-3 sm:flex sm:flex-wrap">
        <AddToCartInline
          productId={productId}
          offerId={offerId}
          minQty={minQty}
          maxQty={maxQty}
          disabled={disabled}
          variantId={selectedVariant?.id}
          variantOptions={selectedVariant?.options}
          requiresVariantSelection={hasVariants}
          customization={hasCustomization ? customizationPayload : undefined}
          requireAuthForCustomization={customizable}
        />
        {customizable ? (
          <Button
            type="button"
            variant={hasCustomization ? "default" : "outline"}
            className="h-11"
            onClick={() => setCustomizeOpen((current) => !current)}
          >
            {hasCustomization ? "Customization added" : "Customize"}
          </Button>
        ) : null}
      </div>

      {customizable && customizeOpen ? (
        <div className="space-y-3 rounded-3xl border border-border/70 bg-background/60 p-4">
          <p className="text-sm font-medium">Customization details</p>
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
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30">
              <UploadCloud className="h-3.5 w-3.5" /> Upload image
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
          {customError ? <p className="text-sm text-destructive">{customError}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
