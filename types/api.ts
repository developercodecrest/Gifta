import { CartItemCustomization, Category, Product } from "@/types/ecommerce";

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

export type Role =
  | "SADMIN"
  | "STORE_OWNER"
  | "USER"
  | "RIDER"
  | "AREA_MANAGER"
  | "sadmin"
  | "storeOwner"
  | "user";

export type CouponDiscountType = "percent" | "flat";

export type CouponDto = {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minSubtotal?: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CouponValidationResult = {
  valid: boolean;
  code: string;
  discount: number;
  message: string;
  coupon?: CouponDto;
};

export type PaymentMethod = "razorpay" | "cod";
export type TransactionStatus = "pending" | "success" | "failed" | "refunded" | "cod-pending";

export type ShippingProvider = "delhivery";

export type ShippingAddressSnapshot = {
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
  receiverName?: string;
  receiverPhone?: string;
};

export type ShippingPackageSnapshot = {
  deadWeightKg: number;
  lengthCm: number;
  breadthCm: number;
  heightCm: number;
  quantity: number;
};

export type ShippingEvent = {
  timestamp: string;
  status: string;
  description?: string;
  raw?: Record<string, unknown>;
};

export type ProfileAddress = {
  label: string;
  receiverName: string;
  receiverPhone?: string;
  receiverPhones?: string[];
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
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  profileImage?: string;
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

export type StoreCategoryOption = {
  name: string;
  subcategories: string[];
  image?: string;
};

export type VendorCategoryAggregate = {
  category: string;
  itemCount: number;
  offerCount: number;
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
  customerUserId?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  deliveryAddressLabel?: string;
  status: "placed" | "packed" | "out-for-delivery" | "delivered" | "cancelled";
  orderRef?: string;
  paymentMethod?: PaymentMethod;
  transactionStatus?: TransactionStatus;
  transactionId?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  riderId?: string;
  shippingProvider?: ShippingProvider;
  shippingProviderStatus?: string;
  shippingAwb?: string;
  shippingShipmentId?: string;
  shippingPickupRequestId?: string;
  shippingError?: string;
  shippingLastSyncedAt?: string;
  deliveryAddress?: ShippingAddressSnapshot;
  pickupAddress?: ShippingAddressSnapshot;
  shippingPackage?: ShippingPackageSnapshot;
  shippingEvents?: ShippingEvent[];
  customization?: CartItemCustomization;
  customizationSignature?: string;
  createdAt: string;
};

export type UserOrderDto = {
  orderRef: string;
  placedAt: string;
  lastUpdatedAt: string;
  status: AdminOrderDto["status"];
  totalAmount: number;
  itemsSummary: string;
  itemCount: number;
  deliveryAddressLabel?: string;
  paymentMethod?: PaymentMethod;
  transactionStatus?: TransactionStatus;
  transactionId?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  shippingProvider?: ShippingProvider;
  shippingProviderStatus?: string;
  shippingAwb?: string;
  shippingShipmentId?: string;
  shippingPickupRequestId?: string;
  shippingError?: string;
  shippingLastSyncedAt?: string;
  items: UserOrderItemDto[];
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
  productImage?: string;
  storeId: string;
  storeName?: string;
  quantity: number;
  totalAmount: number;
  customization?: CartItemCustomization;
  customizationSignature?: string;
  status: AdminOrderDto["status"];
  paymentMethod?: PaymentMethod;
  transactionStatus?: TransactionStatus;
  transactionId?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  shippingProvider?: ShippingProvider;
  shippingProviderStatus?: string;
  shippingAwb?: string;
  shippingShipmentId?: string;
  shippingPickupRequestId?: string;
  shippingError?: string;
  shippingLastSyncedAt?: string;
  deliveryAddress?: ShippingAddressSnapshot;
  pickupAddress?: ShippingAddressSnapshot;
  shippingPackage?: ShippingPackageSnapshot;
  shippingEvents?: ShippingEvent[];
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
  paymentMethod?: PaymentMethod;
  transactionStatus?: TransactionStatus;
  transactionId?: string;
  paymentId?: string;
  razorpayOrderId?: string;
  promoCode?: string;
  discountAmount?: number;
  deliveryFee?: number;
  shippingProvider?: ShippingProvider;
  shippingProviderStatus?: string;
  shippingAwb?: string;
  shippingShipmentId?: string;
  shippingPickupRequestId?: string;
  shippingError?: string;
  shippingLastSyncedAt?: string;
  deliveryAddress?: ShippingAddressSnapshot;
  pickupAddress?: ShippingAddressSnapshot;
  shippingPackage?: ShippingPackageSnapshot;
  shippingEvents?: ShippingEvent[];
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
  primaryCategory?: string;
  primarySubcategory?: string;
  location?: {
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
  };
  categories: StoreCategoryOption[];
  categoryBreakdown?: VendorCategoryAggregate[];
};

export type VendorOnboardingStatus = "pending" | "approved" | "rejected";

export type VendorOnboardingPayload = {
  basicInfo: {
    name: string;
    slug?: string;
    logo?: string;
    banner?: string;
    shortDescription?: string;
    longDescription?: string;
    category: string;
    subcategory?: string;
  };
  owner: {
    fullName?: string;
    email?: string;
    phone?: string;
    alternatePhone?: string;
    profileImage?: string;
  };
  business: {
    businessType: "individual" | "partnership" | "llp" | "private_limited" | "public_limited" | "other";
    legalName?: string;
    gstNumber?: string;
    panNumber?: string;
    fssaiLicense?: string;
    drugLicense?: string;
    shopActLicense?: string;
  };
  location: {
    addressLine1?: string;
    addressLine2?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    geo?: {
      latitude?: number | null;
      longitude?: number | null;
    };
  };
  delivery?: {
    isPickupAvailable?: boolean;
    deliveryRadiusKm?: number;
    deliveryChargeType?: "fixed" | "dynamic" | "range";
    deliveryCharge?: number;
    minDeliveryCharge?: number;
    maxDeliveryCharge?: number;
    estimatedDeliveryTimeMinutes?: number;
    timeSlots?: Array<{
      day: string;
      start: string;
      end: string;
    }>;
  };
  payment?: {
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    upiId?: string;
    bankProofImage?: string;
  };
  productSettings: {
    defaultTaxRate?: number;
    measurementUnits?: string[];
    minOrderValue?: number;
    returnPolicy?: string;
    replacementPolicy?: string;
  };
  operations: {
    workingDays?: string[];
    openingTime?: string;
    closingTime?: string;
    holidayMode?: boolean;
    orderPreparationTimeMinutes?: number;
  };
  media: {
    gallery?: string[];
    introVideo?: string;
  };
  catalog?: {
    categories?: StoreCategoryOption[];
  };
  marketing: {
    couponsEnabled?: boolean;
    featured?: boolean;
    adBudget?: number;
  };
  aiInsights: {
    pricingSuggestionsEnabled?: boolean;
    inventoryAlertsEnabled?: boolean;
    salesInsightsEnabled?: boolean;
    complianceAlertsEnabled?: boolean;
    productRecommendationsEnabled?: boolean;
  };
  meta?: {
    status?: "pending" | "active" | "inactive" | "rejected";
    isVerified?: boolean;
    profileCompletion?: number;
    createdAt?: string;
    updatedAt?: string;
  };
};

export type VendorOnboardingSubmissionDto = {
  id: string;
  email: string;
  userId?: string;
  status: VendorOnboardingStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  approvedStoreId?: string;
  businessName: string;
  ownerName?: string;
  ownerPhone?: string;
  category?: string;
  city?: string;
  state?: string;
  pincode?: string;
  payload: VendorOnboardingPayload;
  updatedAt: string;
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
  trending: ProductListItemDto[];
  bestSellers: ProductListItemDto[];
  signaturePicks: ProductListItemDto[];
  categories: string[];
};

export type HomeRankingConfig = {
  trending: {
    recentQuantityWeight: number;
    recentOrdersWeight: number;
    ratingWeight: number;
    reviewsWeight: number;
    offerWeight: number;
    featuredBoost: number;
  };
  bestSellers: {
    totalQuantityWeight: number;
    totalOrdersWeight: number;
    revenueWeight: number;
    ratingWeight: number;
    reviewsWeight: number;
  };
  signaturePicks: {
    premiumSignalWeight: number;
    qualityWeight: number;
    discountWeight: number;
    trustWeight: number;
    demandWeight: number;
    signaturePriceThreshold: number;
    highPriceThreshold: number;
  };
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
  totalCoupons: number;
  activeCoupons: number;
  totalCouponRedemptions: number;
};
