"use client";

import { useMemo, useState } from "react";
import { AddToCartInline } from "@/features/cart/ui/add-to-cart-inline";
import { ProductAttribute, ProductVariant } from "@/types/ecommerce";
import { formatCurrency } from "@/lib/utils";
import { Label } from "@/components/ui/label";

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
        />
      </div>
    </div>
  );
}
