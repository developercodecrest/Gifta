export type Category =
  | "Birthday"
  | "Anniversary"
  | "Wedding"
  | "Corporate"
  | "Self Care"
  | "Festive";

export type ProductAttribute = {
  name: string;
  values: string[];
};

export type ProductVariantUnit = "g" | "kg";

export type ProductVariantDimensionUnit = "cm";

export type ProductVariant = {
  id: string;
  options: Record<string, string>;
  salePrice: number;
  regularPrice?: number;
  weight?: number;
  weightUnit?: ProductVariantUnit;
  size?: string;
  width?: number;
  height?: number;
  dimensionUnit?: ProductVariantDimensionUnit;
  inStock: boolean;
};

export type ProductMediaType = "image" | "video";

export type ProductMediaItem = {
  type: ProductMediaType;
  url: string;
  thumbnailUrl?: string;
  alt?: string;
};

export type CartItemCustomization = {
  images?: string[];
  description?: string;
  whatsappNumber?: string;
  giftWrap?: boolean;
  giftCard?: boolean;
  giftMessage?: boolean;
  approvalByEmail?: boolean;
};

export type Product = {
  id: string;
  storeId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  disclaimerHtml?: string;
  howToPersonaliseHtml?: string;
  brandDetailsHtml?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: Category;
  subcategory?: string;
  tags: string[];
  media?: ProductMediaItem[];
  images: string[];
  inStock: boolean;
  minOrderQty?: number;
  maxOrderQty?: number;
  featured?: boolean;
  attributes?: ProductAttribute[];
  variants?: ProductVariant[];
};

export type CartItem = {
  productId: string;
  quantity: number;
  offerId?: string;
  variantId?: string;
  variantOptions?: Record<string, string>;
  customization?: CartItemCustomization;
  customizationSignature?: string;
};
