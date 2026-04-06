import { ObjectId } from "mongodb";
import { products as seedProducts } from "@/data/products";
import { getMongoDb } from "@/lib/mongodb";
import { ensureAuthUserRole } from "@/lib/server/otp-service";
import {
  AdminDashboardPayload,
  AdminOrderDto,
  CommentDto,
  HomePayload,
  HomeRankingConfig,
  OrderTrackingStep,
  OfferDto,
  ProductDetailsDto,
  ProductListItemDto,
  ProfileDto,
  RiderDto,
  ReviewDto,
  SearchMeta,
  SortOption,
  StoreCategoryOption,
  StoreDto,
  Role,
  UserOrderDetailsDto,
  UserOrderDto,
  UserNotificationDto,
  VendorOnboardingPayload,
  VendorOnboardingStatus,
  VendorOnboardingSubmissionDto,
  VendorSummaryDto,
} from "@/types/api";
import { Product, ProductAttribute, ProductMediaItem, ProductVariant } from "@/types/ecommerce";

type StoreDoc = StoreDto & {
  details?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

type OfferDoc = {
  _id?: ObjectId;
  id: string;
  productId: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  deliveryEtaHours: number;
};

type ProductDoc = Product;

type ReviewDoc = {
  _id?: ObjectId;
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  helpfulCount: number;
};

type CommentDoc = {
  _id?: ObjectId;
  id: string;
  productId: string;
  reviewId?: string;
  author: string;
  message: string;
  createdAt: string;
};

type UserDoc = {
  _id?: ObjectId;
  role?: string;
  fullName?: string;
  email: string;
  emailVerified?: Date;
  phone?: string;
  profileImage?: string;
  addresses?: ProfileDto["addresses"];
  preferences?: ProfileDto["preferences"];
  notificationReadIds?: string[];
  notificationLastReadAt?: string;
  updatedAt?: string;
};

type RiderDoc = RiderDto;
type OrderDoc = AdminOrderDto & {
  _id?: ObjectId;
  customerUserObjectId?: ObjectId;
  storeObjectId?: ObjectId;
  productObjectId?: ObjectId;
};

type VendorOnboardingSubmissionDoc = {
  _id?: ObjectId;
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

type GlobalCategorySettingsDoc = {
  _id: string;
  categories: StoreCategoryOption[];
  customizableCategories?: string[];
  updatedAt: string;
  updatedBy: string;
};

type HomeRankingSettingsDoc = {
  _id: string;
  config: HomeRankingConfig;
  updatedAt: string;
  updatedBy: string;
};

export type GlobalCategorySettingsDto = {
  categories: StoreCategoryOption[];
  customizableCategories: string[];
};

type AdminScope = {
  role: Role;
  userId: string;
};

const GLOBAL_CATEGORY_SETTINGS_DOC_ID = "global-categories";
const HOME_RANKING_SETTINGS_DOC_ID = "home-ranking";
const FALLBACK_PRODUCT_IMAGE = "/products/placeholder.png";
const DEFAULT_SHORT_DESCRIPTION_MAX_LENGTH = 180;

const DEFAULT_HOME_RANKING_CONFIG: HomeRankingConfig = {
  trending: {
    recentQuantityWeight: 8,
    recentOrdersWeight: 2,
    ratingWeight: 7,
    reviewsWeight: 3,
    offerWeight: 0.8,
    featuredBoost: 4,
  },
  bestSellers: {
    totalQuantityWeight: 6,
    totalOrdersWeight: 3,
    revenueWeight: 0.004,
    ratingWeight: 4,
    reviewsWeight: 2,
  },
  signaturePicks: {
    premiumSignalWeight: 1,
    qualityWeight: 1,
    discountWeight: 5,
    trustWeight: 1,
    demandWeight: 1,
    signaturePriceThreshold: 1200,
    highPriceThreshold: 1800,
  },
};

const DEMO_PROFILE_KEY = "demo";

function toObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function objectIdToString(value: unknown) {
  if (value instanceof ObjectId) {
    return value.toHexString();
  }

  if (typeof value === "string" && ObjectId.isValid(value)) {
    return value;
  }

  return undefined;
}

function mapOrderDocToDto(order: OrderDoc): AdminOrderDto {
  const { _id, customerUserObjectId, ...rest } = order;
  void _id;
  return {
    ...rest,
    ...(rest.customerUserId ? {} : customerUserObjectId ? { customerUserId: customerUserObjectId.toHexString() } : {}),
  };
}

function profileDocToDto(doc: UserDoc): ProfileDto {
  const userId = doc._id?.toString() ?? "";
  const fullName = doc.fullName ?? "Gifta User";
  return {
    userId,
    fullName,
    email: doc.email,
    phone: doc.phone,
    profileImage: doc.profileImage,
    addresses: normalizeProfileAddresses(doc.addresses, fullName, doc.phone),
    preferences: {
      occasions: doc.preferences?.occasions ?? ["Birthday", "Anniversary"],
      budgetMin: doc.preferences?.budgetMin ?? 1000,
      budgetMax: doc.preferences?.budgetMax ?? 5000,
      preferredTags: doc.preferences?.preferredTags ?? ["same-day", "premium"],
    },
    updatedAt: doc.updatedAt ?? new Date().toISOString(),
  };
}

function toMap<T extends { id: string }>(list: T[]) {
  return new Map(list.map((entry) => [entry.id, entry]));
}

function normalizePhoneList(values: Array<unknown> | undefined, fallbackPhone?: string) {
  const normalized = Array.from(
    new Set(
      (values ?? [])
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => Boolean(entry)),
    ),
  );

  if (!normalized.length && fallbackPhone?.trim()) {
    return [fallbackPhone.trim()];
  }

  return normalized;
}

function resolveReceiverPhones(address: ProfileDto["addresses"][number], fallbackPhone?: string) {
  const existing = normalizePhoneList(address.receiverPhones, fallbackPhone);
  if (existing.length) {
    return existing;
  }

  if (typeof address.receiverPhone === "string" && address.receiverPhone.trim()) {
    const parsed = address.receiverPhone
      .split(",")
      .map((entry) => entry.trim())
      .filter((entry) => Boolean(entry));
    const normalizedParsed = normalizePhoneList(parsed, fallbackPhone);
    if (normalizedParsed.length) {
      return normalizedParsed;
    }
  }

  return normalizePhoneList([], fallbackPhone);
}

function normalizeProfileAddresses(addresses: ProfileDto["addresses"] | undefined, fallbackName: string, fallbackPhone?: string) {
  return (addresses ?? []).map((address) => {
    const receiverPhones = resolveReceiverPhones(address as ProfileDto["addresses"][number], fallbackPhone);
    return {
      label: address.label,
      receiverName: (address as ProfileDto["addresses"][number]).receiverName ?? fallbackName,
      receiverPhone: receiverPhones[0] ?? fallbackPhone ?? "",
      receiverPhones,
      line1: address.line1,
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      country: address.country,
    };
  });
}

function toShortDescription(value: string, maxLength = DEFAULT_SHORT_DESCRIPTION_MAX_LENGTH) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const shortened = lastSpace > 80 ? slice.slice(0, lastSpace) : slice;
  return `${shortened.trim()}...`;
}

function stripHtmlToText(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function normalizeRichHtmlField(value: string | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  return stripHtmlToText(trimmed).length ? trimmed : "";
}

function normalizeDescriptionField(value: string | undefined) {
  const normalized = normalizeRichHtmlField(value);
  if (!normalized) {
    return "Handpicked gift item";
  }

  return normalized;
}

function toBoundedNumber(value: number | undefined, fallback: number, min: number, max: number) {
  if (typeof value !== "number" || Number.isNaN(value) || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, value));
}

function toNormalizedHomeRankingConfig(input: HomeRankingConfig | undefined): HomeRankingConfig {
  const source = input ?? DEFAULT_HOME_RANKING_CONFIG;

  return {
    trending: {
      recentQuantityWeight: toBoundedNumber(source.trending?.recentQuantityWeight, DEFAULT_HOME_RANKING_CONFIG.trending.recentQuantityWeight, 0, 100),
      recentOrdersWeight: toBoundedNumber(source.trending?.recentOrdersWeight, DEFAULT_HOME_RANKING_CONFIG.trending.recentOrdersWeight, 0, 100),
      ratingWeight: toBoundedNumber(source.trending?.ratingWeight, DEFAULT_HOME_RANKING_CONFIG.trending.ratingWeight, 0, 100),
      reviewsWeight: toBoundedNumber(source.trending?.reviewsWeight, DEFAULT_HOME_RANKING_CONFIG.trending.reviewsWeight, 0, 100),
      offerWeight: toBoundedNumber(source.trending?.offerWeight, DEFAULT_HOME_RANKING_CONFIG.trending.offerWeight, 0, 100),
      featuredBoost: toBoundedNumber(source.trending?.featuredBoost, DEFAULT_HOME_RANKING_CONFIG.trending.featuredBoost, 0, 100),
    },
    bestSellers: {
      totalQuantityWeight: toBoundedNumber(source.bestSellers?.totalQuantityWeight, DEFAULT_HOME_RANKING_CONFIG.bestSellers.totalQuantityWeight, 0, 100),
      totalOrdersWeight: toBoundedNumber(source.bestSellers?.totalOrdersWeight, DEFAULT_HOME_RANKING_CONFIG.bestSellers.totalOrdersWeight, 0, 100),
      revenueWeight: toBoundedNumber(source.bestSellers?.revenueWeight, DEFAULT_HOME_RANKING_CONFIG.bestSellers.revenueWeight, 0, 5),
      ratingWeight: toBoundedNumber(source.bestSellers?.ratingWeight, DEFAULT_HOME_RANKING_CONFIG.bestSellers.ratingWeight, 0, 100),
      reviewsWeight: toBoundedNumber(source.bestSellers?.reviewsWeight, DEFAULT_HOME_RANKING_CONFIG.bestSellers.reviewsWeight, 0, 100),
    },
    signaturePicks: {
      premiumSignalWeight: toBoundedNumber(source.signaturePicks?.premiumSignalWeight, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.premiumSignalWeight, 0, 100),
      qualityWeight: toBoundedNumber(source.signaturePicks?.qualityWeight, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.qualityWeight, 0, 100),
      discountWeight: toBoundedNumber(source.signaturePicks?.discountWeight, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.discountWeight, 0, 100),
      trustWeight: toBoundedNumber(source.signaturePicks?.trustWeight, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.trustWeight, 0, 100),
      demandWeight: toBoundedNumber(source.signaturePicks?.demandWeight, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.demandWeight, 0, 100),
      signaturePriceThreshold: toBoundedNumber(source.signaturePicks?.signaturePriceThreshold, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.signaturePriceThreshold, 0, 500000),
      highPriceThreshold: toBoundedNumber(source.signaturePicks?.highPriceThreshold, DEFAULT_HOME_RANKING_CONFIG.signaturePicks.highPriceThreshold, 0, 500000),
    },
  };
}

