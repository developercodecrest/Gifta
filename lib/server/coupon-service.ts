import { randomUUID } from "crypto";
import { getMongoDb } from "@/lib/mongodb";
import { CouponDiscountType, CouponDto, CouponValidationResult } from "@/types/api";

type CouponDoc = CouponDto;

type CreateCouponInput = {
  code: string;
  title: string;
  description?: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscount?: number;
  minSubtotal?: number;
  active?: boolean;
  startsAt?: string;
  endsAt?: string;
  usageLimit?: number;
};

type UpdateCouponInput = {
  code?: string;
  title?: string;
  description?: string;
  discountType?: CouponDiscountType;
  discountValue?: number;
  maxDiscount?: number | null;
  minSubtotal?: number | null;
  active?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
};

function normalizeCode(code: string) {
  return code.trim().toUpperCase();
}

function isInActiveWindow(coupon: CouponDoc, nowIso: string) {
  if (coupon.startsAt && nowIso < coupon.startsAt) {
    return false;
  }

  if (coupon.endsAt && nowIso > coupon.endsAt) {
    return false;
  }

  return true;
}

function computeDiscount(coupon: CouponDoc, subtotal: number) {
  if (coupon.discountType === "flat") {
    return Math.max(0, Math.round(coupon.discountValue));
  }

  const percentDiscount = Math.round((subtotal * coupon.discountValue) / 100);
  if (typeof coupon.maxDiscount === "number" && coupon.maxDiscount > 0) {
    return Math.min(percentDiscount, Math.round(coupon.maxDiscount));
  }

  return Math.max(0, percentDiscount);
}

export async function listAdminCoupons() {
  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");
  return coupons.find().sort({ updatedAt: -1 }).toArray();
}

export async function createAdminCoupon(input: CreateCouponInput) {
  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");

  const code = normalizeCode(input.code);
  const existing = await coupons.findOne({ code });
  if (existing) {
    throw new Error("COUPON_CODE_EXISTS");
  }

  const now = new Date().toISOString();
  const doc: CouponDoc = {
    id: randomUUID(),
    code,
    title: input.title.trim(),
    description: input.description?.trim() || undefined,
    discountType: input.discountType,
    discountValue: Math.max(0, input.discountValue),
    maxDiscount: typeof input.maxDiscount === "number" ? Math.max(0, input.maxDiscount) : undefined,
    minSubtotal: typeof input.minSubtotal === "number" ? Math.max(0, input.minSubtotal) : undefined,
    active: input.active ?? true,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    usageLimit: typeof input.usageLimit === "number" ? Math.max(0, Math.floor(input.usageLimit)) : undefined,
    usedCount: 0,
    createdAt: now,
    updatedAt: now,
  };

  await coupons.insertOne(doc);
  return doc;
}

export async function updateAdminCoupon(id: string, updates: UpdateCouponInput) {
  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");

  const existing = await coupons.findOne({ id });
  if (!existing) {
    throw new Error("COUPON_NOT_FOUND");
  }

  const patch: Partial<CouponDoc> = {
    updatedAt: new Date().toISOString(),
  };

  if (typeof updates.code === "string") {
    const code = normalizeCode(updates.code);
    if (code !== existing.code) {
      const dupe = await coupons.findOne({ code });
      if (dupe && dupe.id !== id) {
        throw new Error("COUPON_CODE_EXISTS");
      }
    }
    patch.code = code;
  }

  if (typeof updates.title === "string") patch.title = updates.title.trim();
  if (typeof updates.description === "string") patch.description = updates.description.trim() || undefined;
  if (typeof updates.discountType === "string") patch.discountType = updates.discountType;
  if (typeof updates.discountValue === "number") patch.discountValue = Math.max(0, updates.discountValue);
  if (typeof updates.maxDiscount === "number") patch.maxDiscount = Math.max(0, updates.maxDiscount);
  if (updates.maxDiscount === null) patch.maxDiscount = undefined;
  if (typeof updates.minSubtotal === "number") patch.minSubtotal = Math.max(0, updates.minSubtotal);
  if (updates.minSubtotal === null) patch.minSubtotal = undefined;
  if (typeof updates.active === "boolean") patch.active = updates.active;
  if (typeof updates.startsAt === "string") patch.startsAt = updates.startsAt;
  if (updates.startsAt === null) patch.startsAt = undefined;
  if (typeof updates.endsAt === "string") patch.endsAt = updates.endsAt;
  if (updates.endsAt === null) patch.endsAt = undefined;
  if (typeof updates.usageLimit === "number") patch.usageLimit = Math.max(0, Math.floor(updates.usageLimit));
  if (updates.usageLimit === null) patch.usageLimit = undefined;

  await coupons.updateOne({ id }, { $set: patch });

  const updated = await coupons.findOne({ id });
  if (!updated) {
    throw new Error("COUPON_NOT_FOUND");
  }

  return updated;
}

export async function listAvailableCoupons(subtotal: number) {
  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");
  const now = new Date().toISOString();

  const docs = await coupons
    .find({ active: true })
    .sort({ updatedAt: -1 })
    .toArray();

  return docs.filter((coupon) => {
    if (!isInActiveWindow(coupon, now)) {
      return false;
    }

    if (typeof coupon.usageLimit === "number" && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
      return false;
    }

    if (typeof coupon.minSubtotal === "number" && subtotal > 0 && subtotal < coupon.minSubtotal) {
      return false;
    }

    return true;
  });
}

export async function validateCouponCode(rawCode: string | undefined, subtotal: number): Promise<CouponValidationResult> {
  const code = normalizeCode(rawCode ?? "");
  if (!code) {
    return {
      valid: false,
      code: "",
      discount: 0,
      message: "Enter coupon code.",
    };
  }

  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");
  const coupon = await coupons.findOne({ code });

  if (!coupon || !coupon.active) {
    return {
      valid: false,
      code,
      discount: 0,
      message: "Invalid coupon code.",
    };
  }

  const now = new Date().toISOString();
  if (!isInActiveWindow(coupon, now)) {
    return {
      valid: false,
      code,
      discount: 0,
      message: "Coupon is not active right now.",
    };
  }

  if (typeof coupon.usageLimit === "number" && coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return {
      valid: false,
      code,
      discount: 0,
      message: "Coupon usage limit has been reached.",
    };
  }

  if (typeof coupon.minSubtotal === "number" && subtotal < coupon.minSubtotal) {
    return {
      valid: false,
      code,
      discount: 0,
      message: `Minimum subtotal ${coupon.minSubtotal} required for ${coupon.code}.`,
      coupon,
    };
  }

  const discount = Math.min(Math.max(0, subtotal), computeDiscount(coupon, subtotal));

  return {
    valid: discount > 0,
    code,
    discount,
    message: discount > 0 ? `${coupon.code} applied successfully.` : "Coupon does not apply to this cart.",
    coupon,
  };
}

export async function incrementCouponUsage(code: string | undefined) {
  const normalized = normalizeCode(code ?? "");
  if (!normalized) {
    return;
  }

  const db = await getMongoDb();
  const coupons = db.collection<CouponDoc>("coupons");
  await coupons.updateOne({ code: normalized }, { $inc: { usedCount: 1 }, $set: { updatedAt: new Date().toISOString() } });
}
