import { ObjectId } from "mongodb";
import { products as seedProducts } from "@/data/products";
import { categories } from "@/lib/catalog";
import { getMongoDb } from "@/lib/mongodb";
import {
  AdminDashboardPayload,
  AdminOrderDto,
  CommentDto,
  HomePayload,
  OrderTrackingStep,
  OfferDto,
  ProductDetailsDto,
  ProductListItemDto,
  ProfileDto,
  RiderDto,
  ReviewDto,
  SearchMeta,
  SortOption,
  StoreDto,
  Role,
  UserOrderDetailsDto,
  UserOrderDto,
  UserNotificationDto,
  VendorSummaryDto,
} from "@/types/api";
import { Product } from "@/types/ecommerce";

type StoreDoc = StoreDto;

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
  name?: string;
  role?: Role;
  fullName?: string;
  email: string;
  phone?: string;
  addresses?: ProfileDto["addresses"];
  preferences?: ProfileDto["preferences"];
  notificationReadIds?: string[];
  notificationLastReadAt?: string;
  updatedAt?: string;
};

type RiderDoc = RiderDto;
type OrderDoc = AdminOrderDto;

type AdminScope = {
  role: Role;
  userId: string;
};

const DEMO_PROFILE_KEY = "demo";

function toObjectId(value: string) {
  return ObjectId.isValid(value) ? new ObjectId(value) : null;
}

