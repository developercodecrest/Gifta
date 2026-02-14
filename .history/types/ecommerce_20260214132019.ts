export type Category =
  | "Birthday"
  | "Anniversary"
  | "Wedding"
  | "Corporate"
  | "Self Care"
  | "Festive";

export type Product = {
  id: string;
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
  featured?: boolean;
};

export type CartItem = {
  productId: string;
  quantity: number;
};
