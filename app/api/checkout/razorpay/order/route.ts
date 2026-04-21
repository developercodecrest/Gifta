import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { getMongoDb } from "@/lib/mongodb";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { checkDelhiveryServiceability, DelhiveryApiError, estimateDelhiveryDeliveryFee, getDelhiveryConfig, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { validateCouponCode } from "@/lib/server/coupon-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart } from "@/lib/server/user-cart-service";
import { AdminOrderDto } from "@/types/api";

export const runtime = "nodejs";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

function hasUsableRazorpayCredentials() {
  const keyId = razorpayKeyId?.trim();
  const keySecret = razorpayKeySecret?.trim();

  if (!keyId || !keySecret) {
    return false;
  }

  if (/x{6,}/i.test(keyId) || /x{6,}/i.test(keySecret)) {
    return false;
  }

  return /^rzp_(test|live)_/.test(keyId);
}

type OrderRequest = {
  promoCode?: string;
  customer?: {
    fullName?: string;
    email?: string;
    phone?: string;
    line1?: string;
    city?: string;
    state?: string;
    pinCode?: string;
    addressLabel?: string;
  };
};

type ProductRefDoc = {
  _id: ObjectId;
  id: string;
};

type StoreRefDoc = {
  _id: ObjectId;
  id: string;
};

type AdminOrderRecord = AdminOrderDto & {
  customerUserObjectId?: ObjectId;
  storeObjectId?: ObjectId;
  productObjectId?: ObjectId;
};

type RazorpayCreateOrderPayload = {
  amount: number;
  currency: string;
  receipt: string;
  notes: Record<string, string>;
};

type RazorpayOrderResponse = {
  id: string;
  amount: number;
  currency: string;
};

type RazorpayErrorResponse = {
  error?: {
    code?: string;
    description?: string;
  };
};

class RazorpayOrderCreateError extends Error {
  status: number;
  providerCode?: string;
  providerDescription?: string;
  details?: unknown;

  constructor(status: number, details: unknown) {
    super("Razorpay order creation failed.");
    this.name = "RazorpayOrderCreateError";
    this.status = status;
    this.details = details;

    if (isRazorpayErrorResponse(details)) {
      this.providerCode = details.error?.code;
      this.providerDescription = details.error?.description;
    }
  }
}

function parseRazorpayResponseBody(responseText: string): unknown {
  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText) as unknown;
  } catch {
    return responseText;
  }
}

function isRazorpayOrderResponse(value: unknown): value is RazorpayOrderResponse {
  return Boolean(
    value
      && typeof value === "object"
      && "id" in value
      && typeof value.id === "string"
      && "amount" in value
      && typeof value.amount === "number"
      && "currency" in value
      && typeof value.currency === "string",
  );
}

function isRazorpayErrorResponse(value: unknown): value is RazorpayErrorResponse {
  return Boolean(value && typeof value === "object" && "error" in value && typeof value.error === "object");
}

async function createRazorpayOrder(payload: RazorpayCreateOrderPayload) {
  const keyId = razorpayKeyId?.trim();
  const keySecret = razorpayKeySecret?.trim();

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials are missing.");
  }

  const basicAuthToken = Buffer.from(`${keyId}:${keySecret}`, "utf8").toString("base64");
  const endpoint = new URL("/v1/orders", "https://api.razorpay.com");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${basicAuthToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const responseText = await response.text();
  const responseBody = parseRazorpayResponseBody(responseText);

  if (!response.ok) {
    throw new RazorpayOrderCreateError(response.status, responseBody);
  }

  if (!isRazorpayOrderResponse(responseBody)) {
    throw new Error("Razorpay order response was invalid.");
  }

  return responseBody;
}