function inferMediaTypeFromUrl(url: string): "image" | "video" {
  const normalized = url.trim().toLowerCase();
  if (!normalized) {
    return "image";
  }

  if (normalized.includes("/video/upload/")) {
    return "video";
  }

  if (/\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(normalized)) {
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

function toNormalizedProductMedia(inputMedia: ProductMediaItem[] | undefined, inputImages: string[] | undefined) {
  const normalizedMap = new Map<string, ProductMediaItem>();

  const pushMedia = (item: ProductMediaItem) => {
    const url = item.url?.trim();
    if (!url) {
      return;
    }

    const type = item.type === "video" ? "video" : "image";
    const thumbnailUrl = type === "video"
      ? item.thumbnailUrl?.trim() || deriveCloudinaryVideoThumbnail(url)
      : undefined;

    const key = `${type}:${url.toLowerCase()}`;
    normalizedMap.set(key, {
      type,
      url,
      ...(thumbnailUrl ? { thumbnailUrl } : {}),
      ...(item.alt?.trim() ? { alt: item.alt.trim() } : {}),
    });
  };

  for (const mediaItem of inputMedia ?? []) {
    if (!mediaItem || typeof mediaItem !== "object") {
      continue;
    }

    pushMedia({
      type: mediaItem.type,
      url: mediaItem.url,
      thumbnailUrl: mediaItem.thumbnailUrl,
      alt: mediaItem.alt,
    });
  }

  for (const imageUrl of inputImages ?? []) {
    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      continue;
    }

    const trimmed = imageUrl.trim();
    const inferredType = inferMediaTypeFromUrl(trimmed);
    pushMedia({
      type: inferredType,
      url: trimmed,
      ...(inferredType === "video" ? { thumbnailUrl: deriveCloudinaryVideoThumbnail(trimmed) } : {}),
    });
  }

  const normalized = Array.from(normalizedMap.values());
  if (!normalized.length) {
    return [{ type: "image" as const, url: FALLBACK_PRODUCT_IMAGE }];
  }

  return normalized;
}

function toDisplayImagesFromMedia(media: ProductMediaItem[]) {
  const display = media
    .map((entry) => {
      if (entry.type === "image") {
        return entry.url.trim();
      }

      const thumbnail = entry.thumbnailUrl?.trim() || deriveCloudinaryVideoThumbnail(entry.url);
      return thumbnail || "";
    })
    .filter(Boolean);

  return display.length ? display : [FALLBACK_PRODUCT_IMAGE];
}

function normalizeInventoryProduct(product: ProductDoc): ProductDoc {
  const productWithOptionalId = { ...(product as ProductDoc & { _id?: ObjectId }) };
  delete productWithOptionalId._id;
  const rest = productWithOptionalId as ProductDoc;
  const minOrderQty = typeof product.minOrderQty === "number" ? Math.max(1, Math.floor(product.minOrderQty)) : 1;
  const rawMax = typeof product.maxOrderQty === "number" ? Math.max(0, Math.floor(product.maxOrderQty)) : 10;
  const hiddenByQty = rawMax === 0;
  const maxOrderQty = hiddenByQty ? 0 : Math.max(minOrderQty, rawMax);
  const normalizedMedia = toNormalizedProductMedia(product.media, product.images);
  const normalizedImages = toDisplayImagesFromMedia(normalizedMedia);
  const normalizedDescription = normalizeDescriptionField(product.description);
  const descriptionText = stripHtmlToText(normalizedDescription);
  const normalizedShortDescription = typeof product.shortDescription === "string" && product.shortDescription.trim()
    ? toShortDescription(product.shortDescription)
    : toShortDescription(descriptionText || normalizedDescription);

  return {
    ...rest,
    description: normalizedDescription,
    shortDescription: normalizedShortDescription,
    media: normalizedMedia,
    images: normalizedImages,
    minOrderQty,
    maxOrderQty,
    inStock: product.inStock && !hiddenByQty,
  };
}

function normalizeProductAttributes(attributes: ProductAttribute[] | undefined): ProductAttribute[] {
  if (!Array.isArray(attributes)) {
    return [];
  }

  const names = new Set<string>();
  const normalized: ProductAttribute[] = [];
  for (const attribute of attributes) {
    const name = attribute.name.trim();
    if (!name || names.has(name)) {
      continue;
    }
    const values = Array.from(new Set((attribute.values ?? []).map((value) => value.trim()).filter(Boolean)));
    if (!values.length) {
      continue;
    }
    names.add(name);
    normalized.push({ name, values });
  }

  return normalized;
}

function isVariantMappedToAttributes(variant: ProductVariant, attributes: ProductAttribute[]) {
  const optionEntries = Object.entries(variant.options ?? {});
  if (!optionEntries.length) {
    return false;
  }

  for (const attribute of attributes) {
    const selectedValue = variant.options[attribute.name];
    if (!selectedValue || !attribute.values.includes(selectedValue)) {
      return false;
    }
  }

  for (const [name] of optionEntries) {
    if (!attributes.some((attribute) => attribute.name === name)) {
      return false;
    }
  }

  return true;
}

function normalizeProductVariants(variants: ProductVariant[] | undefined, attributes: ProductAttribute[]): ProductVariant[] {
  if (!Array.isArray(variants) || !variants.length || !attributes.length) {
    return [];
  }

  const signatures = new Set<string>();
  const normalized: ProductVariant[] = [];
  for (const variant of variants) {
    const id = variant.id.trim();
    if (!id) {
      continue;
    }

    const options: Record<string, string> = {};
    for (const attribute of attributes) {
      const value = variant.options?.[attribute.name]?.trim();
      if (!value || !attribute.values.includes(value)) {
        continue;
      }
      options[attribute.name] = value;
    }

    if (Object.keys(options).length !== attributes.length) {
      continue;
    }

    const signature = attributes
      .map((attribute) => `${attribute.name}:${options[attribute.name]}`)
      .join("|");

    if (signatures.has(signature)) {
      continue;
    }
    signatures.add(signature);

    const size = typeof variant.size === "string" ? variant.size.trim() : "";
    const width = typeof variant.width === "number" && Number.isFinite(variant.width)
      ? Math.max(0, variant.width)
      : undefined;
    const height = typeof variant.height === "number" && Number.isFinite(variant.height)
      ? Math.max(0, variant.height)
      : undefined;
    const hasDimensions = width !== undefined || height !== undefined;
    const dimensionUnit = variant.dimensionUnit === "cm" ? "cm" : undefined;

    normalized.push({
      id,
      options,
      salePrice: Math.max(0, variant.salePrice),
      regularPrice: typeof variant.regularPrice === "number" ? Math.max(0, variant.regularPrice) : undefined,
      weight: typeof variant.weight === "number" ? Math.max(0, variant.weight) : undefined,
      weightUnit: variant.weightUnit === "kg" ? "kg" : variant.weightUnit === "g" ? "g" : undefined,
      ...(size ? { size } : {}),
      ...(width !== undefined ? { width } : {}),
      ...(height !== undefined ? { height } : {}),
      ...(hasDimensions ? { dimensionUnit: dimensionUnit ?? "cm" } : {}),
      inStock: variant.inStock ?? true,
    });
  }

  return normalized;
}

function isPurchasableProduct(product: ProductDoc) {
  const normalized = normalizeInventoryProduct(product);
  return normalized.inStock && (normalized.maxOrderQty ?? 10) > 0;
}

function toStoreCategoryOptions(details: StoreDoc["details"]): StoreCategoryOption[] {
  const raw = (details as { catalog?: { categories?: unknown } } | undefined)?.catalog?.categories;
  if (!Array.isArray(raw)) {
    return [];
  }

  const normalized: StoreCategoryOption[] = [];
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const categoryName = typeof (entry as { name?: unknown }).name === "string"
      ? (entry as { name: string }).name.trim()
      : "";

    if (!categoryName) {
      continue;
    }

    const rawSubcategories = (entry as { subcategories?: unknown }).subcategories;
    const image = typeof (entry as { image?: unknown }).image === "string"
      ? (entry as { image: string }).image.trim()
      : "";
    const subcategories = Array.isArray(rawSubcategories)
      ? rawSubcategories
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter((value) => Boolean(value))
      : [];

    normalized.push({
      name: categoryName,
      subcategories: Array.from(new Set(subcategories)),
      ...(image ? { image } : {}),
    });
  }

  return normalized;
}

function toNormalizedStoreCategoryOptions(entries: StoreCategoryOption[]) {
  const categoryMap = new Map<string, StoreCategoryOption>();

  for (const entry of entries) {
    if (!entry || typeof entry !== "object") {
      continue;
    }

    const name = entry.name?.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    const existing = categoryMap.get(key);
    const nextImage = entry.image?.trim() || "";
    const nextSubcategories = (entry.subcategories ?? []).map((subcategory) => subcategory.trim()).filter(Boolean);

    if (!existing) {
      categoryMap.set(key, {
        name,
        subcategories: Array.from(new Set(nextSubcategories)),
        ...(nextImage ? { image: nextImage } : {}),
      });
      continue;
    }

    const mergedSubcategories = Array.from(new Set([...existing.subcategories, ...nextSubcategories]));
    const mergedImage = existing.image?.trim() || nextImage;
    categoryMap.set(key, {
      name: existing.name,
      subcategories: mergedSubcategories,
      ...(mergedImage ? { image: mergedImage } : {}),
    });
  }

  return Array.from(categoryMap.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function toNormalizedCategoryValueList(entries: string[] | undefined) {
  if (!Array.isArray(entries)) {
    return [] as string[];
  }

  return Array.from(new Set(entries.map((entry) => entry.trim()).filter(Boolean))).sort((left, right) => left.localeCompare(right));
}

function getStoreBasicInfo(details: StoreDoc["details"]) {
  const basicInfo = (details as { basicInfo?: { category?: unknown; subcategory?: unknown } } | undefined)?.basicInfo;
  return {
    category: typeof basicInfo?.category === "string" ? basicInfo.category.trim() : "",
    subcategory: typeof basicInfo?.subcategory === "string" ? basicInfo.subcategory.trim() : "",
  };
}

async function getCollections() {
  const db = await getMongoDb();

  return {
    users: db.collection<UserDoc>("users"),
    products: db.collection<ProductDoc>("products"),
    stores: db.collection<StoreDoc>("stores"),
    offers: db.collection<OfferDoc>("offers"),
    reviews: db.collection<ReviewDoc>("reviews"),
    comments: db.collection<CommentDoc>("comments"),
    riders: db.collection<RiderDoc>("riders"),
    orders: db.collection<OrderDoc>("orders"),
    vendorOnboardingSubmissions: db.collection<VendorOnboardingSubmissionDoc>("vendor_onboarding_submissions"),
    globalCategorySettings: db.collection<GlobalCategorySettingsDoc>("global_category_settings"),
    homeRankingSettings: db.collection<HomeRankingSettingsDoc>("home_ranking_settings"),
  };
}

export async function listStores(): Promise<StoreDto[]> {
  const { stores } = await getCollections();
  const docs = await stores.find().sort({ rating: -1, name: 1 }).toArray();
  return docs.map((store) => ({
    id: store.id,
    name: store.name,
    slug: store.slug,
    ownerUserId: store.ownerUserId,
    rating: store.rating,
    active: store.active,
  }));
}

async function getOffersForProducts(productIds: string[], storeId?: string) {
  if (!productIds.length) {
    return {
      offersByProduct: new Map<string, OfferDto[]>(),
      storesById: new Map<string, StoreDto>(),
    };
  }

  const { offers, stores } = await getCollections();
  const offerFilter: Record<string, unknown> = {
    productId: { $in: productIds },
  };

  if (storeId) {
    offerFilter.storeId = storeId;
  }

  const offerDocs = await offers.find(offerFilter).toArray();
  const storeIds = Array.from(new Set(offerDocs.map((entry) => entry.storeId)));
  const storeDocs = await stores.find({ id: { $in: storeIds } }).toArray();
  const storesById = toMap(
    storeDocs.map((store) => ({
      id: store.id,
      name: store.name,
      slug: store.slug,
      ownerUserId: store.ownerUserId,
      rating: store.rating,
      active: store.active,
    })),
  );

  const offersByProduct = new Map<string, OfferDto[]>();
  for (const offer of offerDocs) {
    const mapped: OfferDto = {
      id: offer.id,
      productId: offer.productId,
      storeId: offer.storeId,
      price: offer.price,
      originalPrice: offer.originalPrice,
      inStock: offer.inStock,
      deliveryEtaHours: offer.deliveryEtaHours,
      store: storesById.get(offer.storeId),
    };

    const current = offersByProduct.get(offer.productId) ?? [];
    current.push(mapped);
    offersByProduct.set(offer.productId, current);
  }

  for (const [key, value] of offersByProduct.entries()) {
    offersByProduct.set(
      key,
      value.sort((left, right) => left.price - right.price),
    );
  }

  return { offersByProduct, storesById };
}

function buildComparator(sort: SortOption) {
  if (sort === "price-asc") {
    return (left: ProductListItemDto, right: ProductListItemDto) => {
      const leftPrice = left.bestOffer?.price ?? left.price;
      const rightPrice = right.bestOffer?.price ?? right.price;
      return leftPrice - rightPrice;
    };
  }

  if (sort === "price-desc") {
    return (left: ProductListItemDto, right: ProductListItemDto) => {
      const leftPrice = left.bestOffer?.price ?? left.price;
      const rightPrice = right.bestOffer?.price ?? right.price;
      return rightPrice - leftPrice;
    };
  }

  if (sort === "rating") {
    return (left: ProductListItemDto, right: ProductListItemDto) => right.rating - left.rating;
  }

  return (left: ProductListItemDto, right: ProductListItemDto) => Number(right.featured) - Number(left.featured) || right.rating - left.rating;
}

type ProductSalesSignal = {
  totalOrders: number;
  totalQuantity: number;
  totalRevenue: number;
  recent30Orders: number;
  recent30Quantity: number;
  recent14Quantity: number;
  recent7Quantity: number;
  lastOrderedAt?: string;
};

function toPositiveNumber(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, parsed);
}

function toEmptySalesSignal(): ProductSalesSignal {
  return {
    totalOrders: 0,
    totalQuantity: 0,
    totalRevenue: 0,
    recent30Orders: 0,
    recent30Quantity: 0,
    recent14Quantity: 0,
    recent7Quantity: 0,
  };
}

async function getSalesSignalsByProduct(productIds: string[]) {
  if (!productIds.length) {
    return new Map<string, ProductSalesSignal>();
  }

  const { orders } = await getCollections();
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  const before7Days = new Date(now - 7 * day).toISOString();
  const before14Days = new Date(now - 14 * day).toISOString();
  const before30Days = new Date(now - 30 * day).toISOString();

  const rows = await orders.aggregate<{
    _id: string;
    totalOrders: number;
    totalQuantity: number;
    totalRevenue: number;
    recent30Orders: number;
    recent30Quantity: number;
    recent14Quantity: number;
    recent7Quantity: number;
    lastOrderedAt?: string;
  }>([
    {
      $match: {
        productId: { $in: productIds },
        status: { $ne: "cancelled" },
      },
    },
    {
      $group: {
        _id: "$productId",
        totalOrders: { $sum: 1 },
        totalQuantity: { $sum: { $ifNull: ["$quantity", 0] } },
        totalRevenue: { $sum: { $ifNull: ["$totalAmount", 0] } },
        recent30Orders: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", before30Days] }, 1, 0],
          },
        },
        recent30Quantity: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", before30Days] }, { $ifNull: ["$quantity", 0] }, 0],
          },
        },
        recent14Quantity: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", before14Days] }, { $ifNull: ["$quantity", 0] }, 0],
          },
        },
        recent7Quantity: {
          $sum: {
            $cond: [{ $gte: ["$createdAt", before7Days] }, { $ifNull: ["$quantity", 0] }, 0],
          },
        },
        lastOrderedAt: { $max: "$createdAt" },
      },
    },
  ]).toArray();

  const signals = new Map<string, ProductSalesSignal>();
  for (const row of rows) {
    const productId = typeof row._id === "string" ? row._id.trim() : "";
    if (!productId) {
      continue;
    }

    signals.set(productId, {
      totalOrders: toPositiveNumber(row.totalOrders),
      totalQuantity: toPositiveNumber(row.totalQuantity),
      totalRevenue: toPositiveNumber(row.totalRevenue),
      recent30Orders: toPositiveNumber(row.recent30Orders),
      recent30Quantity: toPositiveNumber(row.recent30Quantity),
      recent14Quantity: toPositiveNumber(row.recent14Quantity),
      recent7Quantity: toPositiveNumber(row.recent7Quantity),
      ...(typeof row.lastOrderedAt === "string" && row.lastOrderedAt.trim() ? { lastOrderedAt: row.lastOrderedAt } : {}),
    });
  }

  return signals;
}

function getEffectiveProductPrice(product: ProductListItemDto) {
  return product.bestOffer?.price ?? product.price;
}

function hasSignatureTag(product: ProductListItemDto) {
  const signatureTokens = ["signature", "premium", "luxury", "exclusive", "artisan", "handmade", "custom"];
  return product.tags.some((tag) => signatureTokens.some((token) => tag.toLowerCase().includes(token)));
}

function rankHomeSectionProducts(input: {
  candidates: ProductListItemDto[];
  salesSignals: Map<string, ProductSalesSignal>;
  limit: number;
  scorer: (product: ProductListItemDto, signal: ProductSalesSignal) => number;
  filter?: (product: ProductListItemDto, signal: ProductSalesSignal) => boolean;
}) {
  const seen = new Set<string>();
  const rows = input.candidates
    .filter((product) => {
      if (seen.has(product.id)) {
        return false;
      }

      seen.add(product.id);
      return true;
    })
    .map((product) => {
      const signal = input.salesSignals.get(product.id) ?? toEmptySalesSignal();
      if (input.filter && !input.filter(product, signal)) {
        return null;
      }

      return {
        product,
        score: input.scorer(product, signal),
      };
    })
    .filter((entry): entry is { product: ProductListItemDto; score: number } => Boolean(entry && Number.isFinite(entry.score)))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (right.product.rating !== left.product.rating) {
        return right.product.rating - left.product.rating;
      }

      if (right.product.reviews !== left.product.reviews) {
        return right.product.reviews - left.product.reviews;
      }

      return left.product.name.localeCompare(right.product.name);
    });

  return rows.slice(0, input.limit).map((entry) => entry.product);
}

