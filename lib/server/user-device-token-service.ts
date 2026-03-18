import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";

type DevicePushToken = {
  token: string;
  platform: "android" | "ios";
  updatedAt: string;
};

type UserDoc = {
  _id: ObjectId;
  devicePushTokens?: DevicePushToken[];
};

function toObjectId(userId: string) {
  return ObjectId.isValid(userId) ? new ObjectId(userId) : null;
}

function normalizeToken(token: string) {
  return token.trim();
}

export async function upsertUserDevicePushToken(input: {
  userId: string;
  token: string;
  platform: "android" | "ios";
}) {
  const objectId = toObjectId(input.userId);
  const token = normalizeToken(input.token);

  if (!objectId || !token) {
    return false;
  }

  const db = await getMongoDb();
  const users = db.collection<UserDoc>("users");
  const now = new Date().toISOString();

  await users.updateOne(
    { _id: objectId },
    {
      $pull: {
        devicePushTokens: { token },
      },
    },
  );

  await users.updateOne(
    { _id: objectId },
    {
      $set: {
        updatedAt: now,
      },
      $push: {
        devicePushTokens: {
          token,
          platform: input.platform,
          updatedAt: now,
        },
      },
    },
    { upsert: true },
  );

  return true;
}

export async function getUserDevicePushTokens(userId: string) {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return [];
  }

  const db = await getMongoDb();
  const users = db.collection<UserDoc>("users");
  const user = await users.findOne({ _id: objectId }, { projection: { devicePushTokens: 1 } });

  const tokens = (user?.devicePushTokens ?? [])
    .map((entry) => normalizeToken(entry.token))
    .filter((value, index, list) => Boolean(value) && list.indexOf(value) === index);

  return tokens;
}

export async function removeUserDevicePushTokens(userId: string, tokens: string[]) {
  const objectId = toObjectId(userId);
  if (!objectId || !tokens.length) {
    return;
  }

  const db = await getMongoDb();
  const users = db.collection<UserDoc>("users");

  await users.updateOne(
    { _id: objectId },
    {
      $pull: {
        devicePushTokens: {
          token: { $in: tokens },
        },
      },
      $set: {
        updatedAt: new Date().toISOString(),
      },
    },
  );
}