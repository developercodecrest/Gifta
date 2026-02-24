import { ObjectId } from "mongodb";
import { products as seedProducts } from "@/data/products";
import { categories } from "@/lib/catalog";
import { getMongoDb } from "@/lib/mongodb";
import {
  AdminDashboardPayload,
  AdminOrderDto,
  CommentDto,
  HomePayload,
  OfferDto,
  ProductDetailsDto,
  ProductListItemDto,
  ProfileDto,
  RiderDto,
  ReviewDto,
  SearchMeta,
  SortOption,
  StoreDto,
  UserOrderDto,
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

type ProfileDoc = {
  profileKey: string;
  fullName: string;
  email: string;
  phone?: string;
  addresses: ProfileDto["addresses"];
  preferences: ProfileDto["preferences"];
  updatedAt: string;
};

type RiderDoc = RiderDto;
type OrderDoc = AdminOrderDto;

const DEMO_PROFILE_KEY = "demo";

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
    products: db.collection<ProductDoc>("products"),
    stores: db.collection<StoreDoc>("stores"),
    offers: db.collection<OfferDoc>("offers"),
    reviews: db.collection<ReviewDoc>("reviews"),
    comments: db.collection<CommentDoc>("comments"),
    profiles: db.collection<ProfileDoc>("profiles"),
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

export async function getProfile(profileKey = DEMO_PROFILE_KEY): Promise<ProfileDto | null> {
  const { profiles } = await getCollections();
  const doc = await profiles.findOne({ profileKey });
  if (!doc) {
    return null;
  }

  return {
    ...doc,
    addresses: normalizeProfileAddresses(doc.addresses, doc.fullName, doc.phone),
  };
}

export async function upsertProfile(
  update: {
    fullName?: string;
    email?: string;
    phone?: string;
    addresses?: ProfileDto["addresses"];
    preferences?: Partial<ProfileDto["preferences"]>;
  },
  profileKey = DEMO_PROFILE_KEY,
): Promise<ProfileDto> {
  const { profiles } = await getCollections();
  const existing = await profiles.findOne({ profileKey });

  const nextDoc: ProfileDto = {
    profileKey,
    fullName: update.fullName ?? existing?.fullName ?? "Gifta Guest",
    email: update.email ?? existing?.email ?? "guest@gifta.local",
    phone: update.phone ?? existing?.phone,
    addresses: normalizeProfileAddresses(
      update.addresses ?? existing?.addresses,
      update.fullName ?? existing?.fullName ?? "Gifta Guest",
      update.phone ?? existing?.phone,
    ),
    preferences: {
      occasions: update.preferences?.occasions ?? existing?.preferences.occasions ?? ["Birthday", "Anniversary"],
      budgetMin: update.preferences?.budgetMin ?? existing?.preferences.budgetMin ?? 1000,
      budgetMax: update.preferences?.budgetMax ?? existing?.preferences.budgetMax ?? 5000,
      preferredTags: update.preferences?.preferredTags ?? existing?.preferences.preferredTags ?? ["same-day", "premium"],
    },
    updatedAt: new Date().toISOString(),
  };

  await profiles.updateOne({ profileKey }, { $set: nextDoc }, { upsert: true });
  return nextDoc;
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
  const { stores, products, offers } = await getCollections();
  const [storeDocs, productDocs, offerDocs] = await Promise.all([
    stores.find().toArray(),
    products.find().toArray(),
    offers.find().toArray(),
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
  const { stores, products, offers, orders, riders, profiles } = await getCollections();

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
    profiles.countDocuments(),
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
  const { products } = await getCollections();
  const docs = (await products.find().sort({ featured: -1, rating: -1 }).limit(200).toArray())
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
}) {
  const { products } = await getCollections();

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
  const { orders } = await getCollections();
  return orders.find().sort({ createdAt: -1 }).limit(200).toArray();
}

const statusPriority: Record<AdminOrderDto["status"], number> = {
  "placed": 0,
  "packed": 1,
  "out-for-delivery": 2,
  "delivered": 3,
  "cancelled": 4,
};

export async function getUserOrders(customerEmail?: string): Promise<UserOrderDto[]> {
  const { orders, products } = await getCollections();

  const query: Record<string, unknown> = {};
  if (customerEmail) {
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

export async function getAdminUsers() {
  const { profiles } = await getCollections();
  return profiles.find().sort({ updatedAt: -1 }).toArray();
}

export async function getAdminRiders() {
  const { riders } = await getCollections();
  return riders.find().sort({ activeDeliveries: -1, fullName: 1 }).toArray();
}

export async function seedDemoData() {
  const { products, stores, offers, reviews, comments, profiles, riders, orders } = await getCollections();

  const storeDocs: StoreDoc[] = [
    { id: "st-nyra", name: "Nyra Gifts", slug: "nyra-gifts", ownerUserId: "usr-store-1", rating: 4.7, active: true },
    { id: "st-aurora", name: "Aurora Hampers", slug: "aurora-hampers", ownerUserId: "usr-store-2", rating: 4.8, active: true },
    { id: "st-bliss", name: "Bliss Crates", slug: "bliss-crates", ownerUserId: "usr-store-3", rating: 4.6, active: true },
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

  await profiles.updateOne(
    { profileKey: DEMO_PROFILE_KEY },
    {
      $set: {
        profileKey: DEMO_PROFILE_KEY,
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

  await profiles.updateOne(
    { profileKey: "usr-store-1" },
    {
      $set: {
        profileKey: "usr-store-1",
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

  await profiles.updateOne(
    { profileKey: "usr-store-2" },
    {
      $set: {
        profileKey: "usr-store-2",
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

  await profiles.updateOne(
    { profileKey: "usr-store-3" },
    {
      $set: {
        profileKey: "usr-store-3",
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