export async function getHomeData(): Promise<HomePayload> {
  const { products } = await getCollections();
  const productDocs = (await products.find().toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct);
  const productIds = productDocs.map((entry) => entry.id);
  const [offersData, salesSignals, rankingConfig] = await Promise.all([
    getOffersForProducts(productIds),
    getSalesSignalsByProduct(productIds),
    getHomeRankingConfig(),
  ]);

  const realStoreProducts: ProductListItemDto[] = [];
  for (const product of productDocs) {
    const offers = (offersData.offersByProduct.get(product.id) ?? []).filter(
      (offer) => offer.inStock && Boolean(offer.store?.id) && Boolean(offer.store?.active),
    );

    if (!offers.length) {
      continue;
    }

    realStoreProducts.push({
      ...product,
      bestOffer: offers[0],
      offerCount: offers.length,
    });
  }

  const trending = rankHomeSectionProducts({
    candidates: realStoreProducts,
    salesSignals,
    limit: 8,
    filter: (_product, signal) => signal.recent30Orders > 0 || signal.recent30Quantity > 0,
    scorer: (product, signal) => {
      const momentum = signal.recent7Quantity * rankingConfig.trending.recentQuantityWeight
        + signal.recent14Quantity * (rankingConfig.trending.recentQuantityWeight / 2)
        + signal.recent30Orders * rankingConfig.trending.recentOrdersWeight;
      const socialProof = product.rating * rankingConfig.trending.ratingWeight
        + Math.log1p(product.reviews) * rankingConfig.trending.reviewsWeight;
      const merchandising = product.offerCount * rankingConfig.trending.offerWeight
        + (product.featured ? rankingConfig.trending.featuredBoost : 0);
      return momentum + socialProof + merchandising;
    },
  });

  const trendingFallback = trending.length
    ? trending
    : rankHomeSectionProducts({
      candidates: realStoreProducts,
      salesSignals,
      limit: 8,
      scorer: (product, signal) => {
        const socialProof = product.rating * 8 + Math.log1p(product.reviews) * 2;
        const demand = signal.recent30Orders * 4 + signal.totalOrders * 1.5;
        return socialProof + demand;
      },
    });

  const bestSellers = rankHomeSectionProducts({
    candidates: realStoreProducts,
    salesSignals,
    limit: 8,
    filter: (_product, signal) => signal.totalQuantity > 0,
    scorer: (product, signal) => {
      const sellThrough = signal.totalQuantity * rankingConfig.bestSellers.totalQuantityWeight
        + signal.totalOrders * rankingConfig.bestSellers.totalOrdersWeight;
      const revenueWeight = signal.totalRevenue * rankingConfig.bestSellers.revenueWeight;
      const quality = product.rating * rankingConfig.bestSellers.ratingWeight
        + Math.log1p(product.reviews) * rankingConfig.bestSellers.reviewsWeight;
      return sellThrough + revenueWeight + quality;
    },
  });

  const bestSellerFallback = bestSellers.length
    ? bestSellers
    : rankHomeSectionProducts({
      candidates: realStoreProducts,
      salesSignals,
      limit: 8,
      scorer: (product, signal) => {
        const demand = signal.totalOrders * 3 + signal.recent30Orders * 4;
        const quality = product.rating * 6 + Math.log1p(product.reviews) * 2;
        return demand + quality;
      },
    });

  const signatureCandidates = realStoreProducts.filter((product) => {
    if (product.featured) {
      return true;
    }

    if (hasSignatureTag(product)) {
      return true;
    }

    return getEffectiveProductPrice(product) >= 1200 || product.rating >= 4.4;
  });

  const signaturePicks = rankHomeSectionProducts({
    candidates: signatureCandidates.length ? signatureCandidates : realStoreProducts,
    salesSignals,
    limit: 5,
    scorer: (product, signal) => {
      const bestPrice = getEffectiveProductPrice(product);
      const listPrice = product.bestOffer?.originalPrice ?? product.originalPrice ?? bestPrice;
      const discountRate = listPrice > 0 ? Math.max(0, Math.min(1, (listPrice - bestPrice) / listPrice)) : 0;
      const premiumSignals = (hasSignatureTag(product) ? 10 : 0)
        + (product.featured ? 8 : 0)
        + (bestPrice >= rankingConfig.signaturePicks.highPriceThreshold
          ? 4
          : bestPrice >= rankingConfig.signaturePicks.signaturePriceThreshold
            ? 2
            : 0);
      const quality = product.rating * 10 + Math.log1p(product.reviews) * 4;
      const trust = (product.bestOffer?.store?.rating ?? 0) * 2 + ((product.bestOffer?.deliveryEtaHours ?? 24) <= 6 ? 2 : 0);
      const demand = signal.recent30Orders * 1.5 + signal.totalOrders * 0.5;
      return premiumSignals * rankingConfig.signaturePicks.premiumSignalWeight
        + quality * rankingConfig.signaturePicks.qualityWeight
        + discountRate * rankingConfig.signaturePicks.discountWeight
        + trust * rankingConfig.signaturePicks.trustWeight
        + demand * rankingConfig.signaturePicks.demandWeight;
    },
  });

  const topRated = rankHomeSectionProducts({
    candidates: realStoreProducts,
    salesSignals,
    limit: 6,
    scorer: (product) => product.rating * 10 + Math.log1p(product.reviews) * 3 + product.offerCount,
  });

  const featured = (trendingFallback.length ? trendingFallback : topRated).slice(0, 6);

  const rawCategories = await products.distinct("category");
  const dbCategories = Array.from(
    new Set(
      rawCategories
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right));

  return {
    featured,
    topRated,
    trending: trendingFallback,
    bestSellers: bestSellerFallback,
    signaturePicks,
    categories: dbCategories,
  };
}

export async function getProfile(userId = DEMO_PROFILE_KEY): Promise<ProfileDto | null> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const { users } = await getCollections();
  const doc = await users.findOne({ _id: objectId });
  if (!doc) {
    return null;
  }

  return profileDocToDto(doc);
}

export async function upsertProfile(
  update: {
    fullName?: string;
    email?: string;
    phone?: string;
    profileImage?: string;
    addresses?: ProfileDto["addresses"];
    preferences?: Partial<ProfileDto["preferences"]>;
  },
  userId = DEMO_PROFILE_KEY,
): Promise<ProfileDto> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  const { users } = await getCollections();
  const existing = await users.findOne({ _id: objectId });

  const nextDoc: Omit<UserDoc, "_id"> = {
    role: existing?.role,
    fullName: update.fullName ?? existing?.fullName ?? "Gifta Guest",
    email: update.email ?? existing?.email ?? "guest@gifta.local",
    phone: update.phone ?? existing?.phone,
    profileImage: update.profileImage ?? existing?.profileImage,
    addresses: normalizeProfileAddresses(
      update.addresses ?? existing?.addresses,
      update.fullName ?? existing?.fullName ?? "Gifta Guest",
      update.phone ?? existing?.phone,
    ),
    preferences: {
      occasions: update.preferences?.occasions ?? existing?.preferences?.occasions ?? ["Birthday", "Anniversary"],
      budgetMin: update.preferences?.budgetMin ?? existing?.preferences?.budgetMin ?? 1000,
      budgetMax: update.preferences?.budgetMax ?? existing?.preferences?.budgetMax ?? 5000,
      preferredTags: update.preferences?.preferredTags ?? existing?.preferences?.preferredTags ?? ["same-day", "premium"],
    },
    updatedAt: new Date().toISOString(),
  };

  await users.updateOne(
    { _id: objectId },
    {
      $set: nextDoc,
      $unset: {
        name: "",
      },
    },
    { upsert: true },
  );

  return profileDocToDto({
    _id: objectId,
    ...nextDoc,
  });
}

export async function searchItems(filters: {
  q?: string;
  category?: string;
  tag?: string;
  sort: SortOption;
  stock?: boolean;
  page: number;
  pageSize: number;
  minPrice?: number;
  maxPrice?: number;
  storeId?: string;
  minRating?: number;
}): Promise<{ items: ProductListItemDto[]; meta: SearchMeta }> {
  const { products, offers, stores } = await getCollections();

  const query: Record<string, unknown> = {};

  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q), "i");
    const matchedStores = await stores.find({ name: regex }, { projection: { id: 1 } }).toArray();
    const matchedStoreIds = matchedStores.map((entry) => entry.id);
    const matchedStoreProductIds = matchedStoreIds.length
      ? await offers.distinct("productId", { storeId: { $in: matchedStoreIds } })
      : [];

    query.$or = [
      { name: regex },
      { shortDescription: regex },
      { description: regex },
      { tags: regex },
      ...(matchedStoreProductIds.length ? [{ id: { $in: matchedStoreProductIds } }] : []),
    ];
  }

  if (filters.category) {
    query.category = filters.category;
  }

  if (filters.tag) {
    query.tags = filters.tag;
  }

  if (typeof filters.minRating === "number") {
    query.rating = { $gte: filters.minRating };
  }

  const shouldFilterOffers =
    typeof filters.stock === "boolean" ||
    typeof filters.minPrice === "number" ||
    typeof filters.maxPrice === "number" ||
    Boolean(filters.storeId);

  if (shouldFilterOffers) {
    const offerQuery: Record<string, unknown> = {};
    if (typeof filters.stock === "boolean") {
      offerQuery.inStock = filters.stock;
    }
    if (typeof filters.minPrice === "number" || typeof filters.maxPrice === "number") {
      offerQuery.price = {
        ...(typeof filters.minPrice === "number" ? { $gte: filters.minPrice } : {}),
        ...(typeof filters.maxPrice === "number" ? { $lte: filters.maxPrice } : {}),
      };
    }
    if (filters.storeId) {
      offerQuery.storeId = filters.storeId;
    }

    const productIds = await offers.distinct("productId", offerQuery);
    if (!productIds.length) {
      return {
        items: [],
        meta: {
          total: 0,
          totalPages: 1,
          page: 1,
          pageSize: filters.pageSize,
          filters,
        },
      };
    }
    query.id = { $in: productIds };
  }

  const docs = (await products.find(query).toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct);
  const { offersByProduct } = await getOffersForProducts(
    docs.map((entry) => entry.id),
    filters.storeId,
  );

  const withOffers: ProductListItemDto[] = docs.map((product) => {
    const productOffers = offersByProduct.get(product.id) ?? [];
    return {
      ...product,
      bestOffer: productOffers[0],
      offerCount: productOffers.length,
    };
  });

  const sorted = withOffers.sort(buildComparator(filters.sort));
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const safePage = Math.min(Math.max(filters.page, 1), totalPages);
  const start = (safePage - 1) * filters.pageSize;

  return {
    items: sorted.slice(start, start + filters.pageSize),
    meta: {
      total,
      totalPages,
      page: safePage,
      pageSize: filters.pageSize,
      filters,
    },
  };
}

export async function createStoreForAdmin(
  payload: {
    basicInfo: {
      name: string;
      slug?: string;
    };
    ownerUserId?: string;
    meta?: {
      status?: string;
      isVerified?: boolean;
      profileCompletion?: number;
      createdAt?: string;
      updatedAt?: string;
    };
  } & Record<string, unknown>,
  scope: AdminScope,
): Promise<StoreDto> {
  const { stores } = await getCollections();
  const now = new Date().toISOString();
  const baseSlug = (payload.basicInfo.slug?.trim() || payload.basicInfo.name.trim())
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 80) || `store-${Date.now()}`;

  let slug = baseSlug;
  let suffix = 1;
  while (await stores.findOne({ slug })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const id = `store-${new ObjectId().toHexString().slice(-10)}`;
  const ownerUserId = payload.ownerUserId?.trim() || (scope.role === "STORE_OWNER" ? scope.userId : undefined);
  const isActive = (payload.meta?.status ?? "").trim().toLowerCase() === "active";

  const doc: StoreDoc = {
    id,
    name: payload.basicInfo.name.trim(),
    slug,
    ownerUserId,
    rating: 0,
    active: isActive,
    details: payload,
    createdAt: payload.meta?.createdAt ?? now,
    updatedAt: payload.meta?.updatedAt ?? now,
  };

  await stores.insertOne(doc);

  return {
    id: doc.id,
    name: doc.name,
    slug: doc.slug,
    ownerUserId: doc.ownerUserId,
    rating: doc.rating,
    active: doc.active,
  };
}

export async function getItemBySlug(slug: string): Promise<ProductDetailsDto | null> {
  const { products, reviews } = await getCollections();
  const productRaw = await products.findOne({ slug });
  const product = productRaw ? normalizeInventoryProduct(productRaw) : null;

  if (!product) {
    return null;
  }

  if (!isPurchasableProduct(product)) {
    return null;
  }

  const { offersByProduct } = await getOffersForProducts([product.id]);
  const productOffers = offersByProduct.get(product.id) ?? [];
  const reviewDocs = await reviews.find({ productId: product.id }).sort({ createdAt: -1 }).toArray();
  const relatedDocs = (await products.find({ category: product.category, id: { $ne: product.id } }).limit(12).toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct)
    .slice(0, 4);
  const relatedOffers = await getOffersForProducts(relatedDocs.map((entry) => entry.id));

  const suggestions: ProductListItemDto[] = relatedDocs.map((entry) => {
    const offers = relatedOffers.offersByProduct.get(entry.id) ?? [];
    return {
      ...entry,
      bestOffer: offers[0],
      offerCount: offers.length,
    };
  });

  const totalReviews = reviewDocs.length;
  const averageRating =
    totalReviews === 0
      ? product.rating
      : Number((reviewDocs.reduce((sum, entry) => sum + entry.rating, 0) / totalReviews).toFixed(1));

  return {
    ...product,
    offers: productOffers,
    reviewSummary: {
      averageRating,
      totalReviews,
    },
    suggestions,
  };
}

export async function getItemOffers(slug: string): Promise<OfferDto[] | null> {
  const { products } = await getCollections();
  const product = await products.findOne({ slug });
  if (!product) {
    return null;
  }

  const { offersByProduct } = await getOffersForProducts([product.id]);
  return offersByProduct.get(product.id) ?? [];
}

