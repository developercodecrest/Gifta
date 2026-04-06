import { ObjectId } from "mongodb";
import { publishCartSnapshot } from "@/lib/server/firebase-realtime";
import { getMongoDb } from "@/lib/mongodb";
import { CartItem } from "@/types/ecommerce";
import { getCartLineIdentity, normalizeCartLine } from "@/lib/cart-customization";

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
    .map((entry) => normalizeCartLine(entry))
    .filter((entry): entry is CartItem => Boolean(entry));
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

  await publishCartSnapshot(userId, normalized).catch(() => undefined);

  return normalized;
}

export async function mergeUserCart(userId: string, localItems: CartItem[]): Promise<CartItem[]> {
  const dbItems = await getUserCart(userId);
  const map = new Map<string, CartItem>();
  const makeKey = (item: CartItem) => getCartLineIdentity(item);

  for (const item of dbItems) {
    const normalized = normalizeCartLine(item);
    if (!normalized) {
      continue;
    }
    map.set(makeKey(normalized), normalized);
  }

  for (const item of localItems) {
    const normalized = normalizeCartLine(item);
    if (!normalized) {
      continue;
    }

    const key = makeKey(normalized);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, normalized);
      continue;
    }

    map.set(key, {
      ...existing,
      quantity: normalized.quantity,
      offerId: normalized.offerId ?? existing.offerId,
      variantId: normalized.variantId ?? existing.variantId,
      variantOptions: normalized.variantOptions ?? existing.variantOptions,
      customization: normalized.customization ?? existing.customization,
      customizationSignature: normalized.customizationSignature ?? existing.customizationSignature,
    });
  }

  return setUserCart(userId, Array.from(map.values()));
}