export async function POST(request: Request) {
  if (!hasUsableRazorpayCredentials()) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RAZORPAY_CONFIG_MISSING",
          message: "Razorpay test credentials are missing or still using placeholder values. Set a real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
        },
      },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as OrderRequest;

  if (isDelhiveryConfigured()) {
    if (!payload.customer?.line1 || !payload.customer.city || !payload.customer.state || !payload.customer.pinCode) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DELIVERY_ADDRESS_REQUIRED",
            message: "Full delivery address is required for shipment creation.",
          },
        },
        { status: 400 },
      );
    }

    try {
      const serviceability = await checkDelhiveryServiceability(payload.customer.pinCode);
      if (!serviceability.serviceable) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "UNSERVICEABLE_PINCODE",
              message: "Delivery is currently unavailable for this pincode.",
              details: {
                pinCode: payload.customer.pinCode,
                remark: serviceability.remark,
              },
            },
          },
          { status: 400 },
        );
      }
    } catch (error) {
      if (error instanceof DelhiveryApiError) {
        console.warn("Delhivery serviceability lookup failed during Razorpay order creation.", {
          status: error.status,
          code: error.code,
        });
      } else {
        console.warn("Unexpected Delhivery serviceability failure during Razorpay order creation.", error);
      }
    }
  }

  const identity = await resolveRequestIdentity(request);
  const userId = identity?.userId;

  if (!userId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Sign in is required to continue checkout.",
        },
      },
      { status: 401 },
    );
  }

  let cartItems = [];
  cartItems = await getUserCart(userId).catch(() => []);
  if (!cartItems.length) {
    const cookieStore = await cookies();
    const cartCookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    cartItems = parseCartCookie(cartCookie);
  }

  const snapshot = await buildCartSnapshot(cartItems);
  if (!snapshot.lines.length) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "CART_EMPTY", message: "Your cart is empty." },
      },
      { status: 400 },
    );
  }

  const couponValidation = await validateCouponCode(payload.promoCode, snapshot.subtotal);
  const discount = couponValidation.valid ? couponValidation.discount : 0;
  const deliveryEstimate = payload.customer?.pinCode
    ? await estimateDelhiveryDeliveryFee(payload.customer.pinCode, snapshot.subtotal)
    : { estimatedFee: snapshot.shipping, source: "fallback" as const, serviceable: true };
  const shipping = deliveryEstimate.estimatedFee;
  const totalBeforeDiscount = snapshot.subtotal + snapshot.tax + snapshot.platformFee + shipping;
  const total = Math.max(0, totalBeforeDiscount - discount);

  if (total <= 0) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INVALID_ORDER_AMOUNT",
          message: "Razorpay checkout requires a payable amount greater than zero.",
        },
      },
      { status: 400 },
    );
  }

  const orderRef = createOrderRef();
  let order;

  try {
    order = await createRazorpayOrder({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: orderRef,
      notes: {
        customerName: payload.customer?.fullName ?? "",
        customerEmail: payload.customer?.email ?? "",
        customerPhone: payload.customer?.phone ?? "",
        city: payload.customer?.city ?? "",
        addressLabel: payload.customer?.addressLabel ?? "",
        promoCode: couponValidation.valid ? couponValidation.code : "",
        deliveryFeeSource: deliveryEstimate.source,
        lineCount: String(snapshot.lines.length),
      },
    });
  } catch (error) {
    if (error instanceof RazorpayOrderCreateError && error.status === 401) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RAZORPAY_AUTH_FAILED",
            message: "Razorpay authentication failed. Provide a valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET pair for the same test or live mode.",
            details: {
              providerCode: error.providerCode,
              providerDescription: error.providerDescription,
            },
          },
        },
        { status: 500 },
      );
    }

    console.error("Razorpay order creation failed.", error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "RAZORPAY_ORDER_CREATE_FAILED",
          message: "Unable to create Razorpay order right now.",
        },
      },
      { status: 500 },
    );
  }

  const db = await getMongoDb();
  const orders = db.collection<AdminOrderRecord>("orders");
  const products = db.collection<ProductRefDoc>("products");
  const stores = db.collection<StoreRefDoc>("stores");
  const now = new Date().toISOString();
  const basePackage = isDelhiveryConfigured()
    ? getDelhiveryConfig().defaultPackage
    : {
        deadWeightKg: 0.5,
        lengthCm: 20,
        breadthCm: 15,
        heightCm: 10,
        quantity: 1,
      };

    const productIds = Array.from(new Set(snapshot.lines.map((line) => line.product.id).filter(Boolean)));
    const storeIds = Array.from(
      new Set(
        snapshot.lines
          .map((line) => line.selectedOffer?.storeId)
          .filter((storeId): storeId is string => Boolean(storeId && storeId !== "direct")),
      ),
    );

    const [productDocs, storeDocs] = await Promise.all([
      productIds.length ? products.find({ id: { $in: productIds } }, { projection: { _id: 1, id: 1 } }).toArray() : Promise.resolve([]),
      storeIds.length ? stores.find({ id: { $in: storeIds } }, { projection: { _id: 1, id: 1 } }).toArray() : Promise.resolve([]),
    ]);

    const productObjectIdById = new Map(productDocs.map((entry) => [entry.id, entry._id]));
    const storeObjectIdById = new Map(storeDocs.map((entry) => [entry.id, entry._id]));
    const customerUserObjectId = ObjectId.isValid(userId) ? new ObjectId(userId) : undefined;

    const orderRows: AdminOrderRecord[] = snapshot.lines.map((line, index) => ({
    id: `${orderRef}-${String(index + 1).padStart(2, "0")}`,
    orderRef,
    customerUserId: userId,
      ...(customerUserObjectId ? { customerUserObjectId } : {}),
    storeId: line.selectedOffer?.storeId ?? "direct",
      ...(line.selectedOffer?.storeId && storeObjectIdById.get(line.selectedOffer.storeId)
        ? { storeObjectId: storeObjectIdById.get(line.selectedOffer.storeId) }
        : {}),
    productId: line.product.id,
      ...(productObjectIdById.get(line.product.id) ? { productObjectId: productObjectIdById.get(line.product.id) } : {}),
    quantity: line.quantity,
    totalAmount: line.lineSubtotal,
    customerName: payload.customer?.fullName ?? "Gifta Customer",
    customerEmail: payload.customer?.email,
    customerPhone: payload.customer?.phone,
    deliveryAddressLabel: payload.customer?.addressLabel,
    deliveryAddress: payload.customer?.line1 && payload.customer?.city && payload.customer?.state && payload.customer?.pinCode
      ? {
          line1: payload.customer.line1,
          city: payload.customer.city,
          state: payload.customer.state,
          pinCode: payload.customer.pinCode,
          country: "India",
          receiverName: payload.customer.fullName,
          receiverPhone: payload.customer.phone,
        }
      : undefined,
    status: "placed",
    paymentMethod: "razorpay",
    transactionStatus: "pending",
    razorpayOrderId: order.id,
    promoCode: couponValidation.valid ? couponValidation.code : undefined,
    discountAmount: discount,
    deliveryFee: shipping,
    shippingProvider: "delhivery",
    shippingProviderStatus: "pending-payment",
    customization: line.customization,
    customizationSignature: line.customizationSignature,
    shippingPackage: {
      ...basePackage,
      quantity: Math.max(1, line.quantity),
    },
    createdAt: now,
  }));

  await orders.insertMany(orderRows);

  return NextResponse.json({
    success: true,
    data: {
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      orderRef,
      keyId: razorpayKeyId,
      breakdown: {
        subtotal: snapshot.subtotal,
        shipping,
        tax: snapshot.tax,
        platformFee: snapshot.platformFee,
        discount,
        total,
      },
    },
  });
}

function createOrderRef() {
  return `GFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
