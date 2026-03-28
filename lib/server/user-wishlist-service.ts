import { ObjectId } from "mongodb";
import { publishWishlistSnapshot } from "@/lib/server/firebase-realtime";
import { getMongoDb } from "@/lib/mongodb";

type UserWishlistDoc = {
  userId: ObjectId;
  legacyUserId?: string;
  productIds: string[];
  updatedAt: string;
};

function toObjectId(userId: string) {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

function normalizeProductIds(productIds: string[]) {
  return Array.from(
    new Set(
      productIds
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => Boolean(entry)),
    ),
  );
}

export async function getUserWishlist(userId: string): Promise<string[]> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const db = await getMongoDb();
  const collection = db.collection<UserWishlistDoc>("user_wishlists");

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

  return doc?.productIds ?? [];
}

export async function setUserWishlist(userId: string, productIds: string[]): Promise<string[]> {
  const normalized = normalizeProductIds(productIds);
  const objectId = toObjectId(userId);

  if (!objectId) {
    return normalized;
  }

  const db = await getMongoDb();
  const collection = db.collection<UserWishlistDoc>("user_wishlists");

  await collection.createIndex({ userId: 1 }, { unique: true });

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
        productIds: normalized,
        updatedAt: new Date().toISOString(),
      },
      $unset: {
        legacyUserId: "",
      },
    },
    { upsert: true },
  );

  await publishWishlistSnapshot(userId, normalized).catch(() => undefined);

  return normalized;
}
