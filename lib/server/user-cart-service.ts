import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { CartItem } from "@/types/ecommerce";

type UserCartDoc = {
  userId: ObjectId;
  legacyUserId?: string;
  items: CartItem[];
  updatedAt: string;
};

function toObjectId(userId: string) {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

function normalizeItems(items: CartItem[]) {
  return items
    .filter((entry) => entry.productId)
    .map((entry) => ({
      productId: entry.productId,
      quantity: Math.max(1, Math.floor(entry.quantity || 1)),
      offerId: typeof entry.offerId === "string" ? entry.offerId : undefined,
      variantId: typeof entry.variantId === "string" ? entry.variantId : undefined,
      variantOptions:
        entry.variantOptions && typeof entry.variantOptions === "object"
          ? Object.fromEntries(
              Object.entries(entry.variantOptions)
                .map(([key, value]) => [key.trim(), typeof value === "string" ? value.trim() : ""] as const)
                .filter(([key, value]) => Boolean(key) && Boolean(value)),
            )
          : undefined,
    }));
}

export async function getUserCart(userId: string): Promise<CartItem[]> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const db = await getMongoDb();
  const collection = db.collection<UserCartDoc>("user_carts");

  await collection.createIndex({ userId: 1 }, { unique: true });

  const doc = await collection.findOne({
    $or: [
      { userId: objectId },
      { legacyUserId: userId },
      { userId: userId as unknown as ObjectId },
    ],
  });

  if (doc && !doc.userId.equals(objectId)) {
    await collection.updateOne(
      { userId: doc.userId },
      {
        $set: { userId: objectId, updatedAt: new Date().toISOString() },
        $unset: { legacyUserId: "" },
      },
    );
  }

  return doc?.items ?? [];
}

export async function setUserCart(userId: string, items: CartItem[]): Promise<CartItem[]> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return normalizeItems(items);
  }

  const db = await getMongoDb();
  const collection = db.collection<UserCartDoc>("user_carts");

  await collection.createIndex({ userId: 1 }, { unique: true });

  const normalized = normalizeItems(items);
  await collection.updateOne(
    {
      $or: [
        { userId: objectId },
        { legacyUserId: userId },
        { userId: userId as unknown as ObjectId },
      ],
    },
    {
      $set: {
        userId: objectId,
        items: normalized,
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        legacyUserId: "",
      },
    },
    { upsert: true },
  );

  return normalized;
}

export async function mergeUserCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
  const dbItems = await getUserCart(userId);
  const map = new Map<string, CartItem>();
  const makeKey = (item: CartItem) => `${item.productId}::${item.variantId ?? "default"}`;

  for (const item of dbItems) {
    map.set(makeKey(item), item);
  }

  for (const item of localItems) {
    const key = makeKey(item);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        productId: item.productId,
        quantity: Math.max(1, Math.floor(item.quantity || 1)),
        offerId: item.offerId,
        variantId: item.variantId,
        variantOptions: item.variantOptions,
      });
      continue;
    }

    map.set(key, {
      productId: item.productId,
      quantity: existing.quantity + Math.max(1, Math.floor(item.quantity || 1)),
      offerId: item.offerId ?? existing.offerId,
      variantId: item.variantId ?? existing.variantId,
      variantOptions: item.variantOptions ?? existing.variantOptions,
    });
  }

  return setUserCart(userId, Array.from(map.values()));
}
