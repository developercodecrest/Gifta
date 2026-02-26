import { Category, Product } from "@/types/ecommerce";

export type ApiErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiSuccess<TData, TMeta = Record<string, never>> = {
  success: true;
  data: TData;
  meta?: TMeta;
};

export type ApiFailure = {
  success: false;
  error: ApiErrorPayload;
};

export type ApiEnvelope<TData, TMeta = Record<string, never>> = ApiSuccess<TData, TMeta> | ApiFailure;

export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export type Role = "sadmin" | "storeOwner" | "rider" | "user";

export type ProfileAddress = {
  label: string;
  receiverName: string;
  receiverPhone: string;
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};

export type ProfilePreferences = {
  occasions: Category[];
  budgetMin: number;
  budgetMax: number;
  preferredTags: string[];
};

export type ProfileDto = {
  profileKey: string;
  fullName: string;
  email: string;
  phone?: string;
  addresses: ProfileAddress[];
  preferences: ProfilePreferences;
  updatedAt: string;
};

export type StoreDto = {
  id: string;
  name: string;
  slug: string;
  ownerUserId?: string;
  rating: number;
  active: boolean;
};

export type RiderDto = {
  id: string;
  fullName: string;
  phone: string;
  zone: string;
  activeDeliveries: number;
  status: "available" | "on-delivery" | "offline";
};

export type AdminOrderDto = {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddressLabel?: string;
  status: "placed" | "packed" | "out-for-delivery" | "delivered" | "cancelled";
  orderRef?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  riderId?: string;
  createdAt: string;
};

export type UserOrderDto = {
  orderRef: string;
  placedAt: string;
  status: AdminOrderDto["status"];
  totalAmount: number;
  itemsSummary: string;
  itemCount: number;
  deliveryAddressLabel?: string;
};

export type OrderTrackingStep = {
  status: AdminOrderDto["status"];
  label: string;
  completed: boolean;
  active: boolean;
};

export type UserOrderItemDto = {
  id: string;
  productId: string;
  productName: string;
  storeId: string;
  storeName?: string;
  quantity: number;
  totalAmount: number;
  status: AdminOrderDto["status"];
  riderId?: string;
  riderName?: string;
  createdAt: string;
};

export type UserOrderDetailsDto = {
  orderRef: string;
  placedAt: string;
  lastUpdatedAt: string;
  status: AdminOrderDto["status"];
  totalAmount: number;
  itemCount: number;
  itemsSummary: string;
  deliveryAddressLabel?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  paymentId?: string;
  items: UserOrderItemDto[];
  tracking: OrderTrackingStep[];
};

export type UserNotificationDto = {
  id: string;
  type: "order-update" | "payment";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  orderRef?: string;
  status?: AdminOrderDto["status"];
  actionPath?: string;
};

export type VendorSummaryDto = StoreDto & {
  itemCount: number;
  offerCount: number;
};

export type OfferDto = {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  deliveryEtaHours: number;
  store?: StoreDto;
};

export type ReviewDto = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpfulCount: number;
};

export type CommentDto = {
  id: string;
  productId: string;
  reviewId?: string;
  author: string;
  message: string;
  createdAt: string;
};

export type ProductListItemDto = Product & {
  bestOffer?: OfferDto;
  offerCount: number;
};

export type ProductDetailsDto = Product & {
  offers: OfferDto[];
  reviewSummary: {
    averageRating: number;
    totalReviews: number;
  };
  suggestions: ProductListItemDto[];
};

export type SearchMeta = {
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
  filters: {
    q?: string;
    category?: string;
    tag?: string;
    stock?: boolean;
    minPrice?: number;
    maxPrice?: number;
    storeId?: string;
    minRating?: number;
    sort: SortOption;
  };
};

export type HomePayload = {
  featured: ProductListItemDto[];
  topRated: ProductListItemDto[];
  categories: Category[];
};

export type AdminDashboardPayload = {
  totalVendors: number;
  activeVendors: number;
  totalItems: number;
  totalOffers: number;
  totalOrders: number;
  pendingOrders: number;
  totalRiders: number;
  activeRiders: number;
  totalUsers: number;
};
