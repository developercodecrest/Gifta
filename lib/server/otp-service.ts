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
  sendCount?: number;
  windowStartedAt?: Date;
};

type AuthUserDoc = {
  _id?: ObjectId;
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

function normalizePhone(value: string | null | undefined) {
  if (!value) return "";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  return "";
}

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const OTP_MAX_SENDS_PER_HOUR = 3;
const OTP_WINDOW_MS = 60 * 60 * 1000;
const AUTH_DEBUG = process.env.AUTH_DEBUG === "1";

function maskEmail(value: string | undefined) {
  if (!value) return "-";
  const [name, domain] = value.split("@");
  if (!name || !domain) return "-";
  const maskedName = name.length <= 2 ? `${name[0] ?? "*"}*` : `${name.slice(0, 2)}***`;
  return `${maskedName}@${domain}`;
}

function otpDebugLog(event: string, details: Record<string, unknown>) {
  if (!AUTH_DEBUG) return;
  console.info(`[otp-debug] ${event}`, details);
}

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

function buildDefaultProfilePatch(email: string, defaultRole: Role, phone?: string, fullName?: string): Omit<AuthUserDoc, "_id"> {
  const emailLocalName = normalizeEmail(email).split("@")[0];
  const normalizedPhone = normalizePhone(phone);
  const resolvedName = fullName?.trim() || emailLocalName;
  return {
    email: normalizeEmail(email),
    emailVerified: new Date(),
    fullName: resolvedName,
    phone: normalizedPhone,
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
  phone?: string;
  defaultRole?: Role;
}) {
  const defaultRole = parseRole(input.defaultRole ?? "USER");
  const normalizedPhone = normalizePhone(input.phone);
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
        await users.updateOne({ _id: existingByEmail._id }, { $set: profilePatch, $unset: { name: "" } });
      }

      return {
        id: existingByEmail._id.toString(),
        email: existingByEmail.email,
        name: existingByEmail.fullName,
        fullName: existingByEmail.fullName,
        phone: normalizePhone(existingByEmail.phone),
        role: parseRole(existingByEmail.role ?? defaultRole),
      };
    }

    await users.updateOne(
      { _id: objectId },
      {
        $set: {
          ...buildDefaultProfilePatch(input.email, defaultRole, normalizedPhone, input.name),
          ...(input.name ? { fullName: input.name } : {}),
          ...(normalizedPhone ? { phone: normalizedPhone } : {}),
        },
        $unset: {
          name: "",
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
    if (input.name && !existing.fullName) {
      patch.fullName = input.name;
    }
    if (normalizedPhone && existing.phone !== normalizedPhone) {
      patch.phone = normalizedPhone;
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
        $unset: {
          name: "",
        },
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
    name: updated.fullName,
    fullName: updated.fullName,
    phone: normalizePhone(updated.phone),
    role: parseRole(updated.role ?? defaultRole),
  };
}

export async function ensureAuthUserRole(
  email: string,
  defaultRole: Role = "USER",
  options?: { forceDefaultRole?: boolean; phone?: string; fullName?: string },
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPhone = normalizePhone(options?.phone);
  const resolvedRole = parseRole(defaultRole);
  const { users } = await getCollections();

  let user = await findAuthUserByEmailInsensitive(normalizedEmail);
  if (!user) {
    await users.updateOne(
      { email: normalizedEmail },
      {
        $setOnInsert: buildDefaultProfilePatch(normalizedEmail, resolvedRole, normalizedPhone, options?.fullName),
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
          role: resolvedRole,
        },
      },
    );
    user.role = resolvedRole;
  }

  const profilePatch: Partial<AuthUserDoc> = {};
  if (user.email !== normalizedEmail) profilePatch.email = normalizedEmail;
  if (!user.fullName) profilePatch.fullName = options?.fullName?.trim() ?? normalizedEmail.split("@")[0];
  if (options?.fullName?.trim() && user.fullName !== options.fullName.trim()) profilePatch.fullName = options.fullName.trim();
  if (normalizedPhone && user.phone !== normalizedPhone) profilePatch.phone = normalizedPhone;
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
        $unset: {
          name: "",
        },
      },
    );
  }

  return {
    id: user._id?.toString() ?? "",
    email: user.email,
    name: options?.fullName?.trim() || user.fullName,
    fullName: options?.fullName?.trim() || user.fullName,
    phone: normalizedPhone || normalizePhone(user.phone),
    role: parseRole(user.role ?? resolvedRole),
  };
}

export async function getAuthUserByEmail(email: string) {
  return findAuthUserByEmailInsensitive(email);
}

