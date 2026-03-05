import crypto from "node:crypto";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { Role } from "@/types/api";
import { parseRole } from "@/lib/roles";

type OtpCodeDoc = {
  _id?: ObjectId;
  email: string;
  codeHash: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt?: Date;
  attempts: number;
  ip?: string;
};

type AuthUserDoc = {
  _id?: ObjectId;
  name?: string;
  fullName?: string;
  email: string;
  phone?: string;
  addresses?: Array<{
    label: string;
    receiverName: string;
    receiverPhone: string;
    line1: string;
    city: string;
    state: string;
    pinCode: string;
    country: string;
  }>;
  preferences?: {
    occasions?: string[];
    budgetMin?: number;
    budgetMax?: number;
    preferredTags?: string[];
  };
  updatedAt?: string;
  emailVerified?: Date | null;
  image?: string | null;
  role?: string;
};

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS_PER_HOUR = 3;
const OTP_WINDOW_MS = 60 * 60 * 1000;

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getOtpSecret() {
  return process.env.AUTH_SECRET ?? "gifta-dev-secret";
}

function buildCodeHash(email: string, otpCode: string) {
  return crypto.createHash("sha256").update(`${email}:${otpCode}:${getOtpSecret()}`).digest("hex");
}

function randomOtpCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error("SMTP_HOST is missing. Configure SMTP credentials to send OTP emails.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

async function getCollections() {
  const db = await getMongoDb();
  return {
    otpCodes: db.collection<OtpCodeDoc>("otp_codes"),
    users: db.collection<AuthUserDoc>("users"),
  };
}

function buildDefaultProfilePatch(email: string, defaultRole: Role): Omit<AuthUserDoc, "_id"> {
  const emailLocalName = normalizeEmail(email).split("@")[0];
  return {
    email: normalizeEmail(email),
    emailVerified: new Date(),
    name: emailLocalName,
    fullName: emailLocalName,
    phone: "",
    addresses: [],
    preferences: {
      occasions: ["Birthday", "Anniversary"],
      budgetMin: 1000,
      budgetMax: 5000,
      preferredTags: ["same-day", "premium"],
    },
    updatedAt: new Date().toISOString(),
    role: defaultRole,
  };
}

async function findAuthUserByEmailInsensitive(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const { users } = await getCollections();
  const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return users.findOne({ email: { $regex: `^${escaped}$`, $options: "i" } });
}

export async function ensureAuthUserById(input: {
  userId: string;
  email?: string;
  name?: string;
  defaultRole?: Role;
}) {
  const defaultRole = input.defaultRole ?? "user";
  if (!ObjectId.isValid(input.userId)) {
    if (!input.email) {
      throw new Error("Invalid user id and missing email.");
    }
    return ensureAuthUserRole(input.email, defaultRole);
  }

  const { users } = await getCollections();
  const objectId = new ObjectId(input.userId);
  const existing = await users.findOne({ _id: objectId });

  if (!existing) {
    if (!input.email) {
      throw new Error("User not found and missing email.");
    }

    const existingByEmail = await findAuthUserByEmailInsensitive(input.email);
    if (existingByEmail?._id) {
      const profilePatch: Partial<AuthUserDoc> = {
        updatedAt: new Date().toISOString(),
      };
      if (!existingByEmail.name && input.name) profilePatch.name = input.name;
      if (!existingByEmail.fullName && input.name) profilePatch.fullName = input.name;
      if (!existingByEmail.role) profilePatch.role = defaultRole;
      if (!Array.isArray(existingByEmail.addresses)) profilePatch.addresses = [];
      if (!existingByEmail.preferences) {
        profilePatch.preferences = {
          occasions: ["Birthday", "Anniversary"],
          budgetMin: 1000,
          budgetMax: 5000,
          preferredTags: ["same-day", "premium"],
        };
      }

      if (Object.keys(profilePatch).length > 0) {
        await users.updateOne({ _id: existingByEmail._id }, { $set: profilePatch });
      }

      return {
        id: existingByEmail._id.toString(),
        email: existingByEmail.email,
        name: existingByEmail.name,
        role: parseRole(existingByEmail.role ?? defaultRole),
      };
    }

    await users.updateOne(
      { _id: objectId },
      {
        $set: {
          ...buildDefaultProfilePatch(input.email, defaultRole),
          ...(input.name ? { name: input.name, fullName: input.name } : {}),
        },
      },
      { upsert: true },
    );
  } else {
    const patch: Partial<AuthUserDoc> = {
      updatedAt: new Date().toISOString(),
    };

    if (input.email) {
      patch.email = normalizeEmail(input.email);
    }
    if (input.name && !existing.name) {
      patch.name = input.name;
    }
    if (input.name && !existing.fullName) {
      patch.fullName = input.name;
    }
    if (!existing.role) {
      patch.role = defaultRole;
    }
    if (!Array.isArray(existing.addresses)) {
      patch.addresses = [];
    }
    if (!existing.preferences) {
      patch.preferences = {
        occasions: ["Birthday", "Anniversary"],
        budgetMin: 1000,
        budgetMax: 5000,
        preferredTags: ["same-day", "premium"],
      };
    }

    await users.updateOne(
      { _id: objectId },
      {
        $set: patch,
      },
    );
  }

  const updated = await users.findOne({ _id: objectId });
  if (!updated) {
    throw new Error("Unable to load auth user by id.");
  }

  return {
    id: updated._id?.toString() ?? input.userId,
    email: updated.email,
    name: updated.name,
    role: parseRole(updated.role ?? defaultRole),
  };
}

export async function ensureAuthUserRole(
  email: string,
  defaultRole: Role = "user",
  options?: { forceDefaultRole?: boolean },
) {
  const normalizedEmail = normalizeEmail(email);
  const { users } = await getCollections();

  let user = await findAuthUserByEmailInsensitive(normalizedEmail);
  if (!user) {
    await users.updateOne(
      { email: normalizedEmail },
      {
        $setOnInsert: buildDefaultProfilePatch(normalizedEmail, defaultRole),
      },
      { upsert: true },
    );
    user = await findAuthUserByEmailInsensitive(normalizedEmail);
  }

  if (!user) {
    throw new Error("Unable to load or create auth user.");
  }

  if (!user.role || options?.forceDefaultRole) {
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          role: defaultRole,
        },
      },
    );
    user.role = defaultRole;
  }

  const profilePatch: Partial<AuthUserDoc> = {};
  if (user.email !== normalizedEmail) profilePatch.email = normalizedEmail;
  if (!user.fullName) profilePatch.fullName = user.name ?? normalizedEmail.split("@")[0];
  if (!Array.isArray(user.addresses)) profilePatch.addresses = [];
  if (!user.preferences) {
    profilePatch.preferences = {
      occasions: ["Birthday", "Anniversary"],
      budgetMin: 1000,
      budgetMax: 5000,
      preferredTags: ["same-day", "premium"],
    };
  }

  if (Object.keys(profilePatch).length > 0) {
    profilePatch.updatedAt = new Date().toISOString();
    await users.updateOne(
      { _id: user._id },
      {
        $set: profilePatch,
      },
    );
  }

  return {
    id: user._id?.toString() ?? "",
    email: user.email,
    name: user.name,
    role: parseRole(user.role ?? defaultRole),
  };
}

