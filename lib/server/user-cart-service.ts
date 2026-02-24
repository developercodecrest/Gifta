import { getMongoDb } from "@/lib/mongodb";
import { CartItem } from "@/types/ecommerce";

type UserCartDoc = {
  userId: string;
  items: CartItem[];
  updatedAt: string;
};

function normalizeItems(items: CartItem[]) {
  return items
    .filter((entry) => entry.productId)
    .map((entry) => ({
      productId: entry.productId,
      quantity: Math.max(1, Math.floor(entry.quantity || 1)),
      offerId: typeof entry.offerId === "string" ? entry.offerId : undefined,
    }));
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  const db = await getMongoDb();
  const collection = db.collection<UserCartDoc>("user_carts");

  await collection.createIndex({ userId: 1 }, { unique: true });

  const doc = await collection.findOne({ userId });
  return doc?.items ?? [];
}

export async function setUserCart(userId: string, items: CartItem[]): Promise<CartItem[]> {
  const db = await getMongoDb();
  const collection = db.collection<UserCartDoc>("user_carts");

  await collection.createIndex({ userId: 1 }, { unique: true });

  const normalized = normalizeItems(items);
  await collection.updateOne(
    { userId },
    {
      $set: {
        userId,
        items: normalized,
        updatedAt: new Date().toISOString(),
      },
    },
    { upsert: true },
  );

  return normalized;
}

export async function mergeUserCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
  const dbItems = await getUserCart(userId);
  const map = new Map<string, CartItem>();

  for (const item of dbItems) {
    map.set(item.productId, item);
  }

  for (const item of localItems) {
    const existing = map.get(item.productId);
    if (!existing) {
      map.set(item.productId, {
        productId: item.productId,
        quantity: Math.max(1, Math.floor(item.quantity || 1)),
        offerId: item.offerId,
      });
      continue;
    }

    map.set(item.productId, {
      productId: item.productId,
      quantity: existing.quantity + Math.max(1, Math.floor(item.quantity || 1)),
      offerId: item.offerId ?? existing.offerId,
    });
  }

  return setUserCart(userId, Array.from(map.values()));
}
