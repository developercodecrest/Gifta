"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { PRODUCT_IMAGE_FALLBACK, resolveProductImage } from "@/lib/product-image";
import { ProductMediaItem } from "@/types/ecommerce";

function inferMediaTypeFromUrl(url: string): "image" | "video" {
  const normalized = url.trim().toLowerCase();
  if (normalized.includes("/video/upload/") || /\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(normalized)) {
    return "video";
  }
  return "image";
}

function deriveCloudinaryVideoThumbnail(url: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return undefined;
  }

  const [base, query = ""] = url.split("?");
  const withFrame = base.replace("/video/upload/", "/video/upload/so_0/");
  const asImage = /\.[a-z0-9]+$/i.test(withFrame)
    ? withFrame.replace(/\.[a-z0-9]+$/i, ".jpg")
    : `${withFrame}.jpg`;

  return query ? `${asImage}?${query}` : asImage;
}

function normalizeGalleryItems(media: ProductMediaItem[] | undefined, images: string[]) {
  if (media?.length) {
    return media.map((entry) => ({
      ...entry,
      url: entry.type === "video" ? entry.url : resolveProductImage(entry.url),
      thumbnailUrl: entry.type === "video"
        ? (entry.thumbnailUrl || deriveCloudinaryVideoThumbnail(entry.url) || PRODUCT_IMAGE_FALLBACK)
        : resolveProductImage(entry.url),
    }));
  }

  const derived = images
    .filter(Boolean)
    .map((url) => {
      const type = inferMediaTypeFromUrl(url);
      return {
        type,
        url: resolveProductImage(url),
        ...(type === "video"
          ? { thumbnailUrl: deriveCloudinaryVideoThumbnail(url) || PRODUCT_IMAGE_FALLBACK }
          : { thumbnailUrl: resolveProductImage(url) }),
      };
    });

  if (derived.length) {
    return derived;
  }

  return [
    {
      type: "image" as const,
      url: PRODUCT_IMAGE_FALLBACK,
      thumbnailUrl: PRODUCT_IMAGE_FALLBACK,
    },
  ];
}

export function ProductMediaGallery({
  media,
  images,
  productName,
}: {
  media?: ProductMediaItem[];
  images: string[];
  productName: string;
}) {
  const galleryItems = useMemo(() => normalizeGalleryItems(media, images), [media, images]);
  const [activeIndex, setActiveIndex] = useState(0);
  const active = galleryItems[activeIndex] ?? galleryItems[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[92px_minmax(0,1fr)]">
      <div className="order-2 flex gap-3 overflow-x-auto pb-1 lg:order-1 lg:flex-col lg:overflow-visible">
        {galleryItems.slice(0, 8).map((entry, index) => (
          <button
            key={`${entry.type}-${entry.url}-${index}`}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border bg-white/80 transition lg:h-24 lg:w-full ${activeIndex === index ? "border-primary" : "border-white/70"}`}
          >
            <Image
              src={resolveProductImage(entry.type === "video" ? (entry.thumbnailUrl || entry.url) : entry.url)}
              alt={`${productName} media ${index + 1}`}
              fill
              className="object-cover"
              sizes="96px"
            />
            {entry.type === "video" ? (
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 text-white">
                <Play className="h-4 w-4" />
              </div>
            ) : null}
          </button>
        ))}
      </div>

      <article className="surface-mesh soft-shadow relative order-1 aspect-[4/4.2] overflow-hidden rounded-4xl border border-white/70 lg:order-2">
        {active?.type === "video" ? (
          <video
            src={active.url}
            poster={resolveProductImage(active.thumbnailUrl || active.url)}
            controls
            className="h-full w-full object-cover"
          />
        ) : (
          <Image
            src={resolveProductImage(active?.url || images[0])}
            alt={productName}
            fill
            className="object-cover"
            sizes="(max-width: 1280px) 100vw, 52vw"
          />
        )}
      </article>
    </div>
  );
}