export async function getAuthUserByEmail(email: string) {
  return findAuthUserByEmailInsensitive(email);
}

export async function getAuthUserById(userId: string) {
  if (!ObjectId.isValid(userId)) {
    return null;
  }

  const { users } = await getCollections();
  return users.findOne({ _id: new ObjectId(userId) });
}

export async function requestOtpForEmail(input: { email: string; ip?: string }) {
  const email = normalizeEmail(input.email);
  const { otpCodes } = await getCollections();
  const now = new Date();
  const windowStart = new Date(now.getTime() - OTP_WINDOW_MS);

  const sentInWindow = await otpCodes.countDocuments({
    email,
    createdAt: { $gte: windowStart },
  });

  if (sentInWindow >= OTP_MAX_SENDS_PER_HOUR) {
    const firstInWindow = await otpCodes.findOne(
      {
        email,
        createdAt: { $gte: windowStart },
      },
      { sort: { createdAt: 1 } },
    );

    const retryAfterMs = firstInWindow
      ? Math.max(0, OTP_WINDOW_MS - (now.getTime() - firstInWindow.createdAt.getTime()))
      : OTP_WINDOW_MS;

    return {
      ok: false as const,
      code: "OTP_RATE_LIMIT",
      message: "OTP limit reached. Please wait 1 hour before requesting again.",
      retryAfterMs,
      sendsLeft: 0,
    };
  }

  const otpCode = randomOtpCode();
  const codeHash = buildCodeHash(email, otpCode);
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await otpCodes.insertOne({
    email,
    codeHash,
    createdAt: now,
    expiresAt,
    attempts: 0,
    ip: input.ip,
  });

  await otpCodes.createIndex({ email: 1, createdAt: -1 });
  await otpCodes.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  const from = process.env.EMAIL_FROM;
  if (!from) {
    throw new Error("EMAIL_FROM is missing. Configure sender email.");
  }

  const transporter = getTransporter();
  await transporter.sendMail({
    from,
    to: email,
    subject: "Your Gifta OTP Code",
    text: `Your one-time code is ${otpCode}. It expires in 10 minutes.`,
    html: `<p>Your one-time code is <strong>${otpCode}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });

  return {
    ok: true as const,
    message: "OTP sent successfully.",
    sendsLeft: Math.max(0, OTP_MAX_SENDS_PER_HOUR - (sentInWindow + 1)),
  };
}

export async function verifyOtpAndGetUser(input: { email: string; otp: string; createIfMissing?: boolean }) {
  const email = normalizeEmail(input.email);
  const otp = input.otp.trim();
  const createIfMissing = input.createIfMissing ?? true;
  const { otpCodes } = await getCollections();
  const now = new Date();

  const latest = await otpCodes.findOne(
    {
      email,
      consumedAt: { $exists: false },
      expiresAt: { $gt: now },
    },
    {
      sort: { createdAt: -1 },
    },
  );

  if (!latest) {
    return null;
  }

  if (latest.attempts >= OTP_MAX_ATTEMPTS) {
    return null;
  }

  const incomingHash = buildCodeHash(email, otp);

  if (incomingHash !== latest.codeHash) {
    await otpCodes.updateOne({ _id: latest._id }, { $inc: { attempts: 1 } });
    return null;
  }

  await otpCodes.updateOne({ _id: latest._id }, { $set: { consumedAt: new Date() } });

  if (!createIfMissing) {
    const existing = await getAuthUserByEmail(email);
    if (!existing) {
      return null;
    }

    return ensureAuthUserRole(email, "user");
  }

  return ensureAuthUserRole(email, "user");
}