function profileDocToDto(doc: UserDoc): ProfileDto {
  const userId = doc._id?.toString() ?? "";
  const fullName = doc.fullName ?? doc.name ?? "Gifta User";
  return {
    userId,
    fullName,
    email: doc.email,
    phone: doc.phone,
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

function normalizeProfileAddresses(addresses: ProfileDto["addresses"] | undefined, fallbackName: string, fallbackPhone?: string) {
  return (addresses ?? []).map((address) => ({
    label: address.label,
    receiverName: (address as ProfileDto["addresses"][number]).receiverName ?? fallbackName,
    receiverPhone: (address as ProfileDto["addresses"][number]).receiverPhone ?? fallbackPhone ?? "",
    line1: address.line1,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    country: address.country,
  }));
}

function normalizeInventoryProduct<T extends ProductDoc>(product: T): T {
  const minOrderQty = typeof product.minOrderQty === "number" ? Math.max(1, Math.floor(product.minOrderQty)) : 1;
  const rawMax = typeof product.maxOrderQty === "number" ? Math.max(0, Math.floor(product.maxOrderQty)) : 10;
  const hiddenByQty = rawMax === 0;
  const maxOrderQty = hiddenByQty ? 0 : Math.max(minOrderQty, rawMax);

  return {
    ...product,
    minOrderQty,
    maxOrderQty,
    inStock: product.inStock && !hiddenByQty,
  };
}

function isPurchasableProduct(product: ProductDoc) {
  const normalized = normalizeInventoryProduct(product);
  return normalized.inStock && (normalized.maxOrderQty ?? 10) > 0;
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
  };
}

export async function listStores(): Promise<StoreDto[]> {
  const { stores } = await getCollections();
  return stores.find().sort({ rating: -1, name: 1 }).toArray();
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
  const storesById = toMap(storeDocs);

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

export async function getHomeData(): Promise<HomePayload> {
  const { products } = await getCollections();
  const featuredDocs = (await products.find({ featured: true }).limit(20).toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct)
    .slice(0, 6);
  const topRatedDocs = (await products.find().sort({ rating: -1 }).limit(20).toArray())
    .map(normalizeInventoryProduct)
    .filter(isPurchasableProduct)
    .slice(0, 6);

  const allIds = Array.from(new Set([...featuredDocs, ...topRatedDocs].map((entry) => entry.id)));
  const { offersByProduct } = await getOffersForProducts(allIds);

  const toListItem = (product: ProductDoc): ProductListItemDto => {
    const offers = offersByProduct.get(product.id) ?? [];
    return {
      ...normalizeInventoryProduct(product),
      bestOffer: offers[0],
      offerCount: offers.length,
    };
  };

  return {
    featured: featuredDocs.map(toListItem),
    topRated: topRatedDocs.map(toListItem),
    categories: [...categories],
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
    name: existing?.name,
    role: existing?.role,
    fullName: update.fullName ?? existing?.fullName ?? "Gifta Guest",
    email: update.email ?? existing?.email ?? "guest@gifta.local",
    phone: update.phone ?? existing?.phone,
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
  const { products, offers } = await getCollections();

  const query: Record<string, unknown> = {};

  if (filters.q) {
    const regex = new RegExp(escapeRegex(filters.q), "i");
    query.$or = [{ name: regex }, { description: regex }, { tags: regex }];
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
      $or: [{ name: regex }, { description: regex }, { tags: regex }],
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
  return getVendorSummariesScoped({ role: "sadmin", userId: "system" });
}

async function getStoreIdsForScope(scope: AdminScope) {
  const { stores } = await getCollections();
  if (scope.role === "sadmin") {
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

  return storeDocs
    .map((store) => {
      const offerCount = offerDocs.filter((entry) => entry.storeId === store.id).length;
      const productIds = new Set(offerDocs.filter((entry) => entry.storeId === store.id).map((entry) => entry.productId));
      const itemCount = productDocs.filter((product) => productIds.has(product.id)).length;
      return {
        ...store,
        itemCount,
        offerCount,
      };
    })
    .sort((left, right) => Number(right.active) - Number(left.active) || right.rating - left.rating);
}

export async function getAdminDashboard(): Promise<AdminDashboardPayload> {
  return getAdminDashboardScoped({ role: "sadmin", userId: "system" });
}

export async function getAdminDashboardScoped(scope: AdminScope): Promise<AdminDashboardPayload> {
  const { stores, products, offers, orders, riders, users } = await getCollections();

  if (scope.role === "storeOwner") {
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
    ] = await Promise.all([
      stores.countDocuments({ id: { $in: scopedStoreIds } }),
      stores.countDocuments({ id: { $in: scopedStoreIds }, active: true }),
      offers.countDocuments({ storeId: { $in: scopedStoreIds } }),
      orders.countDocuments({ storeId: { $in: scopedStoreIds } }),
      orders.countDocuments({ storeId: { $in: scopedStoreIds }, status: { $in: ["placed", "packed", "out-for-delivery"] } }),
      orders.distinct("riderId", { storeId: { $in: scopedStoreIds }, riderId: { $exists: true } }),
      offers.distinct("productId", { storeId: { $in: scopedStoreIds } }),
    ]);

    const validRiderIds = riderIds.filter((value): value is string => typeof value === "string" && value.length > 0);
    const totalRiders = validRiderIds.length;
    const activeRiders = validRiderIds.length
      ? await riders.countDocuments({ id: { $in: validRiderIds }, status: { $in: ["available", "on-delivery"] } })
      : 0;

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
  ]);

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
  };
}

export async function getAdminItems() {
  return getAdminItemsScoped({ role: "sadmin", userId: "system" });
}

export async function getAdminItemsScoped(scope: AdminScope) {
  const { products } = await getCollections();
  let scopedProductIds: string[] | null = null;

  if (scope.role === "storeOwner") {
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

  if (input.scope?.role === "storeOwner") {
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
  return getAdminOrdersScoped({ role: "sadmin", userId: "system" });
}

export async function getAdminOrdersScoped(scope: AdminScope) {
  const { orders } = await getCollections();
  if (scope.role === "sadmin") {
    return orders.find().sort({ createdAt: -1 }).limit(200).toArray();
  }

  const scopedStoreIds = await getStoreIdsForScope(scope);
  if (!scopedStoreIds.length) {
    return [];
  }

  return orders.find({ storeId: { $in: scopedStoreIds } }).sort({ createdAt: -1 }).limit(200).toArray();
}

const statusPriority: Record<AdminOrderDto["status"], number> = {
  "placed": 0,
  "packed": 1,
  "out-for-delivery": 2,
  "delivered": 3,
  "cancelled": 4,
};

export async function getUserOrders(userId: string, customerEmail?: string): Promise<UserOrderDto[]> {
  const { orders, products } = await getCollections();
  const objectId = toObjectId(userId);

  const query: Record<string, unknown> = {};
  if (objectId) {
    query.$or = [
      { customerUserId: objectId.toString() },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  } else if (customerEmail) {
    query.customerEmail = customerEmail;
  }

  const [orderDocs, productDocs] = await Promise.all([
    orders.find(query).sort({ createdAt: -1 }).limit(200).toArray(),
    products.find().toArray(),
  ]);

  const productsById = toMap(productDocs);
  const grouped = new Map<string, AdminOrderDto[]>();

  for (const order of orderDocs) {
    const key = order.orderRef ?? order.id;
    const current = grouped.get(key) ?? [];
    current.push(order);
    grouped.set(key, current);
  }

  const output: UserOrderDto[] = Array.from(grouped.entries()).map(([orderRef, entries]) => {
    const sorted = [...entries].sort((left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    const placedAt = sorted[0]?.createdAt ?? new Date().toISOString();
    const totalAmount = entries.reduce((total, entry) => total + entry.totalAmount, 0);
    const itemCount = entries.reduce((total, entry) => total + entry.quantity, 0);
    const topStatus = [...entries]
      .sort((left, right) => statusPriority[right.status] - statusPriority[left.status])[0]?.status ?? "placed";

    const productNames = entries
      .map((entry) => productsById.get(entry.productId)?.name)
      .filter((value): value is string => Boolean(value));

    return {
      orderRef,
      placedAt,
      status: topStatus,
      totalAmount,
      itemCount,
      deliveryAddressLabel: entries[0]?.deliveryAddressLabel,
      itemsSummary:
        productNames.slice(0, 2).join(", ") +
        (productNames.length > 2 ? ` +${productNames.length - 2} more` : ""),
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
  if (objectId) {
    query.$and = [
      {
        $or: [
          { customerUserId: objectId.toString() },
          ...(customerEmail ? [{ customerEmail }] : []),
        ],
      },
    ];
  } else if (customerEmail) {
    query.customerEmail = customerEmail;
  }

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
    storeId: entry.storeId,
    storeName: storesById.get(entry.storeId)?.name,
    quantity: entry.quantity,
    totalAmount: entry.totalAmount,
    status: entry.status,
    riderId: entry.riderId,
    riderName: entry.riderId ? ridersById.get(entry.riderId)?.fullName : undefined,
    createdAt: entry.createdAt,
  }));

  return {
    orderRef: orderDocs[0]?.orderRef ?? orderDocs[0]?.id ?? trimmedOrderRef,
    placedAt: sortedByTime[0]?.createdAt ?? new Date().toISOString(),
    lastUpdatedAt: sortedByTime[sortedByTime.length - 1]?.createdAt ?? new Date().toISOString(),
    status: latestStatus,
    totalAmount,
    itemCount,
    itemsSummary,
    deliveryAddressLabel: orderDocs[0]?.deliveryAddressLabel,
    customerName: orderDocs[0]?.customerName,
    customerEmail: orderDocs[0]?.customerEmail,
    customerPhone: orderDocs[0]?.customerPhone,
    paymentId: orderDocs[0]?.paymentId,
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
      { customerUserId: objectId.toString() },
      ...(customerEmail ? [{ customerEmail }] : []),
    ];
  } else if (customerEmail) {
    query.customerEmail = customerEmail;
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

    const paidEntry = entries.find((entry) => Boolean(entry.paymentId));
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
        name: newProfile.fullName,
        role: "user",
      },
      $set: newProfile,
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

export async function getAdminRiders() {
  const { riders } = await getCollections();
  return riders.find().sort({ activeDeliveries: -1, fullName: 1 }).toArray();
}

export async function seedDemoData() {
  const { users, products, stores, offers, reviews, comments, riders, orders } = await getCollections();

  const ensureUser = async (input: { email: string; name: string; role: Role }) => {
    await users.updateOne(
      { email: input.email },
      {
        $setOnInsert: {
          email: input.email,
          name: input.name,
          role: input.role,
          emailVerified: new Date(),
        },
      },
      { upsert: true },
    );

    return users.findOne({ email: input.email });
  };

  const [demoUser, owner1, owner2, owner3] = await Promise.all([
    ensureUser({ email: "demo@gifta.local", name: "Gifta Demo User", role: "user" }),
    ensureUser({ email: "owner1@gifta.local", name: "Nyra Owner", role: "storeOwner" }),
    ensureUser({ email: "owner2@gifta.local", name: "Aurora Owner", role: "storeOwner" }),
    ensureUser({ email: "owner3@gifta.local", name: "Bliss Owner", role: "storeOwner" }),
  ]);

  if (!demoUser?._id || !owner1?._id || !owner2?._id || !owner3?._id) {
    throw new Error("Unable to seed users for demo data");
  }

  const storeDocs: StoreDoc[] = [
    { id: "st-nyra", name: "Nyra Gifts", slug: "nyra-gifts", ownerUserId: owner1._id.toString(), rating: 4.7, active: true },
    { id: "st-aurora", name: "Aurora Hampers", slug: "aurora-hampers", ownerUserId: owner2._id.toString(), rating: 4.8, active: true },
    { id: "st-bliss", name: "Bliss Crates", slug: "bliss-crates", ownerUserId: owner3._id.toString(), rating: 4.6, active: true },
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

  if (seedProducts.length) {
    await products.insertMany(seedProducts.map(normalizeInventoryProduct));
  }

  if (storeDocs.length) {
    await stores.insertMany(storeDocs);
  }
  if (riderDocs.length) {
    await riders.insertMany(riderDocs);
  }

  const offerDocs: OfferDoc[] = [];
  const reviewDocs: ReviewDoc[] = [];
  const commentDocs: CommentDoc[] = [];
  const orderDocs: OrderDoc[] = [];

  seedProducts.forEach((product, productIndex) => {
    storeDocs.forEach((store, storeIndex) => {
      const multiplier = 0.92 + ((productIndex + storeIndex) % 7) * 0.03;
      const price = Math.round(product.price * multiplier);
      const originalPrice = Math.max(price + 200, product.originalPrice ?? Math.round(price * 1.15));
      const offerId = `of-${product.id}-${store.id}`;
      const reviewId = `rv-${product.id}-${store.id}`;

      offerDocs.push({
        id: offerId,
        productId: product.id,
        storeId: store.id,
        price,
        originalPrice,
        inStock: product.inStock && (productIndex + storeIndex) % 4 !== 0,
        deliveryEtaHours: 12 + ((productIndex + storeIndex) % 5) * 8,
      });

      reviewDocs.push({
        id: reviewId,
        productId: product.id,
        author: `Shopper ${productIndex + storeIndex + 1}`,
        rating: Math.min(5, Math.max(3, Math.round(product.rating))),
        title: "Great gifting experience",
        comment: `Loved the ${product.name}. Packaging and delivery were smooth.`,
        createdAt: new Date(Date.now() - (productIndex + storeIndex) * 86_400_000).toISOString(),
        helpfulCount: (productIndex + storeIndex) % 12,
      });

      commentDocs.push({
        id: `cm-${product.id}-${store.id}`,
        productId: product.id,
        reviewId,
        author: "Gifta Support",
        message: "Thank you for the feedback. We are glad you liked it!",
        createdAt: new Date(Date.now() - (productIndex + storeIndex) * 43_200_000).toISOString(),
      });

      if (storeIndex === 0 && productIndex < 8) {
        orderDocs.push({
          id: `ord-${product.id}-${store.id}`,
          storeId: store.id,
          productId: product.id,
          quantity: 1 + (productIndex % 3),
          totalAmount: price * (1 + (productIndex % 3)),
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

  await users.updateOne(
    { _id: demoUser._id },
    {
      $set: {
        fullName: "Gifta Demo User",
        email: "demo@gifta.local",
        phone: "+91-9000000000",
        addresses: [
          {
            label: "Home",
            receiverName: "Gifta Demo User",
            receiverPhone: "+91-9000000000",
            line1: "42 Celebration Avenue",
            city: "Bengaluru",
            state: "Karnataka",
            pinCode: "560001",
            country: "India",
          },
        ],
        preferences: {
          occasions: ["Birthday", "Anniversary", "Festive"],
          budgetMin: 1000,
          budgetMax: 5000,
          preferredTags: ["same-day", "luxury", "personalized"],
        },
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  await users.updateOne(
    { _id: owner1._id },
    {
      $set: {
        fullName: "Nyra Owner",
        email: "owner1@gifta.local",
        updatedAt: new Date().toISOString(),
        addresses: [],
        preferences: {
          occasions: ["Corporate", "Wedding"],
          budgetMin: 500,
          budgetMax: 20000,
          preferredTags: ["luxury", "bulk"],
        },
      },
    },
    { upsert: true },
  );

  await users.updateOne(
    { _id: owner2._id },
    {
      $set: {
        fullName: "Aurora Owner",
        email: "owner2@gifta.local",
        updatedAt: new Date().toISOString(),
        addresses: [],
        preferences: {
          occasions: ["Anniversary", "Birthday"],
          budgetMin: 600,
          budgetMax: 15000,
          preferredTags: ["same-day", "premium"],
        },
      },
    },
    { upsert: true },
  );

  await users.updateOne(
    { _id: owner3._id },
    {
      $set: {
        fullName: "Bliss Owner",
        email: "owner3@gifta.local",
        updatedAt: new Date().toISOString(),
        addresses: [],
        preferences: {
          occasions: ["Festive", "Self Care"],
          budgetMin: 400,
          budgetMax: 12000,
          preferredTags: ["family", "daily"],
        },
      },
    },
    { upsert: true },
  );

  await products.createIndex({ id: 1 }, { unique: true });
  await products.createIndex({ slug: 1 }, { unique: true });
  await products.createIndex({ category: 1, rating: -1 });
  await offers.createIndex({ productId: 1, price: 1 });
  await offers.createIndex({ storeId: 1, inStock: 1, price: 1 });
  await reviews.createIndex({ productId: 1, createdAt: -1 });
  await comments.createIndex({ productId: 1, createdAt: -1 });
  await orders.createIndex({ storeId: 1, createdAt: -1 });
  await riders.createIndex({ status: 1, zone: 1 });

  return {
    products: seedProducts.length,
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
