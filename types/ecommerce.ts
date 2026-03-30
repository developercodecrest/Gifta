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

export type ProductVariant = {
  id: string;
  options: Record<string, string>;
  salePrice: number;
  regularPrice?: number;
  weight?: number;
  weightUnit?: ProductVariantUnit;
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
};

export type Product = {
  id: string;
  storeId?: string;
  slug: string;
  name: string;
  shortDescription?: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: Category;
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