export async function getItemsByIds(ids: string[]): Promise<ProductListItemDto[]> {
  if (!ids.length) {
    return [];
  }

  const uniqueIds = Array.from(new Set(ids));
  const { products } = await getCollections();
  const docs = (await products.find({ id: { $in: uniqueIds } }).toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct);

  const { offersByProduct } = await getOffersForProducts(docs.map((entry) => entry.id));

  const orderIndex = new Map(uniqueIds.map((id, index) => [id, index]));
  return docs
    .map((product) => {
      const productOffers = offersByProduct.get(product.id) ?? [];
      return {
        ...product,
        bestOffer: productOffers[0],
        offerCount: productOffers.length,
      } satisfies ProductListItemDto;
    })
    .sort((left, right) => (orderIndex.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (orderIndex.get(right.id) ?? Number.MAX_SAFE_INTEGER));
}

export async function getItemReviews(slug: string, page = 1, pageSize = 10): Promise<{ items: ReviewDto[]; total: number } | null> {
  const { products, reviews } = await getCollections();
  const product = await products.findOne({ slug });
  if (!product) {
    return null;
  }

  const total = await reviews.countDocuments({ productId: product.id });
  const start = (Math.max(page, 1) - 1) * pageSize;
  const items = await reviews
    .find({ productId: product.id })
    .sort({ createdAt: -1 })
    .skip(start)
    .limit(pageSize)
    .toArray();

  return { items, total };
}

export async function getItemComments(slug: string, page = 1, pageSize = 10): Promise<{ items: CommentDto[]; total: number } | null> {
  const { products, comments } = await getCollections();
  const product = await products.findOne({ slug });
  if (!product) {
    return null;
  }

  const total = await comments.countDocuments({ productId: product.id });
  const start = (Math.max(page, 1) - 1) * pageSize;
  const items = await comments
    .find({ productId: product.id })
    .sort({ createdAt: -1 })
    .skip(start)
    .limit(pageSize)
    .toArray();

  return { items, total };
}

export async function getSearchSuggestions(query: string, limit = 10) {
  const normalized = query.trim();
  if (!normalized) {
    return [];
  }

  const { products, offers } = await getCollections();
  const regex = new RegExp(escapeRegex(normalized), "i");

  const matchedProducts = (await products
    .find({
      $or: [{ name: regex }, { shortDescription: regex }, { description: regex }, { tags: regex }],
    })
    .limit(Math.min(Math.max(limit, 1), 10))
    .toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct);

  if (!matchedProducts.length) {
    return [];
  }

  const productIds = matchedProducts.map((entry) => entry.id);
  const offerDocs = await offers.find({ productId: { $in: productIds } }).toArray();

  const offerCountByProduct = new Map<string, number>();
  for (const offer of offerDocs) {
    offerCountByProduct.set(offer.productId, (offerCountByProduct.get(offer.productId) ?? 0) + 1);
  }

  return matchedProducts
    .map((product) => ({
      id: product.id,
      slug: product.slug,
      name: product.name,
      category: product.category,
      offerCount: offerCountByProduct.get(product.id) ?? 0,
    }))
    .sort((left, right) => right.offerCount - left.offerCount || left.name.localeCompare(right.name))
    .slice(0, Math.min(Math.max(limit, 1), 10));
}

export async function getVendorSummaries(): Promise<VendorSummaryDto[]> {
  return getVendorSummariesScoped({ role: "SADMIN", userId: "system" });
}

async function getStoreIdsForScope(scope: AdminScope) {
  const { stores } = await getCollections();
  if (scope.role === "SADMIN") {
    const allStores = await stores.find({}, { projection: { id: 1 } }).toArray();
    return allStores.map((store) => store.id);
  }

  const ownedStores = await stores.find({ ownerUserId: scope.userId }, { projection: { id: 1 } }).toArray();
  return ownedStores.map((store) => store.id);
}

export async function getVendorSummariesScoped(scope: AdminScope): Promise<VendorSummaryDto[]> {
  const { stores, products, offers } = await getCollections();
  const scopedStoreIds = await getStoreIdsForScope(scope);

  if (!scopedStoreIds.length) {
    return [];
  }

  const [storeDocs, productDocs, offerDocs] = await Promise.all([
    stores.find({ id: { $in: scopedStoreIds } }).toArray(),
    products.find().toArray(),
    offers.find({ storeId: { $in: scopedStoreIds } }).toArray(),
  ]);

  const productsById = new Map(productDocs.map((product) => [product.id, product]));

  return storeDocs
    .map((store) => {
      const storeOffers = offerDocs.filter((entry) => entry.storeId === store.id);
      const offerCount = storeOffers.length;
      const productIds = new Set(storeOffers.map((entry) => entry.productId));
      const itemCount = productDocs.filter((product) => productIds.has(product.id)).length;
      const categoryAccumulator = new Map<string, { itemIds: Set<string>; offerCount: number }>();

      for (const offer of storeOffers) {
        const product = productsById.get(offer.productId);
        const category = product?.category?.trim() || "Uncategorized";
        if (!categoryAccumulator.has(category)) {
          categoryAccumulator.set(category, { itemIds: new Set<string>(), offerCount: 0 });
        }
        const entry = categoryAccumulator.get(category);
        if (!entry) {
          continue;
        }
        entry.offerCount += 1;
        entry.itemIds.add(offer.productId);
      }

      const categoryBreakdown = Array.from(categoryAccumulator.entries())
        .map(([category, value]) => ({
          category,
          itemCount: value.itemIds.size,
          offerCount: value.offerCount,
        }))
        .sort((left, right) => right.itemCount - left.itemCount || left.category.localeCompare(right.category));

      const basicInfo = getStoreBasicInfo(store.details);
      const categories = toStoreCategoryOptions(store.details);
      return {
        id: store.id,
        name: store.name,
        slug: store.slug,
        ownerUserId: store.ownerUserId,
        rating: store.rating,
        active: store.active,
        itemCount,
        offerCount,
        primaryCategory: basicInfo.category || undefined,
        primarySubcategory: basicInfo.subcategory || undefined,
        categories,
        categoryBreakdown,
      };
    })
    .sort((left, right) => Number(right.active) - Number(left.active) || right.rating - left.rating);
}

export async function getGlobalCategoryOptions() {
  const settings = await getGlobalCategorySettings();
  return settings.categories;
}

export async function getGlobalCategorySettings(): Promise<GlobalCategorySettingsDto> {
  const { globalCategorySettings } = await getCollections();
  const settings = await globalCategorySettings.findOne({ _id: GLOBAL_CATEGORY_SETTINGS_DOC_ID });
  const categories = toNormalizedStoreCategoryOptions(settings?.categories ?? []);
  const customizableCategories = toNormalizedCategoryValueList(settings?.customizableCategories);

  return {
    categories,
    customizableCategories,
  };
}

export async function getCustomizableCategoryValues() {
  const settings = await getGlobalCategorySettings();
  return settings.customizableCategories;
}

export async function updateGlobalCategoryOptions(input: {
  categories: StoreCategoryOption[];
  customizableCategories?: string[];
  updatedBy: string;
}) {
  const { globalCategorySettings } = await getCollections();
  const normalized = toNormalizedStoreCategoryOptions(input.categories ?? []);
  const categoriesToSave = normalized;
  const customizableCategories = toNormalizedCategoryValueList(input.customizableCategories);

  await globalCategorySettings.updateOne(
    { _id: GLOBAL_CATEGORY_SETTINGS_DOC_ID },
    {
      $set: {
        categories: categoriesToSave,
        customizableCategories,
        updatedAt: new Date().toISOString(),
        updatedBy: input.updatedBy,
      },
    },
    { upsert: true },
  );

  return {
    categories: categoriesToSave,
    customizableCategories,
  } satisfies GlobalCategorySettingsDto;
}

export async function getMergedCategoryValuesForStoreScoped(input: {
  storeId: string;
  scope: AdminScope;
}) {
  const [globalCategoryOptions, vendors] = await Promise.all([
    getGlobalCategoryOptions(),
    getVendorSummariesScoped(input.scope),
  ]);

  const vendor = vendors.find((entry) => entry.id === input.storeId);
  if (!vendor) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  const globalValues = globalCategoryOptions
    .flatMap((entry) => [entry.name, ...entry.subcategories])
    .map((entry) => entry.trim())
    .filter(Boolean);

  const vendorValues = vendor.categories
    .flatMap((entry) => [entry.name, ...entry.subcategories])
    .map((entry) => entry.trim())
    .filter(Boolean);

  const mergedCategoryValues = Array.from(new Set([...globalValues, ...vendorValues]));

  return {
    vendor,
    globalCategoryOptions,
    vendorCategoryOptions: vendor.categories,
    mergedCategoryValues,
  };
}

function toValidatedGlobalCategorySelection(input: {
  globalCategoryOptions: StoreCategoryOption[];
  category: string;
  subcategory?: string;
}) {
  const requestedCategory = input.category.trim();
  if (!requestedCategory) {
    throw new Error("INVALID_GLOBAL_CATEGORY");
  }

  const normalizedGlobalOptions = toNormalizedStoreCategoryOptions(input.globalCategoryOptions);
  const matchedCategory = normalizedGlobalOptions.find(
    (entry) => entry.name.toLowerCase() === requestedCategory.toLowerCase(),
  );

  if (!matchedCategory) {
    throw new Error("INVALID_GLOBAL_CATEGORY");
  }

  const requestedSubcategory = (input.subcategory ?? "").trim();
  if (!requestedSubcategory) {
    return {
      category: matchedCategory.name,
      subcategory: "",
    };
  }

  const matchedSubcategory = matchedCategory.subcategories.find(
    (entry) => entry.toLowerCase() === requestedSubcategory.toLowerCase(),
  );

  if (!matchedSubcategory) {
    throw new Error("INVALID_GLOBAL_SUBCATEGORY");
  }

  return {
    category: matchedCategory.name,
    subcategory: matchedSubcategory,
  };
}

export async function getHomeRankingConfig(): Promise<HomeRankingConfig> {
  const { homeRankingSettings } = await getCollections();
  const settings = await homeRankingSettings.findOne({ _id: HOME_RANKING_SETTINGS_DOC_ID });
  return toNormalizedHomeRankingConfig(settings?.config);
}

export async function updateHomeRankingConfig(input: {
  config: HomeRankingConfig;
  updatedBy: string;
}) {
  const { homeRankingSettings } = await getCollections();
  const normalizedConfig = toNormalizedHomeRankingConfig(input.config);

  await homeRankingSettings.updateOne(
    { _id: HOME_RANKING_SETTINGS_DOC_ID },
    {
      $set: {
        config: normalizedConfig,
        updatedAt: new Date().toISOString(),
        updatedBy: input.updatedBy,
      },
    },
    { upsert: true },
  );

  return normalizedConfig;
}

function mapVendorOnboardingSubmission(doc: VendorOnboardingSubmissionDoc): VendorOnboardingSubmissionDto {
  return {
    id: doc.id,
    email: doc.email,
    userId: doc.userId,
    status: doc.status,
    submittedAt: doc.submittedAt,
    reviewedAt: doc.reviewedAt,
    reviewedBy: doc.reviewedBy,
    rejectionReason: doc.rejectionReason,
    approvedStoreId: doc.approvedStoreId,
    businessName: doc.businessName,
    ownerName: doc.ownerName,
    ownerPhone: doc.ownerPhone,
    category: doc.category,
    city: doc.city,
    state: doc.state,
    pincode: doc.pincode,
    payload: doc.payload,
    updatedAt: doc.updatedAt,
  };
}

export async function createVendorOnboardingSubmission(input: {
  payload: VendorOnboardingPayload;
  existingUserId?: string;
}): Promise<VendorOnboardingSubmissionDto> {
  const { vendorOnboardingSubmissions } = await getCollections();
  const now = new Date().toISOString();
  const email = (input.payload.owner.email ?? "").trim().toLowerCase();

  if (!email) {
    throw new Error("VENDOR_ONBOARDING_EMAIL_REQUIRED");
  }

  const summary = {
    businessName: input.payload.basicInfo.name,
    ownerName: input.payload.owner.fullName,
    ownerPhone: input.payload.owner.phone,
    category: input.payload.basicInfo.category,
    city: input.payload.location.city,
    state: input.payload.location.state,
    pincode: input.payload.location.pincode,
  };

  const existingPending = await vendorOnboardingSubmissions.findOne(
    { email, status: "pending" },
    { sort: { submittedAt: -1 } },
  );

  if (existingPending) {
    const nextDoc: VendorOnboardingSubmissionDoc = {
      ...existingPending,
      email,
      userId: input.existingUserId ?? existingPending.userId,
      status: "pending",
      reviewedAt: undefined,
      reviewedBy: undefined,
      rejectionReason: undefined,
      approvedStoreId: undefined,
      ...summary,
      payload: input.payload,
      updatedAt: now,
    };

    await vendorOnboardingSubmissions.updateOne(
      { id: existingPending.id },
      {
        $set: nextDoc,
      },
    );

    return mapVendorOnboardingSubmission(nextDoc);
  }

  const doc: VendorOnboardingSubmissionDoc = {
    id: `vonb-${new ObjectId().toHexString().slice(-10)}`,
    email,
    userId: input.existingUserId,
    status: "pending",
    submittedAt: now,
    ...summary,
    payload: input.payload,
    updatedAt: now,
  };

  await vendorOnboardingSubmissions.insertOne(doc);
  return mapVendorOnboardingSubmission(doc);
}

export async function listVendorOnboardingSubmissions(input: {
  q?: string;
  status?: VendorOnboardingStatus;
  page: number;
  pageSize: number;
  scope: AdminScope;
}): Promise<{
  items: VendorOnboardingSubmissionDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  if (input.scope.role !== "SADMIN") {
    throw new Error("FORBIDDEN_SUPER_ADMIN_ONLY");
  }

  const { vendorOnboardingSubmissions } = await getCollections();
  const query: Record<string, unknown> = {};

  if (input.status) {
    query.status = input.status;
  }

  if (input.q) {
    const regex = new RegExp(escapeRegex(input.q), "i");
    query.$or = [
      { email: regex },
      { businessName: regex },
      { ownerName: regex },
      { ownerPhone: regex },
      { category: regex },
      { city: regex },
      { state: regex },
      { pincode: regex },
    ];
  }

  const page = Math.max(1, Math.floor(input.page));
  const pageSize = Math.min(100, Math.max(1, Math.floor(input.pageSize)));
  const skip = (page - 1) * pageSize;

  const [total, docs] = await Promise.all([
    vendorOnboardingSubmissions.countDocuments(query),
    vendorOnboardingSubmissions.find(query).sort({ submittedAt: -1 }).skip(skip).limit(pageSize).toArray(),
  ]);

  return {
    items: docs.map(mapVendorOnboardingSubmission),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function reviewVendorOnboardingSubmission(input: {
  submissionId: string;
  decision: "approve" | "reject";
  reason?: string;
  scope: AdminScope;
}): Promise<VendorOnboardingSubmissionDto> {
  if (input.scope.role !== "SADMIN") {
    throw new Error("FORBIDDEN_SUPER_ADMIN_ONLY");
  }

  const { vendorOnboardingSubmissions } = await getCollections();
  const existing = await vendorOnboardingSubmissions.findOne({ id: input.submissionId });

  if (!existing) {
    throw new Error("VENDOR_ONBOARDING_NOT_FOUND");
  }

  if (existing.status !== "pending") {
    throw new Error("VENDOR_ONBOARDING_ALREADY_REVIEWED");
  }

  const now = new Date().toISOString();
  if (input.decision === "reject") {
    const nextDoc: VendorOnboardingSubmissionDoc = {
      ...existing,
      status: "rejected",
      reviewedAt: now,
      reviewedBy: input.scope.userId,
      rejectionReason: input.reason?.trim() || "Not approved",
      updatedAt: now,
    };

    await vendorOnboardingSubmissions.updateOne({ id: existing.id }, { $set: nextDoc });
    return mapVendorOnboardingSubmission(nextDoc);
  }

  const ensuredUser = await ensureAuthUserRole(existing.email, "STORE_OWNER", {
    forceDefaultRole: true,
  });

  const approvedPayload: VendorOnboardingPayload = {
    ...existing.payload,
    meta: {
      ...(existing.payload.meta ?? {}),
      status: "active",
      createdAt: existing.payload.meta?.createdAt ?? now,
      updatedAt: now,
    },
  };

  const createdStore = await createStoreForAdmin(
    {
      ...approvedPayload,
      ownerUserId: ensuredUser.id,
    },
    { role: "SADMIN", userId: input.scope.userId },
  );

  const nextDoc: VendorOnboardingSubmissionDoc = {
    ...existing,
    userId: ensuredUser.id,
    status: "approved",
    reviewedAt: now,
    reviewedBy: input.scope.userId,
    approvedStoreId: createdStore.id,
    rejectionReason: undefined,
    updatedAt: now,
  };

  await vendorOnboardingSubmissions.updateOne({ id: existing.id }, { $set: nextDoc });
  return mapVendorOnboardingSubmission(nextDoc);
}

export async function getAdminDashboard(): Promise<AdminDashboardPayload> {
  return getAdminDashboardScoped({ role: "SADMIN", userId: "system" });
}

export async function getAdminDashboardScoped(scope: AdminScope): Promise<AdminDashboardPayload> {
  const { stores, products, offers, orders, riders, users } = await getCollections();
  const db = await getMongoDb();
  const coupons = db.collection<{ active?: boolean; usedCount?: number }>("coupons");

  if (scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(scope);
    if (!scopedStoreIds.length) {
      return {
        totalVendors: 0,
        activeVendors: 0,
        totalItems: 0,
        totalOffers: 0,
        totalOrders: 0,
        pendingOrders: 0,
        totalRiders: 0,
        activeRiders: 0,
        totalUsers: 0,
        totalCoupons: 0,
        activeCoupons: 0,
        totalCouponRedemptions: 0,
      };
    }

    const [
      totalVendors,
      activeVendors,
      totalOffers,
      totalOrders,
      pendingOrders,
      riderIds,
      productIds,
      couponDocs,
    ] = await Promise.all([
      stores.countDocuments({ id: { $in: scopedStoreIds } }),
      stores.countDocuments({ id: { $in: scopedStoreIds }, active: true }),
      offers.countDocuments({ storeId: { $in: scopedStoreIds } }),
      orders.countDocuments({ storeId: { $in: scopedStoreIds } }),
      orders.countDocuments({ storeId: { $in: scopedStoreIds }, status: { $in: ["placed", "packed", "out-for-delivery"] } }),
      orders.distinct("riderId", { storeId: { $in: scopedStoreIds }, riderId: { $exists: true } }),
      offers.distinct("productId", { storeId: { $in: scopedStoreIds } }),
      coupons.find({}, { projection: { active: 1, usedCount: 1 } }).toArray(),
    ]);

    const validRiderIds = riderIds.filter((value): value is string => typeof value === "string" && value.length > 0);
    const totalRiders = validRiderIds.length;
    const activeRiders = validRiderIds.length
      ? await riders.countDocuments({ id: { $in: validRiderIds }, status: { $in: ["available", "on-delivery"] } })
      : 0;

    const totalCoupons = couponDocs.length;
    const activeCoupons = couponDocs.filter((coupon) => coupon.active).length;
    const totalCouponRedemptions = couponDocs.reduce((sum, coupon) => sum + (coupon.usedCount ?? 0), 0);

    return {
      totalVendors,
      activeVendors,
      totalItems: productIds.length,
      totalOffers,
      totalOrders,
      pendingOrders,
      totalRiders,
      activeRiders,
      totalUsers: 0,
      totalCoupons,
      activeCoupons,
      totalCouponRedemptions,
    };
  }

  const [
    totalVendors,
    activeVendors,
    totalItems,
    totalOffers,
    totalOrders,
    pendingOrders,
    totalRiders,
    activeRiders,
    totalUsers,
    totalCoupons,
    activeCoupons,
    couponDocs,
  ] = await Promise.all([
    stores.countDocuments(),
    stores.countDocuments({ active: true }),
    products.countDocuments(),
    offers.countDocuments(),
    orders.countDocuments(),
    orders.countDocuments({ status: { $in: ["placed", "packed", "out-for-delivery"] } }),
    riders.countDocuments(),
    riders.countDocuments({ status: { $in: ["available", "on-delivery"] } }),
    users.countDocuments(),
    coupons.countDocuments(),
    coupons.countDocuments({ active: true }),
    coupons.find({}, { projection: { usedCount: 1 } }).toArray(),
  ]);

  const totalCouponRedemptions = couponDocs.reduce((sum, coupon) => sum + (coupon.usedCount ?? 0), 0);

  return {
    totalVendors,
    activeVendors,
    totalItems,
    totalOffers,
    totalOrders,
    pendingOrders,
    totalRiders,
    activeRiders,
    totalUsers,
    totalCoupons,
    activeCoupons,
    totalCouponRedemptions,
  };
}

export async function getAdminItems() {
  return getAdminItemsScoped({ role: "SADMIN", userId: "system" });
}

export async function getAdminItemsScoped(scope: AdminScope) {
  const { products } = await getCollections();
  let scopedProductIds: string[] | null = null;

  if (scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(scope);
    if (!scopedStoreIds.length) {
      return {
        items: [],
        meta: {
          total: 0,
          totalPages: 1,
          page: 1,
          pageSize: 0,
          filters: {
            sort: "featured" as SortOption,
          },
        },
      };
    }

    const { offers } = await getCollections();
    scopedProductIds = await offers.distinct("productId", { storeId: { $in: scopedStoreIds } });
    if (!scopedProductIds.length) {
      return {
        items: [],
        meta: {
          total: 0,
          totalPages: 1,
          page: 1,
          pageSize: 0,
          filters: {
            sort: "featured" as SortOption,
          },
        },
      };
    }
  }

  const docs = (await products.find(scopedProductIds ? { id: { $in: scopedProductIds } } : {}).sort({ featured: -1, rating: -1 }).limit(200).toArray())
    .map(normalizeInventoryProduct);
  const { offersByProduct } = await getOffersForProducts(docs.map((entry) => entry.id));

  return {
    items: docs.map((item) => {
      const itemOffers = offersByProduct.get(item.id) ?? [];
      return {
        ...item,
        bestOffer: itemOffers[0],
        offerCount: itemOffers.length,
        offers: itemOffers,
      };
    }),
    meta: {
      total: docs.length,
      totalPages: 1,
      page: 1,
      pageSize: docs.length,
      filters: {
        sort: "featured" as SortOption,
      },
    },
  };
}

export async function updateItemQuantityLimits(input: {
  itemId: string;
  minOrderQty: number;
  maxOrderQty: number;
  scope?: AdminScope;
}) {
  const { products, offers } = await getCollections();

  if (input.scope?.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(input.scope);
    if (!scopedStoreIds.length) {
      throw new Error("FORBIDDEN_ITEM_SCOPE");
    }

    const hasOwnership = await offers.findOne({
      storeId: { $in: scopedStoreIds },
      productId: input.itemId,
    });

    if (!hasOwnership) {
      throw new Error("FORBIDDEN_ITEM_SCOPE");
    }
  }

  const minOrderQty = Math.max(1, Math.floor(input.minOrderQty));
  const rawMax = Math.max(0, Math.floor(input.maxOrderQty));
  const maxOrderQty = rawMax === 0 ? 0 : Math.max(minOrderQty, rawMax);

  await products.updateOne(
    { id: input.itemId },
    {
      $set: {
        minOrderQty,
        maxOrderQty,
        inStock: maxOrderQty === 0 ? false : true,
      },
    },
  );

  return { minOrderQty, maxOrderQty };
}

export async function getAdminOrders() {
  return getAdminOrdersScoped({ role: "SADMIN", userId: "system" });
}

export async function getAdminOrdersScoped(scope: AdminScope) {
  const { orders } = await getCollections();
  if (scope.role === "SADMIN") {
    const rows = await orders.find().sort({ createdAt: -1 }).limit(200).toArray();
    return rows.map(mapOrderDocToDto);
  }

  const scopedStoreIds = await getStoreIdsForScope(scope);
  if (!scopedStoreIds.length) {
    return [];
  }

  const rows = await orders.find({ storeId: { $in: scopedStoreIds } }).sort({ createdAt: -1 }).limit(200).toArray();
  return rows.map(mapOrderDocToDto);
}

export async function getAdminOrderDetailsScoped(input: {
  orderId: string;
  scope: AdminScope;
}) {
  const { orders, products, stores, users, riders } = await getCollections();
  const seedOrder = await orders.findOne({ id: input.orderId });

  if (!seedOrder) {
    throw new Error("ORDER_NOT_FOUND");
  }

  const scopedStoreIds = input.scope.role === "STORE_OWNER" ? await getStoreIdsForScope(input.scope) : null;
  if (scopedStoreIds && !scopedStoreIds.includes(seedOrder.storeId)) {
    throw new Error("FORBIDDEN_ORDER_SCOPE");
  }

  const orderRef = seedOrder.orderRef?.trim();
  const baseQuery: Record<string, unknown> = orderRef ? { orderRef } : { id: seedOrder.id };
  if (scopedStoreIds) {
    baseQuery.storeId = { $in: scopedStoreIds };
  }

  const rows = await orders.find(baseQuery).sort({ createdAt: -1 }).toArray();
  if (!rows.length) {
    throw new Error("FORBIDDEN_ORDER_SCOPE");
  }

  const productIds = Array.from(new Set(rows.map((entry) => entry.productId).filter(Boolean)));
  const storeIds = Array.from(new Set(rows.map((entry) => entry.storeId).filter((entry) => Boolean(entry) && entry !== "direct")));
  const riderIds = Array.from(new Set(rows.map((entry) => entry.riderId).filter(Boolean))) as string[];

  const [productDocs, storeDocs, riderDocs] = await Promise.all([
    productIds.length ? products.find({ id: { $in: productIds } }).toArray() : Promise.resolve([]),
    storeIds.length ? stores.find({ id: { $in: storeIds } }).toArray() : Promise.resolve([]),
    riderIds.length ? riders.find({ id: { $in: riderIds } }).toArray() : Promise.resolve([]),
  ]);

  const productsById = toMap(productDocs);
  const storesById = toMap(storeDocs);
  const ridersById = toMap(riderDocs);

  const customerUserObjectId = rows
    .map((entry) => objectIdToString(entry.customerUserObjectId))
    .find(Boolean)
    ?? rows.map((entry) => entry.customerUserId?.trim()).find((entry): entry is string => Boolean(entry));

  const customerObjectId = customerUserObjectId ? toObjectId(customerUserObjectId) : null;
  const customerDoc = customerObjectId ? await users.findOne({ _id: customerObjectId }) : null;
  const customerProfile = customerDoc ? profileDocToDto(customerDoc) : undefined;

  const sortedByTime = [...rows].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  const latestStatus = [...rows]
    .sort((left, right) => statusPriority[right.status] - statusPriority[left.status])[0]?.status ?? "placed";

  const totalAmount = rows.reduce((sum, entry) => sum + entry.totalAmount, 0);
  const itemCount = rows.reduce((sum, entry) => sum + entry.quantity, 0);

  const lineItems = rows.map((entry) => {
    const product = productsById.get(entry.productId);
    const store = storesById.get(entry.storeId);
    const rider = entry.riderId ? ridersById.get(entry.riderId) : undefined;

    return {
      ...mapOrderDocToDto(entry),
      productName: product?.name ?? entry.productId,
      productImage: product?.images?.[0],
      storeName: store?.name,
      riderName: rider?.fullName,
      customerUserObjectId: objectIdToString(entry.customerUserObjectId),
      storeObjectId: objectIdToString(entry.storeObjectId),
      productObjectId: objectIdToString(entry.productObjectId),
    };
  });

  const primary = lineItems[0];

  return {
    orderRef: orderRef || seedOrder.id,
    orderId: seedOrder.id,
    status: latestStatus,
    createdAt: sortedByTime[0]?.createdAt ?? seedOrder.createdAt,
    lastUpdatedAt: sortedByTime[sortedByTime.length - 1]?.createdAt ?? seedOrder.createdAt,
    totalAmount,
    itemCount,
    lineCount: lineItems.length,
    customer: {
      userId: primary?.customerUserId,
      userObjectId: primary?.customerUserObjectId,
      name: primary?.customerName,
      email: primary?.customerEmail,
      phone: primary?.customerPhone,
      profile: customerProfile,
    },
    lines: lineItems,
  };
}

const statusPriority: Record<AdminOrderDto["status"], number> = {
  "placed": 0,
  "packed": 1,
  "out-for-delivery": 2,
  "delivered": 3,
  "cancelled": 4,
};

export async function getUserOrders(userId: string, customerEmail?: string): Promise<UserOrderDto[]> {
  const { orders, products, stores, riders } = await getCollections();
  const objectId = toObjectId(userId);

  const query: Record<string, unknown> = {};
  if (objectId) {
    query.$or = [
      { customerUserObjectId: objectId },
      { customerUserId: objectId.toString() },
      { customerUserId: userId },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  } else {
    query.$or = [
      { customerUserId: userId },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  }

  const [orderDocs, productDocs, storeDocs, riderDocs] = await Promise.all([
    orders.find(query).sort({ createdAt: -1 }).limit(200).toArray(),
    products.find().toArray(),
    stores.find().toArray(),
    riders.find().toArray(),
  ]);

  const productsById = toMap(productDocs);
  const storesById = toMap(storeDocs);
  const ridersById = toMap(riderDocs);
  const grouped = new Map<string, AdminOrderDto[]>();

  for (const order of orderDocs) {
    const key = order.orderRef ?? order.id;
    const current = grouped.get(key) ?? [];
    current.push(order);
    grouped.set(key, current);
  }

  const output: UserOrderDto[] = Array.from(grouped.entries()).map(([orderRef, entries]) => {
    const sortedByTime = [...entries].sort((left, right) =>
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
    );
    const latestByTime = sortedByTime[sortedByTime.length - 1] ?? entries[0];

    const placedAt = sortedByTime[0]?.createdAt ?? new Date().toISOString();
    const lastUpdatedAt = latestByTime?.createdAt ?? placedAt;
    const totalAmount = entries.reduce((total, entry) => total + entry.totalAmount, 0);
    const itemCount = entries.reduce((total, entry) => total + entry.quantity, 0);
    const topStatus = [...entries]
      .sort((left, right) => statusPriority[right.status] - statusPriority[left.status])[0]?.status ?? "placed";

    const productNames = entries
      .map((entry) => productsById.get(entry.productId)?.name)
      .filter((value): value is string => Boolean(value));

    const items = entries.map((entry) => {
      const rider = entry.riderId ? ridersById.get(entry.riderId) : undefined;
      return {
        id: entry.id,
        productId: entry.productId,
        productName: productsById.get(entry.productId)?.name ?? entry.productId,
        productImage: productsById.get(entry.productId)?.images?.[0],
        storeId: entry.storeId,
        storeName: storesById.get(entry.storeId)?.name,
        quantity: entry.quantity,
        totalAmount: entry.totalAmount,
        customization: entry.customization,
        customizationSignature: entry.customizationSignature,
        status: entry.status,
        paymentMethod: entry.paymentMethod,
        transactionStatus: entry.transactionStatus,
        transactionId: entry.transactionId,
        paymentId: entry.paymentId,
        razorpayOrderId: entry.razorpayOrderId,
        promoCode: entry.promoCode,
        discountAmount: entry.discountAmount,
        deliveryFee: entry.deliveryFee,
        shippingProvider: entry.shippingProvider,
        shippingProviderStatus: entry.shippingProviderStatus,
        shippingAwb: entry.shippingAwb,
        shippingShipmentId: entry.shippingShipmentId,
        shippingPickupRequestId: entry.shippingPickupRequestId,
        shippingError: entry.shippingError,
        shippingLastSyncedAt: entry.shippingLastSyncedAt,
        deliveryAddress: entry.deliveryAddress,
        pickupAddress: entry.pickupAddress,
        shippingPackage: entry.shippingPackage,
        shippingEvents: entry.shippingEvents,
        riderId: entry.riderId,
        riderName: rider?.fullName,
        createdAt: entry.createdAt,
      };
    });

    const summaryNames = productNames.length
      ? productNames
      : items.map((item) => item.productName).filter(Boolean);

    const itemsSummary = summaryNames.length
      ? summaryNames.slice(0, 2).join(", ") + (summaryNames.length > 2 ? ` +${summaryNames.length - 2} more` : "")
      : `${itemCount} item(s)`;

    return {
      orderRef,
      placedAt,
      lastUpdatedAt,
      status: topStatus,
      totalAmount,
      itemCount,
      deliveryAddressLabel: latestByTime?.deliveryAddressLabel ?? entries[0]?.deliveryAddressLabel,
      paymentMethod: latestByTime?.paymentMethod,
      transactionStatus: latestByTime?.transactionStatus,
      transactionId: latestByTime?.transactionId,
      paymentId: latestByTime?.paymentId,
      razorpayOrderId: latestByTime?.razorpayOrderId,
      promoCode: latestByTime?.promoCode,
      discountAmount: latestByTime?.discountAmount,
      deliveryFee: latestByTime?.deliveryFee,
      shippingProvider: latestByTime?.shippingProvider,
      shippingProviderStatus: latestByTime?.shippingProviderStatus,
      shippingAwb: latestByTime?.shippingAwb,
      shippingShipmentId: latestByTime?.shippingShipmentId,
      shippingPickupRequestId: latestByTime?.shippingPickupRequestId,
      shippingError: latestByTime?.shippingError,
      shippingLastSyncedAt: latestByTime?.shippingLastSyncedAt,
      itemsSummary,
      items,
    } satisfies UserOrderDto;
  });

  return output.sort((left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime());
}

const trackingOrder: AdminOrderDto["status"][] = ["placed", "packed", "out-for-delivery", "delivered"];

const trackingLabel: Record<AdminOrderDto["status"], string> = {
  placed: "Placed",
  packed: "Packed",
  "out-for-delivery": "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export async function getUserOrderDetails(orderRef: string, userId: string, customerEmail?: string): Promise<UserOrderDetailsDto | null> {
  const trimmedOrderRef = orderRef.trim();
  if (!trimmedOrderRef) {
    return null;
  }

  const { orders, products, stores, riders } = await getCollections();

  const query: Record<string, unknown> = {
    $or: [{ orderRef: trimmedOrderRef }, { id: trimmedOrderRef }],
  };
  const objectId = toObjectId(userId);
  const customerScope = objectId
    ? [
        { customerUserObjectId: objectId },
        { customerUserId: objectId.toString() },
        { customerUserId: userId },
        ...(customerEmail ? [{ customerEmail }] : []),
      ]
    : [
        { customerUserId: userId },
        ...(customerEmail ? [{ customerEmail }] : []),
      ];

  query.$and = [
    {
      $or: customerScope,
    },
  ];

  const [orderDocs, productDocs, storeDocs, riderDocs] = await Promise.all([
    orders.find(query).sort({ createdAt: -1 }).toArray(),
    products.find().toArray(),
    stores.find().toArray(),
    riders.find().toArray(),
  ]);

  if (!orderDocs.length) {
    return null;
  }

  const productsById = toMap(productDocs);
  const storesById = toMap(storeDocs);
  const ridersById = toMap(riderDocs);

  const sortedByTime = [...orderDocs].sort((left, right) =>
    new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime(),
  );

  const latestStatus = [...orderDocs]
    .sort((left, right) => statusPriority[right.status] - statusPriority[left.status])[0]?.status ?? "placed";

  const totalAmount = orderDocs.reduce((total, entry) => total + entry.totalAmount, 0);
  const itemCount = orderDocs.reduce((total, entry) => total + entry.quantity, 0);

  const productNames = orderDocs
    .map((entry) => productsById.get(entry.productId)?.name)
    .filter((value): value is string => Boolean(value));

  const itemsSummary =
    productNames.slice(0, 2).join(", ") +
    (productNames.length > 2 ? ` +${productNames.length - 2} more` : "");

  const currentStageIndex = trackingOrder.indexOf(latestStatus);
  const tracking: OrderTrackingStep[] = trackingOrder.map((status, index) => ({
    status,
    label: trackingLabel[status],
    completed: latestStatus === "cancelled" ? status === "placed" : index <= currentStageIndex,
    active: latestStatus !== "cancelled" && status === latestStatus,
  }));

  if (latestStatus === "cancelled") {
    tracking.push({
      status: "cancelled",
      label: trackingLabel.cancelled,
      completed: true,
      active: true,
    });
  }

  const items = orderDocs.map((entry) => ({
    id: entry.id,
    productId: entry.productId,
    productName: productsById.get(entry.productId)?.name ?? entry.productId,
    productImage: productsById.get(entry.productId)?.images?.[0],
    storeId: entry.storeId,
    storeName: storesById.get(entry.storeId)?.name,
    quantity: entry.quantity,
    totalAmount: entry.totalAmount,
    customization: entry.customization,
    customizationSignature: entry.customizationSignature,
    status: entry.status,
    paymentMethod: entry.paymentMethod,
    transactionStatus: entry.transactionStatus,
    transactionId: entry.transactionId,
    paymentId: entry.paymentId,
    razorpayOrderId: entry.razorpayOrderId,
    promoCode: entry.promoCode,
    discountAmount: entry.discountAmount,
    deliveryFee: entry.deliveryFee,
    shippingProvider: entry.shippingProvider,
    shippingProviderStatus: entry.shippingProviderStatus,
    shippingAwb: entry.shippingAwb,
    shippingShipmentId: entry.shippingShipmentId,
    shippingPickupRequestId: entry.shippingPickupRequestId,
    shippingError: entry.shippingError,
    shippingLastSyncedAt: entry.shippingLastSyncedAt,
    deliveryAddress: entry.deliveryAddress,
    pickupAddress: entry.pickupAddress,
    shippingPackage: entry.shippingPackage,
    shippingEvents: entry.shippingEvents,
    riderId: entry.riderId,
    riderName: entry.riderId ? ridersById.get(entry.riderId)?.fullName : undefined,
    createdAt: entry.createdAt,
  }));

  const primaryOrder = orderDocs[0];

  return {
    orderRef: primaryOrder?.orderRef ?? primaryOrder?.id ?? trimmedOrderRef,
    placedAt: sortedByTime[0]?.createdAt ?? new Date().toISOString(),
    lastUpdatedAt: sortedByTime[sortedByTime.length - 1]?.createdAt ?? new Date().toISOString(),
    status: latestStatus,
    totalAmount,
    itemCount,
    itemsSummary,
    deliveryAddressLabel: primaryOrder?.deliveryAddressLabel,
    customerName: primaryOrder?.customerName,
    customerEmail: primaryOrder?.customerEmail,
    customerPhone: primaryOrder?.customerPhone,
    paymentMethod: primaryOrder?.paymentMethod,
    transactionStatus: primaryOrder?.transactionStatus,
    transactionId: primaryOrder?.transactionId,
    paymentId: primaryOrder?.paymentId,
    razorpayOrderId: primaryOrder?.razorpayOrderId,
    promoCode: primaryOrder?.promoCode,
    discountAmount: primaryOrder?.discountAmount,
    deliveryFee: primaryOrder?.deliveryFee,
    shippingProvider: primaryOrder?.shippingProvider,
    shippingProviderStatus: primaryOrder?.shippingProviderStatus,
    shippingAwb: primaryOrder?.shippingAwb,
    shippingShipmentId: primaryOrder?.shippingShipmentId,
    shippingPickupRequestId: primaryOrder?.shippingPickupRequestId,
    shippingError: primaryOrder?.shippingError,
    shippingLastSyncedAt: primaryOrder?.shippingLastSyncedAt,
    deliveryAddress: primaryOrder?.deliveryAddress,
    pickupAddress: primaryOrder?.pickupAddress,
    shippingPackage: primaryOrder?.shippingPackage,
    shippingEvents: primaryOrder?.shippingEvents,
    items,
    tracking,
  } satisfies UserOrderDetailsDto;
}

async function buildNotificationSeed(userId: string, customerEmail?: string): Promise<UserNotificationDto[]> {
  const { orders } = await getCollections();
  const objectId = toObjectId(userId);

  const query: Record<string, unknown> = {};
  if (objectId) {
    query.$or = [
      { customerUserObjectId: objectId },
      { customerUserId: objectId.toString() },
      { customerUserId: userId },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  } else {
    query.$or = [
      { customerUserId: userId },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  }

  const orderDocs = await orders.find(query).sort({ createdAt: -1 }).limit(250).toArray();

  const grouped = new Map<string, AdminOrderDto[]>();
  for (const order of orderDocs) {
    const key = order.orderRef ?? order.id;
    const current = grouped.get(key) ?? [];
    current.push(order);
    grouped.set(key, current);
  }

  const notifications: UserNotificationDto[] = [];

  for (const [orderRef, entries] of grouped.entries()) {
    const latestByTime = [...entries].sort(
      (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];

    const latestStatus = [...entries]
      .sort((left, right) => statusPriority[right.status] - statusPriority[left.status])[0]?.status ?? "placed";

    notifications.push({
      id: `ord-${orderRef}`,
      type: "order-update",
      title: `Order ${trackingLabel[latestStatus]}`,
      message: buildOrderNotificationMessage(orderRef, latestStatus),
      createdAt: latestByTime?.createdAt ?? new Date().toISOString(),
      isRead: false,
      orderRef,
      status: latestStatus,
      actionPath: `/orders/${orderRef}`,
    });

    const paidEntry = entries.find((entry) => entry.transactionStatus === "success" || Boolean(entry.paymentId));
    if (paidEntry?.paymentId) {
      notifications.push({
        id: `pay-${paidEntry.paymentId}`,
        type: "payment",
        title: "Payment confirmed",
        message: `Payment received for order ${orderRef}.`,
        createdAt: paidEntry.createdAt,
        isRead: false,
        orderRef,
        status: paidEntry.status,
        actionPath: `/orders/${orderRef}`,
      });
    }
  }

  return notifications
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 60);
}

async function ensureNotificationProfile(userId: string, email?: string) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  const { users } = await getCollections();

  const existingByUserId = await users.findOne({ _id: objectId });
  if (existingByUserId) {
    return existingByUserId;
  }

  const now = new Date().toISOString();
  const newProfile: Omit<UserDoc, "_id"> = {
    fullName: "Gifta User",
    email: email ?? `${userId}@gifta.local`,
    addresses: [],
    preferences: {
      occasions: ["Birthday", "Anniversary"],
      budgetMin: 1000,
      budgetMax: 5000,
      preferredTags: ["same-day", "premium"],
    },
    notificationReadIds: [],
    updatedAt: now,
  };

  await users.updateOne(
    { _id: objectId },
    {
      $setOnInsert: {
        email: newProfile.email,
        role: "USER",
      },
      $set: newProfile,
      $unset: {
        name: "",
      },
    },
    { upsert: true },
  );

  return (await users.findOne({ _id: objectId })) ?? { _id: objectId, ...newProfile };
}

export async function getUserNotifications(
  input: { customerEmail?: string; userId: string },
): Promise<{ notifications: UserNotificationDto[]; unreadCount: number }> {
  const notificationSeed = await buildNotificationSeed(input.userId, input.customerEmail);
  const profile = await ensureNotificationProfile(input.userId, input.customerEmail);
  const readIds = new Set(profile.notificationReadIds ?? []);

  const notifications = notificationSeed.map((entry) => ({
    ...entry,
    isRead: readIds.has(entry.id),
  }));

  const unreadCount = notifications.reduce((count, entry) => count + (entry.isRead ? 0 : 1), 0);

  return {
    notifications,
    unreadCount,
  };
}

export async function markNotificationsRead(input: {
  userId: string;
  customerEmail?: string;
  notificationIds?: string[];
  markAll?: boolean;
}): Promise<{ notifications: UserNotificationDto[]; unreadCount: number }> {
  const { users } = await getCollections();
  const profile = await ensureNotificationProfile(input.userId, input.customerEmail);

  const idsToMarkRead = input.markAll
    ? (await buildNotificationSeed(input.userId, input.customerEmail)).map((entry) => entry.id)
    : (input.notificationIds ?? []).filter((value) => value.trim().length > 0);

  if (idsToMarkRead.length) {
    await users.updateOne(
      { _id: profile._id },
      {
        $addToSet: {
          notificationReadIds: {
            $each: idsToMarkRead,
          },
        },
        $set: {
          notificationLastReadAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    );
  }

  return getUserNotifications({
    customerEmail: input.customerEmail,
    userId: profile._id?.toString() ?? input.userId,
  });
}

function buildOrderNotificationMessage(orderRef: string, status: AdminOrderDto["status"]) {
  switch (status) {
    case "placed":
      return `Your order ${orderRef} has been placed successfully.`;
    case "packed":
      return `Your order ${orderRef} is packed and ready for dispatch.`;
    case "out-for-delivery":
      return `Your order ${orderRef} is out for delivery.`;
    case "delivered":
      return `Your order ${orderRef} was delivered.`;
    case "cancelled":
      return `Your order ${orderRef} was cancelled.`;
    default:
      return `Update available for order ${orderRef}.`;
  }
}

export async function getAdminUsers() {
  const { users } = await getCollections();
  const docs = await users.find({ addresses: { $exists: true } }).sort({ updatedAt: -1 }).toArray();
  return docs.map((doc) => profileDocToDto(doc));
}

export async function updateStoreScoped(input: {
  storeId: string;
  updates: {
    name?: string;
    slug?: string;
    rating?: number;
    active?: boolean;
    category?: string;
    subcategory?: string;
    categories?: StoreCategoryOption[];
  };
  scope: AdminScope;
}) {
  const { stores } = await getCollections();
  const scopedStoreIds = await getStoreIdsForScope(input.scope);
  if (!scopedStoreIds.includes(input.storeId)) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (typeof input.updates.name === "string" && input.updates.name.trim()) patch.name = input.updates.name.trim();
  if (typeof input.updates.slug === "string" && input.updates.slug.trim()) patch.slug = input.updates.slug.trim().toLowerCase();
  if (typeof input.updates.rating === "number") patch.rating = Math.max(0, Math.min(5, input.updates.rating));
  if (typeof input.updates.active === "boolean") patch.active = input.updates.active;
  if (typeof input.updates.category === "string") patch["details.basicInfo.category"] = input.updates.category.trim();
  if (typeof input.updates.subcategory === "string") patch["details.basicInfo.subcategory"] = input.updates.subcategory.trim();
  if (Array.isArray(input.updates.categories)) {
    patch["details.catalog.categories"] = toNormalizedStoreCategoryOptions(input.updates.categories);
  }

  await stores.updateOne({ id: input.storeId }, { $set: patch });
  return stores.findOne({ id: input.storeId });
}

export async function deleteStoreScoped(input: { storeId: string; scope: AdminScope }) {
  const { stores, offers, orders } = await getCollections();
  const scopedStoreIds = await getStoreIdsForScope(input.scope);
  if (!scopedStoreIds.includes(input.storeId)) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  await Promise.all([
    stores.deleteOne({ id: input.storeId }),
    offers.deleteMany({ storeId: input.storeId }),
    orders.deleteMany({ storeId: input.storeId }),
  ]);

  return { deleted: true };
}

export async function createAdminItemScoped(input: {
  payload: {
    storeId?: string;
    name: string;
    shortDescription?: string;
    category: string;
    subcategory?: string;
    price: number;
    originalPrice?: number;
    deliveryEtaHours?: number;
    description?: string;
    disclaimerHtml?: string;
    howToPersonaliseHtml?: string;
    brandDetailsHtml?: string;
    images?: string[];
    media?: ProductMediaItem[];
    tags?: string[];
    featured?: boolean;
    inStock?: boolean;
    minOrderQty?: number;
    maxOrderQty?: number;
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];
  };
  scope: AdminScope;
}) {
  const { products, offers } = await getCollections();
  const scopedStoreIds = await getStoreIdsForScope(input.scope);
  const requestedStoreId = input.payload.storeId?.trim();

  if (input.scope.role === "STORE_OWNER") {
    if (!scopedStoreIds.length) {
      throw new Error("FORBIDDEN_STORE_SCOPE");
    }

    if (requestedStoreId && !scopedStoreIds.includes(requestedStoreId)) {
      throw new Error("FORBIDDEN_STORE_SCOPE");
    }
  }

  const storeId = requestedStoreId || (input.scope.role === "STORE_OWNER" ? scopedStoreIds[0] : undefined);

  if (!storeId) {
    throw new Error("STORE_REQUIRED_FOR_ITEM_CREATE");
  }

  if (input.scope.role === "SADMIN" && scopedStoreIds.length && !scopedStoreIds.includes(storeId)) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  const globalCategoryOptions = await getGlobalCategoryOptions();
  const normalizedCategorySelection = toValidatedGlobalCategorySelection({
    globalCategoryOptions,
    category: input.payload.category,
    subcategory: input.payload.subcategory,
  });

  const id = `it-${new ObjectId().toHexString().slice(-10)}`;
  const slug =
    input.payload.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || id;

  const normalizedDescription = normalizeDescriptionField(input.payload.description);
  const descriptionText = stripHtmlToText(normalizedDescription);
  const normalizedShortDescription = input.payload.shortDescription?.trim()
    ? toShortDescription(input.payload.shortDescription)
    : toShortDescription(descriptionText || normalizedDescription);
  const normalizedMedia = toNormalizedProductMedia(input.payload.media, input.payload.images);
  const normalizedDisclaimerHtml = normalizeRichHtmlField(input.payload.disclaimerHtml);
  const normalizedHowToPersonaliseHtml = normalizeRichHtmlField(input.payload.howToPersonaliseHtml);
  const normalizedBrandDetailsHtml = normalizeRichHtmlField(input.payload.brandDetailsHtml);

  const doc: ProductDoc = {
    id,
    slug,
    name: input.payload.name.trim(),
    shortDescription: normalizedShortDescription,
    description: normalizedDescription,
    price: Math.max(0, input.payload.price),
    originalPrice:
      typeof input.payload.originalPrice === "number"
        ? Math.max(0, input.payload.originalPrice)
        : Math.max(0, Math.round(input.payload.price * 1.15)),
    rating: 4.5,
    reviews: 0,
    category: normalizedCategorySelection.category as ProductDoc["category"],
    ...(normalizedCategorySelection.subcategory ? { subcategory: normalizedCategorySelection.subcategory } : {}),
    tags: input.payload.tags?.length ? input.payload.tags : ["gift"],
    ...(normalizedDisclaimerHtml ? { disclaimerHtml: normalizedDisclaimerHtml } : {}),
    ...(normalizedHowToPersonaliseHtml ? { howToPersonaliseHtml: normalizedHowToPersonaliseHtml } : {}),
    ...(normalizedBrandDetailsHtml ? { brandDetailsHtml: normalizedBrandDetailsHtml } : {}),
    media: normalizedMedia,
    images: toDisplayImagesFromMedia(normalizedMedia),
    inStock: input.payload.inStock ?? true,
    minOrderQty: input.payload.minOrderQty ?? 1,
    maxOrderQty: input.payload.maxOrderQty ?? 10,
    featured: input.payload.featured ?? false,
    storeId,
    attributes: normalizeProductAttributes(input.payload.attributes),
    variants: [],
  };

  const normalizedVariants = normalizeProductVariants(input.payload.variants, doc.attributes ?? []);
  doc.variants = normalizedVariants;

  await products.insertOne(normalizeInventoryProduct(doc));

  const offer: OfferDoc = {
    id: `of-${new ObjectId().toHexString().slice(-10)}`,
    productId: id,
    storeId,
    price: Math.max(0, input.payload.price),
    originalPrice: typeof input.payload.originalPrice === "number" ? Math.max(0, input.payload.originalPrice) : Math.max(0, Math.round(input.payload.price * 1.15)),
    inStock: input.payload.inStock ?? true,
    deliveryEtaHours: Math.max(1, Math.floor(input.payload.deliveryEtaHours ?? 24)),
  };

  await offers.insertOne(offer);

  return {
    ...doc,
    offer,
  };
}

export async function updateAdminItemScoped(input: {
  itemId: string;
  updates: {
    name?: string;
    shortDescription?: string;
    description?: string;
    disclaimerHtml?: string;
    howToPersonaliseHtml?: string;
    brandDetailsHtml?: string;
    category?: string;
    subcategory?: string;
    price?: number;
    inStock?: boolean;
    featured?: boolean;
    tags?: string[];
    images?: string[];
    media?: ProductMediaItem[];
    offerStoreId?: string;
    offerPrice?: number;
    originalPrice?: number;
    deliveryEtaHours?: number;
    offerInStock?: boolean;
    attributes?: ProductAttribute[];
    variants?: ProductVariant[];
  };
  scope: AdminScope;
}) {
  const { products, offers } = await getCollections();
  if (input.scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(input.scope);
    const hasOwnership = await offers.findOne({ storeId: { $in: scopedStoreIds }, productId: input.itemId });
    if (!hasOwnership) {
      throw new Error("FORBIDDEN_ITEM_SCOPE");
    }
  }

  const existingProduct = await products.findOne({ id: input.itemId });
  if (!existingProduct) {
    throw new Error("ITEM_NOT_FOUND");
  }
  const existingNormalizedMedia = toNormalizedProductMedia(existingProduct.media, existingProduct.images);

  const existingOffers = await offers.find({ productId: input.itemId }).toArray();
  const patch: Record<string, unknown> = {};

  const hasCategoryUpdate = typeof input.updates.category === "string";
  const hasSubcategoryUpdate = typeof input.updates.subcategory === "string";
  if (hasCategoryUpdate || hasSubcategoryUpdate) {
    const globalCategoryOptions = await getGlobalCategoryOptions();
    const validatedCategorySelection = toValidatedGlobalCategorySelection({
      globalCategoryOptions,
      category: hasCategoryUpdate ? (input.updates.category ?? "") : existingProduct.category,
      subcategory: hasSubcategoryUpdate
        ? input.updates.subcategory
        : hasCategoryUpdate
          ? ""
          : existingProduct.subcategory,
    });

    patch.category = validatedCategorySelection.category;
    patch.subcategory = validatedCategorySelection.subcategory || "";
  }

  if (typeof input.updates.name === "string" && input.updates.name.trim()) {
    patch.name = input.updates.name.trim();
    patch.slug = input.updates.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  if (typeof input.updates.shortDescription === "string") {
    patch.shortDescription = toShortDescription(input.updates.shortDescription);
  }
  if (typeof input.updates.description === "string") {
    const normalizedDescription = normalizeDescriptionField(input.updates.description);
    patch.description = normalizedDescription;
    if (input.updates.shortDescription === undefined) {
      const descriptionText = stripHtmlToText(normalizedDescription);
      patch.shortDescription = toShortDescription(descriptionText || normalizedDescription);
    }
  }
  if (typeof input.updates.disclaimerHtml === "string") {
    patch.disclaimerHtml = normalizeRichHtmlField(input.updates.disclaimerHtml) || "";
  }
  if (typeof input.updates.howToPersonaliseHtml === "string") {
    patch.howToPersonaliseHtml = normalizeRichHtmlField(input.updates.howToPersonaliseHtml) || "";
  }
  if (typeof input.updates.brandDetailsHtml === "string") {
    patch.brandDetailsHtml = normalizeRichHtmlField(input.updates.brandDetailsHtml) || "";
  }
  if (typeof input.updates.price === "number") patch.price = Math.max(0, input.updates.price);
  if (typeof input.updates.inStock === "boolean") patch.inStock = input.updates.inStock;
  if (typeof input.updates.featured === "boolean") patch.featured = input.updates.featured;
  if (Array.isArray(input.updates.tags)) patch.tags = input.updates.tags;

  if (Array.isArray(input.updates.media)) {
    const normalizedMedia = toNormalizedProductMedia(input.updates.media, input.updates.images);
    patch.media = normalizedMedia;
    patch.images = toDisplayImagesFromMedia(normalizedMedia);
  } else if (Array.isArray(input.updates.images)) {
    const normalizedImageMedia = toNormalizedProductMedia(undefined, input.updates.images)
      .filter((entry) => entry.type === "image");
    const existingVideoMedia = existingNormalizedMedia.filter((entry) => entry.type === "video");
    const mergedMedia = toNormalizedProductMedia([...existingVideoMedia, ...normalizedImageMedia], undefined);
    patch.media = mergedMedia;
    patch.images = toDisplayImagesFromMedia(mergedMedia);
  }

  const hasAttributesUpdate = input.updates.attributes !== undefined;
  const hasVariantsUpdate = input.updates.variants !== undefined;
  const nextAttributes = hasAttributesUpdate ? normalizeProductAttributes(input.updates.attributes) : (existingProduct.attributes ?? []);
  if (hasAttributesUpdate) {
    patch.attributes = nextAttributes;
    if (!nextAttributes.length) {
      patch.variants = [];
    } else if (!hasVariantsUpdate) {
      const retainedVariants = normalizeProductVariants(existingProduct.variants ?? [], nextAttributes)
        .filter((variant) => isVariantMappedToAttributes(variant, nextAttributes));
      patch.variants = retainedVariants;
    }
  }

  if (hasVariantsUpdate) {
    patch.variants = normalizeProductVariants(input.updates.variants, nextAttributes);
  }

  if (Object.keys(patch).length) {
    await products.updateOne({ id: input.itemId }, { $set: patch });
  }

  const selectedOfferStoreId = input.updates.offerStoreId?.trim() || existingOffers[0]?.storeId;
  const offerPatch: Record<string, unknown> = {};
  if (typeof input.updates.offerPrice === "number") {
    offerPatch.price = Math.max(0, input.updates.offerPrice);
    if (typeof input.updates.price !== "number") {
      await products.updateOne({ id: input.itemId }, { $set: { price: Math.max(0, input.updates.offerPrice) } });
    }
  }
  if (typeof input.updates.originalPrice === "number") offerPatch.originalPrice = Math.max(0, input.updates.originalPrice);
  if (typeof input.updates.deliveryEtaHours === "number") offerPatch.deliveryEtaHours = Math.max(1, Math.floor(input.updates.deliveryEtaHours));
  if (typeof input.updates.offerInStock === "boolean") offerPatch.inStock = input.updates.offerInStock;

  if (selectedOfferStoreId && Object.keys(offerPatch).length) {
    const targetOffer = existingOffers.find((entry) => entry.storeId === selectedOfferStoreId);
    if (!targetOffer) {
      throw new Error("OFFER_NOT_FOUND");
    }

    if (input.scope.role === "STORE_OWNER") {
      const scopedStoreIds = await getStoreIdsForScope(input.scope);
      if (!scopedStoreIds.includes(selectedOfferStoreId)) {
        throw new Error("FORBIDDEN_ITEM_SCOPE");
      }
    }

    await offers.updateOne({ id: targetOffer.id }, { $set: offerPatch });
  }

  return products.findOne({ id: input.itemId });
}

export async function upsertAdminItemOfferScoped(input: {
  itemId: string;
  payload: {
    storeId: string;
    price: number;
    originalPrice?: number;
    inStock?: boolean;
    deliveryEtaHours?: number;
  };
  scope: AdminScope;
}) {
  const { products, offers } = await getCollections();
  const product = await products.findOne({ id: input.itemId });
  if (!product) {
    throw new Error("ITEM_NOT_FOUND");
  }

  const scopedStoreIds = await getStoreIdsForScope(input.scope);
  if (!scopedStoreIds.includes(input.payload.storeId)) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  const patch = {
    price: Math.max(0, input.payload.price),
    originalPrice: typeof input.payload.originalPrice === "number" ? Math.max(0, input.payload.originalPrice) : Math.max(0, Math.round(input.payload.price * 1.15)),
    inStock: input.payload.inStock ?? true,
    deliveryEtaHours: Math.max(1, Math.floor(input.payload.deliveryEtaHours ?? 24)),
  };
  const existing = await offers.findOne({ productId: input.itemId, storeId: input.payload.storeId });

  if (existing) {
    await offers.updateOne({ id: existing.id }, { $set: patch });
  } else {
    await offers.insertOne({
      id: `of-${new ObjectId().toHexString().slice(-10)}`,
      productId: input.itemId,
      storeId: input.payload.storeId,
      ...patch,
    });
  }

  return offers.find({ productId: input.itemId }).toArray();
}

export async function deleteAdminItemOfferScoped(input: {
  itemId: string;
  storeId: string;
  scope: AdminScope;
}) {
  const { offers } = await getCollections();
  const scopedStoreIds = await getStoreIdsForScope(input.scope);
  if (!scopedStoreIds.includes(input.storeId)) {
    throw new Error("FORBIDDEN_STORE_SCOPE");
  }

  await offers.deleteOne({ productId: input.itemId, storeId: input.storeId });
  return { deleted: true };
}

export async function deleteAdminItemScoped(input: { itemId: string; scope: AdminScope }) {
  const { products, offers, orders, reviews, comments } = await getCollections();
  if (input.scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(input.scope);
    const hasOwnership = await offers.findOne({ storeId: { $in: scopedStoreIds }, productId: input.itemId });
    if (!hasOwnership) {
      throw new Error("FORBIDDEN_ITEM_SCOPE");
    }
  }

  await Promise.all([
    products.deleteOne({ id: input.itemId }),
    offers.deleteMany({ productId: input.itemId }),
    orders.deleteMany({ productId: input.itemId }),
    reviews.deleteMany({ productId: input.itemId }),
    comments.deleteMany({ productId: input.itemId }),
  ]);

  return { deleted: true };
}

export async function updateAdminOrderScoped(input: {
  orderId: string;
  updates: { status?: AdminOrderDto["status"] };
  scope: AdminScope;
}) {
  const { orders } = await getCollections();
  const existing = await orders.findOne({ id: input.orderId });
  if (!existing) {
    throw new Error("ORDER_NOT_FOUND");
  }

  if (input.scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(input.scope);
    if (!scopedStoreIds.includes(existing.storeId)) {
      throw new Error("FORBIDDEN_ORDER_SCOPE");
    }
  }

  const patch: Record<string, unknown> = {};
  if (input.updates.status) patch.status = input.updates.status;

  await orders.updateOne({ id: input.orderId }, { $set: patch });
  return orders.findOne({ id: input.orderId });
}

export async function deleteAdminOrderScoped(input: { orderId: string; scope: AdminScope }) {
  const { orders } = await getCollections();
  const existing = await orders.findOne({ id: input.orderId });
  if (!existing) {
    return { deleted: true };
  }

  if (input.scope.role === "STORE_OWNER") {
    const scopedStoreIds = await getStoreIdsForScope(input.scope);
    if (!scopedStoreIds.includes(existing.storeId)) {
      throw new Error("FORBIDDEN_ORDER_SCOPE");
    }
  }

  await orders.deleteOne({ id: input.orderId });
  return { deleted: true };
}

export async function updateAdminUser(input: {
  userId: string;
  updates: { fullName?: string; phone?: string; role?: Role; email?: string };
}) {
  const { users } = await getCollections();
  const objectId = toObjectId(input.userId);
  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  const patch: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (typeof input.updates.fullName === "string") {
    patch.fullName = input.updates.fullName.trim();
  }
  if (typeof input.updates.phone === "string") patch.phone = input.updates.phone.trim();
  if (typeof input.updates.email === "string") patch.email = input.updates.email.trim().toLowerCase();
  if (input.updates.role) patch.role = input.updates.role;

  await users.updateOne({ _id: objectId }, { $set: patch, $unset: { name: "" } });
  return users.findOne({ _id: objectId });
}

export async function deleteAdminUser(userId: string) {
  const { users } = await getCollections();
  const objectId = toObjectId(userId);
  if (!objectId) {
    throw new Error("INVALID_USER_ID");
  }

  await users.deleteOne({ _id: objectId });
  return { deleted: true };
}

export async function getAdminRiders() {
  const { riders } = await getCollections();
  return riders.find().sort({ activeDeliveries: -1, fullName: 1 }).toArray();
}

export async function seedDemoData() {
  const { users, products, stores, offers, reviews, comments, riders, orders } = await getCollections();

  const userSeeds: Array<{ email: string; fullName: string; role: Role; phone?: string }> = [
    { email: "demo@gifta.local", fullName: "Gifta Demo User", role: "USER", phone: "+91-9000000000" },
    { email: "owner1@gifta.local", fullName: "Nyra Owner", role: "STORE_OWNER", phone: "+91-9000100001" },
    { email: "owner2@gifta.local", fullName: "Aurora Owner", role: "STORE_OWNER", phone: "+91-9000100002" },
    { email: "owner3@gifta.local", fullName: "Bliss Owner", role: "STORE_OWNER", phone: "+91-9000100003" },
  ];

  const riderDocs: RiderDoc[] = [
    { id: "rd-01", fullName: "Kiran Das", phone: "+91-9000011111", zone: "South", activeDeliveries: 2, status: "on-delivery" },
    { id: "rd-02", fullName: "Aarav Nair", phone: "+91-9000022222", zone: "North", activeDeliveries: 0, status: "available" },
    { id: "rd-03", fullName: "Isha Jain", phone: "+91-9000033333", zone: "East", activeDeliveries: 1, status: "on-delivery" },
  ];

  await stores.deleteMany({});
  await products.deleteMany({});
  await offers.deleteMany({});
  await reviews.deleteMany({});
  await comments.deleteMany({});
  await riders.deleteMany({});
  await orders.deleteMany({});
  await users.deleteMany({ email: /@gifta\.local$/i });

  const userInsertDocs: Array<Omit<UserDoc, "_id">> = userSeeds.map((userSeed) => ({
    email: userSeed.email,
    fullName: userSeed.fullName,
    role: userSeed.role,
    phone: userSeed.phone,
    emailVerified: new Date(),
    updatedAt: new Date().toISOString(),
    addresses: userSeed.role === "USER"
      ? [
          {
            label: "Home",
            receiverName: userSeed.fullName,
            receiverPhone: userSeed.phone ?? "",
            line1: "42 Celebration Avenue",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560001",
            country: "India",
          },
        ]
      : [],
    preferences:
      userSeed.role === "USER"
        ? {
            occasions: ["Birthday", "Anniversary", "Festive"] as ProfileDto["preferences"]["occasions"],
            budgetMin: 1000,
            budgetMax: 5000,
            preferredTags: ["same-day", "luxury", "personalized"],
          }
        : {
            occasions: ["Corporate", "Wedding"] as ProfileDto["preferences"]["occasions"],
            budgetMin: 500,
            budgetMax: 20000,
            preferredTags: ["premium", "bulk"],
          },
  }));

  const userInsertResult = await users.insertMany(userInsertDocs);
  const insertedUsers = await users
    .find({ _id: { $in: Object.values(userInsertResult.insertedIds) } })
    .toArray();

  const userByEmail = new Map(insertedUsers.map((user) => [user.email.toLowerCase(), user]));
  const demoUser = userByEmail.get("demo@gifta.local");
  const owner1 = userByEmail.get("owner1@gifta.local");
  const owner2 = userByEmail.get("owner2@gifta.local");
  const owner3 = userByEmail.get("owner3@gifta.local");

  if (!demoUser?._id || !owner1?._id || !owner2?._id || !owner3?._id) {
    throw new Error("Unable to seed users for demo data");
  }

  const storeDocs: StoreDoc[] = [
    { id: "st-nyra", name: "Nyra Gifts", slug: "nyra-gifts", ownerUserId: owner1._id.toString(), rating: 4.7, active: true },
    { id: "st-aurora", name: "Aurora Hampers", slug: "aurora-hampers", ownerUserId: owner2._id.toString(), rating: 4.8, active: true },
    { id: "st-bliss", name: "Bliss Crates", slug: "bliss-crates", ownerUserId: owner3._id.toString(), rating: 4.6, active: true },
  ];

  if (storeDocs.length) {
    await stores.insertMany(storeDocs);
  }
  if (riderDocs.length) {
    await riders.insertMany(riderDocs);
  }

  const productDocs: ProductDoc[] = [];
  storeDocs.forEach((store, storeIndex) => {
    seedProducts.forEach((seedProduct) => {
      productDocs.push(
        normalizeInventoryProduct({
          ...seedProduct,
          id: `${seedProduct.id}-${store.id}`,
          slug: `${seedProduct.slug}-${store.slug}`,
          storeId: store.id,
          featured: storeIndex === 0 ? seedProduct.featured : false,
        }),
      );
    });
  });

  if (productDocs.length) {
    await products.insertMany(productDocs);
  }

  const offerDocs: OfferDoc[] = [];
  const reviewDocs: ReviewDoc[] = [];
  const commentDocs: CommentDoc[] = [];
  const orderDocs: OrderDoc[] = [];

  productDocs.forEach((product, productIndex) => {
    const store = storeDocs.find((entry) => entry.id === product.storeId);
    if (!store) {
      return;
    }

    const multiplier = 0.92 + (productIndex % 7) * 0.03;
    const price = Math.round(product.price * multiplier);
    const originalPrice = Math.max(price + 200, product.originalPrice ?? Math.round(price * 1.15));
    const offerId = `of-${product.id}`;
    const reviewId = `rv-${product.id}`;

    offerDocs.push({
      id: offerId,
      productId: product.id,
      storeId: store.id,
      price,
      originalPrice,
      inStock: product.inStock && productIndex % 4 !== 0,
      deliveryEtaHours: 12 + (productIndex % 5) * 8,
    });

    reviewDocs.push({
      id: reviewId,
      productId: product.id,
      author: `Shopper ${productIndex + 1}`,
      rating: Math.min(5, Math.max(3, Math.round(product.rating))),
      title: "Great gifting experience",
      comment: `Loved the ${product.name}. Packaging and delivery were smooth.`,
      createdAt: new Date(Date.now() - productIndex * 86_400_000).toISOString(),
      helpfulCount: productIndex % 12,
    });

    commentDocs.push({
      id: `cm-${product.id}`,
      productId: product.id,
      reviewId,
      author: "Gifta Support",
      message: "Thank you for the feedback. We are glad you liked it!",
      createdAt: new Date(Date.now() - productIndex * 43_200_000).toISOString(),
    });

    if (productIndex < 12) {
      const quantity = 1 + (productIndex % 3);
      orderDocs.push({
        id: `ord-${product.id}`,
        storeId: store.id,
        productId: product.id,
        quantity,
        totalAmount: price * quantity,
        customerName: `Customer ${productIndex + 1}`,
        status:
          productIndex % 4 === 0
            ? "placed"
            : productIndex % 4 === 1
              ? "packed"
              : productIndex % 4 === 2
                ? "out-for-delivery"
                : "delivered",
        riderId: riderDocs[productIndex % riderDocs.length]?.id,
        createdAt: new Date(Date.now() - productIndex * 32_400_000).toISOString(),
      });
    }
  });

  if (offerDocs.length) {
    await offers.insertMany(offerDocs);
  }
  if (reviewDocs.length) {
    await reviews.insertMany(reviewDocs);
  }
  if (commentDocs.length) {
    await comments.insertMany(commentDocs);
  }
  if (orderDocs.length) {
    await orders.insertMany(orderDocs);
  }

  await products.createIndex({ id: 1 }, { unique: true });
  await products.createIndex({ storeId: 1, category: 1 });
  await products.createIndex({ slug: 1 }, { unique: true });
  await products.createIndex({ category: 1, rating: -1 });
  await offers.createIndex({ productId: 1, price: 1 });
  await offers.createIndex({ storeId: 1, inStock: 1, price: 1 });
  await reviews.createIndex({ productId: 1, createdAt: -1 });
  await comments.createIndex({ productId: 1, createdAt: -1 });
  await orders.createIndex({ storeId: 1, createdAt: -1 });
  await orders.createIndex({ customerUserObjectId: 1, createdAt: -1 });
  await orders.createIndex({ storeObjectId: 1, createdAt: -1 });
  await orders.createIndex({ productObjectId: 1, createdAt: -1 });
  await riders.createIndex({ status: 1, zone: 1 });

  return {
    users: userInsertDocs.length,
    products: productDocs.length,
    stores: storeDocs.length,
    offers: offerDocs.length,
    reviews: reviewDocs.length,
    comments: commentDocs.length,
    orders: orderDocs.length,
    riders: riderDocs.length,
  };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