export async function getAuthUserByPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  if (!normalizedPhone) {
    return null;
  }

  const { users } = await getCollections();
  const escaped = normalizedPhone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return users.findOne({ phone: { $regex: `^${escaped}$`, $options: "i" } });
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
  const latestByEmail = await otpCodes.findOne(
    { email },
    { sort: { createdAt: -1 } },
  );

  const inActiveWindow = Boolean(
    latestByEmail?.windowStartedAt &&
      now.getTime() - latestByEmail.windowStartedAt.getTime() < OTP_WINDOW_MS,
  );

  const windowStartedAt = inActiveWindow ? latestByEmail!.windowStartedAt! : now;
  const sentInWindow = inActiveWindow ? Math.max(0, latestByEmail?.sendCount ?? 1) : 0;

  otpDebugLog("request.start", {
    email: maskEmail(email),
    hadExistingDoc: Boolean(latestByEmail?._id),
    inActiveWindow,
    sentInWindow,
  });

  if (sentInWindow >= OTP_MAX_SENDS_PER_HOUR) {
    const retryAfterMs = Math.max(0, OTP_WINDOW_MS - (now.getTime() - windowStartedAt.getTime()));

    otpDebugLog("request.rate_limited", {
      email: maskEmail(email),
      retryAfterMs,
    });

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

  if (latestByEmail?._id) {
    await otpCodes.updateOne(
      { _id: latestByEmail._id },
      {
        $set: {
          email,
          codeHash,
          createdAt: now,
          expiresAt,
          attempts: 0,
          ip: input.ip,
          sendCount: sentInWindow + 1,
          windowStartedAt,
        },
        $unset: {
          consumedAt: "",
        },
      },
    );
  } else {
    await otpCodes.insertOne({
      email,
      codeHash,
      createdAt: now,
      expiresAt,
      attempts: 0,
      ip: input.ip,
      sendCount: 1,
      windowStartedAt,
    });
  }

  otpDebugLog("request.saved", {
    email: maskEmail(email),
    mode: latestByEmail?._id ? "update" : "insert",
    sendsUsed: sentInWindow + 1,
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

export async function requestOtpForPhone(input: { phone: string; ip?: string }) {
  const user = await getAuthUserByPhone(input.phone);
  if (!user?.email) {
    return {
      ok: false as const,
      code: "USER_NOT_FOUND",
      message: "No account found for this phone number.",
    };
  }

  return requestOtpForEmail({
    email: user.email,
    ip: input.ip,
  });
}

export async function verifyOtpAndGetUser(input: {
  email?: string;
  phone?: string;
  otp: string;
  createIfMissing?: boolean;
  fullName?: string;
}) {
  const normalizedPhone = normalizePhone(input.phone);
  let email = input.email ? normalizeEmail(input.email) : "";
  if (!email && normalizedPhone) {
    const userByPhone = await getAuthUserByPhone(normalizedPhone);
    email = userByPhone?.email ? normalizeEmail(userByPhone.email) : "";
  }
  if (!email) {
    return null;
  }
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

  otpDebugLog("verify.lookup", {
    email: maskEmail(email),
    found: Boolean(latest),
    createIfMissing,
  });

  if (!latest) {
    otpDebugLog("verify.rejected_no_active_code", {
      email: maskEmail(email),
    });
    return null;
  }

  if (latest.attempts >= OTP_MAX_ATTEMPTS) {
    otpDebugLog("verify.rejected_max_attempts", {
      email: maskEmail(email),
      attempts: latest.attempts,
    });
    return null;
  }

  const incomingHash = buildCodeHash(email, otp);

  if (incomingHash !== latest.codeHash) {
    await otpCodes.updateOne({ _id: latest._id }, { $inc: { attempts: 1 } });
    otpDebugLog("verify.rejected_hash_mismatch", {
      email: maskEmail(email),
      attemptsBeforeIncrement: latest.attempts,
    });
    return null;
  }

  await otpCodes.updateOne({ _id: latest._id }, { $set: { consumedAt: new Date() } });
  otpDebugLog("verify.consumed", {
    email: maskEmail(email),
  });

  if (!createIfMissing) {
    const existing = await getAuthUserByEmail(email);
    if (!existing) {
      otpDebugLog("verify.rejected_missing_user_signin", {
        email: maskEmail(email),
      });
      return null;
    }

    otpDebugLog("verify.success_signin", {
      email: maskEmail(email),
      userId: existing._id?.toString() ?? "",
    });
    return ensureAuthUserRole(email, "USER", {
      fullName: input.fullName,
      phone: normalizedPhone || undefined,
    });
  }

  otpDebugLog("verify.success_signup", {
    email: maskEmail(email),
  });

  return ensureAuthUserRole(email, "USER", {
    fullName: input.fullName,
    phone: normalizedPhone || undefined,
  });
}
