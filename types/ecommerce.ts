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

export type Product = {
  id: string;
  storeId?: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  category: Category;
  tags: string[];
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
};
