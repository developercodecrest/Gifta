import crypto from "node:crypto";
import { ObjectId } from "mongodb";
import { parseRole } from "@/lib/roles";
import { getMongoDb } from "@/lib/mongodb";
import { Role } from "@/types/api";

const ACCESS_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REFRESH_TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 30;

type AuthUserDoc = {
  _id?: ObjectId;
  email: string;
  name?: string;
  role?: Role;
};

type MobileSessionDoc = {
  _id?: ObjectId;
  userId: string;
  accessTokenHash: string;
  refreshTokenHash: string;
  accessExpiresAt: Date;
  refreshExpiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  revokedAt?: Date;
  userAgent?: string;
  ip?: string;
};

export type MobileSessionUser = {
  id: string;
  email: string;
  name?: string;
  role: Role;
};

export type MobileTokenBundle = {
  token: string;
  refreshToken: string;
  expiresAt: string;
  refreshExpiresAt: string;
  user: MobileSessionUser;
};

function toObjectId(value: string) {
  if (!ObjectId.isValid(value)) {
    return null;
  }
  return new ObjectId(value);
}

function getTokenSecret() {
  return process.env.AUTH_SECRET ?? "gifta-dev-secret";
}

function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(rawToken: string) {
  return crypto.createHash("sha256").update(`${rawToken}:${getTokenSecret()}`).digest("hex");
}

async function getCollections() {
  const db = await getMongoDb();
  return {
    sessions: db.collection<MobileSessionDoc>("mobile_sessions"),
    users: db.collection<AuthUserDoc>("users"),
  };
}

async function ensureIndexes() {
  const { sessions } = await getCollections();
  await sessions.createIndex({ accessTokenHash: 1 }, { unique: true });
  await sessions.createIndex({ refreshTokenHash: 1 }, { unique: true });
  await sessions.createIndex({ refreshExpiresAt: 1 }, { expireAfterSeconds: 0 });
  await sessions.createIndex({ userId: 1, revokedAt: 1 });
}

async function getUserById(userId: string): Promise<MobileSessionUser | null> {
  const objectId = toObjectId(userId);
  if (!objectId) {
    return null;
  }

  const { users } = await getCollections();
  const user = await users.findOne({ _id: objectId });
  if (!user) {
    return null;
  }

  return {
    id: user._id?.toString() ?? userId,
    email: user.email,
    name: user.name,
    role: parseRole(user.role ?? "user"),
  };
}

export async function createMobileTokenBundle(input: {
  userId: string;
  ip?: string;
  userAgent?: string;
}): Promise<MobileTokenBundle | null> {
  const user = await getUserById(input.userId);
  if (!user) {
    return null;
  }

  await ensureIndexes();

  const token = generateToken();
  const refreshToken = generateToken();
  const now = new Date();
  const accessExpiresAt = new Date(now.getTime() + ACCESS_TOKEN_TTL_MS);
  const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);

  const { sessions } = await getCollections();
  await sessions.insertOne({
    userId: user.id,
    accessTokenHash: hashToken(token),
    refreshTokenHash: hashToken(refreshToken),
    accessExpiresAt,
    refreshExpiresAt,
    createdAt: now,
    updatedAt: now,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  return {
    token,
    refreshToken,
    expiresAt: accessExpiresAt.toISOString(),
    refreshExpiresAt: refreshExpiresAt.toISOString(),
    user,
  };
}

export async function getUserFromAccessToken(rawToken: string): Promise<MobileSessionUser | null> {
  const token = rawToken.trim();
  if (!token) {
    return null;
  }

  const now = new Date();
  const { sessions } = await getCollections();
  const session = await sessions.findOne({
    accessTokenHash: hashToken(token),
    revokedAt: { $exists: false },
    accessExpiresAt: { $gt: now },
    refreshExpiresAt: { $gt: now },
  });

  if (!session) {
    return null;
  }

  return getUserById(session.userId);
}

export async function rotateMobileTokenBundle(input: {
  refreshToken: string;
  ip?: string;
  userAgent?: string;
}): Promise<MobileTokenBundle | null> {
  const now = new Date();
  const { sessions } = await getCollections();
  const existing = await sessions.findOne({
    refreshTokenHash: hashToken(input.refreshToken.trim()),
    revokedAt: { $exists: false },
    refreshExpiresAt: { $gt: now },
  });

  if (!existing) {
    return null;
  }

  const next = await createMobileTokenBundle({
    userId: existing.userId,
    ip: input.ip,
    userAgent: input.userAgent,
  });

  if (!next) {
    return null;
  }

  await sessions.updateOne(
    { _id: existing._id },
    {
      $set: {
        revokedAt: now,
        updatedAt: now,
      },
    },
  );

  return next;
}

export async function revokeMobileSessionByRefreshToken(refreshToken: string) {
  const now = new Date();
  const { sessions } = await getCollections();
  await sessions.updateOne(
    {
      refreshTokenHash: hashToken(refreshToken.trim()),
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: now,
        updatedAt: now,
      },
    },
  );
}
