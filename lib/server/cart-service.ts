import { getMongoDb } from "@/lib/mongodb";
import { CartItem, Product } from "@/types/ecommerce";
import { OfferDto, StoreDto } from "@/types/api";

type OfferDoc = {
  id: string;
  productId: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  deliveryEtaHours: number;
};

type CartLine = {
  product: Product;
  quantity: number;
  offers: OfferDto[];
  selectedOffer?: OfferDto;
  lineSubtotal: number;
};

type VendorBucket = {
  storeId: string;
  storeName: string;
  lineItems: CartLine[];
  subtotal: number;
  shipping: number;
};

export type CartSnapshot = {
  lines: CartLine[];
  vendors: VendorBucket[];
  subtotal: number;
  shipping: number;
  tax: number;
  platformFee: number;
  total: number;
  itemCount: number;
};

export async function buildCartSnapshot(items: CartItem[]): Promise<CartSnapshot> {
  const safeItems = items
    .filter((entry) => entry.productId)
    .map((entry) => ({ ...entry, quantity: Math.max(1, Math.floor(entry.quantity)) }));

  if (!safeItems.length) {
    return {
      lines: [],
      vendors: [],
      subtotal: 0,
      shipping: 0,
      tax: 0,
      platformFee: 0,
      total: 0,
      itemCount: 0,
    };
  }

  const productIds = Array.from(new Set(safeItems.map((entry) => entry.productId)));
  const db = await getMongoDb();

  const [products, offers, stores] = await Promise.all([
    db.collection<Product>("products").find({ id: { $in: productIds } }).toArray(),
    db.collection<OfferDoc>("offers").find({ productId: { $in: productIds } }).toArray(),
    db.collection<StoreDto>("stores").find().toArray(),
  ]);

  const productsById = new Map(products.map((entry) => [entry.id, entry]));
  const storesById = new Map(stores.map((entry) => [entry.id, entry]));

  const offersByProduct = new Map<string, OfferDto[]>();
  for (const offer of offers) {
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

    const existing = offersByProduct.get(offer.productId) ?? [];
    existing.push(mapped);
    offersByProduct.set(offer.productId, existing);
  }

  for (const [productId, value] of offersByProduct.entries()) {
    offersByProduct.set(
      productId,
      value.sort((left, right) => left.price - right.price || left.deliveryEtaHours - right.deliveryEtaHours),
    );
  }

  const lines: CartLine[] = [];

  for (const item of safeItems) {
    const product = productsById.get(item.productId);
    if (!product) {
      continue;
    }

    const minOrderQty = typeof product.minOrderQty === "number" ? Math.max(1, Math.floor(product.minOrderQty)) : 1;
    const maxOrderQty = typeof product.maxOrderQty === "number" ? Math.max(0, Math.floor(product.maxOrderQty)) : 10;

    if (!product.inStock || maxOrderQty === 0) {
      continue;
    }

    const clampedQty = Math.min(Math.max(item.quantity, minOrderQty), maxOrderQty);

    const itemOffers = offersByProduct.get(item.productId) ?? [];
    const selectedOffer = item.offerId
      ? itemOffers.find((entry) => entry.id === item.offerId) ?? itemOffers[0]
      : itemOffers[0];

    const linePrice = selectedOffer?.price ?? product.price;

    lines.push({
      product,
      quantity: clampedQty,
      offers: itemOffers,
      selectedOffer,
      lineSubtotal: linePrice * clampedQty,
    });
  }

  const vendorMap = new Map<string, VendorBucket>();

  for (const line of lines) {
    const vendorId = line.selectedOffer?.storeId ?? "direct";
    const vendorName = line.selectedOffer?.store?.name ?? "Gifta Marketplace";

    const bucket = vendorMap.get(vendorId) ?? {
      storeId: vendorId,
      storeName: vendorName,
      lineItems: [],
      subtotal: 0,
      shipping: 0,
    };

    bucket.lineItems.push(line);
    bucket.subtotal += line.lineSubtotal;
    vendorMap.set(vendorId, bucket);
  }

  const vendors = Array.from(vendorMap.values())
    .map((vendor) => ({
      ...vendor,
      shipping: vendor.subtotal >= 1500 ? 0 : 99,
    }))
    .sort((left, right) => right.subtotal - left.subtotal);

  const subtotal = lines.reduce((total, line) => total + line.lineSubtotal, 0);
  const shipping = vendors.reduce((total, vendor) => total + vendor.shipping, 0);
  const tax = Math.round(subtotal * 0.05);
  const platformFee = subtotal > 0 && subtotal < 1000 ? 29 : 0;
  const total = subtotal + shipping + tax + platformFee;
  const itemCount = lines.reduce((total, line) => total + line.quantity, 0);

  return {
    lines,
    vendors,
    subtotal,
    shipping,
    tax,
    platformFee,
    total,
    itemCount,
  };
}
