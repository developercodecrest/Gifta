import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { getMongoDb } from "@/lib/mongodb";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { checkDelhiveryServiceability, DelhiveryApiError, getDelhiveryConfig, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart } from "@/lib/server/user-cart-service";
import { AdminOrderDto } from "@/types/api";

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

  let cartItems = [];
  if (userId) {
    cartItems = await getUserCart(userId).catch(() => []);
  } else {
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

  const promo = getPromoDetails(payload.promoCode, snapshot.subtotal);
  const total = Math.max(0, snapshot.total - promo.discount);

  const razorpay = new Razorpay({
    key_id: razorpayKeyId,
    key_secret: razorpayKeySecret,
  });

  const orderRef = createOrderRef();
  let order;

  try {
    order = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: orderRef,
      notes: {
        customerName: payload.customer?.fullName ?? "",
        customerEmail: payload.customer?.email ?? "",
        customerPhone: payload.customer?.phone ?? "",
        city: payload.customer?.city ?? "",
        addressLabel: payload.customer?.addressLabel ?? "",
        promoCode: promo.code,
        lineCount: String(snapshot.lines.length),
      },
    });
  } catch (error) {
    const razorpayError = error as {
      statusCode?: number;
      error?: { code?: string; description?: string };
    };

    if (razorpayError?.statusCode === 401) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "RAZORPAY_AUTH_FAILED",
            message: "Razorpay authentication failed. Provide a valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET pair for the same test or live mode.",
            details: {
              providerCode: razorpayError.error?.code,
              providerDescription: razorpayError.error?.description,
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
  const orders = db.collection<AdminOrderDto>("orders");
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
  const orderRows: AdminOrderDto[] = snapshot.lines.map((line, index) => ({
    id: `${orderRef}-${String(index + 1).padStart(2, "0")}`,
    orderRef,
    customerUserId: userId,
    storeId: line.selectedOffer?.storeId ?? "direct",
    productId: line.product.id,
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
    shippingProvider: "delhivery",
    shippingProviderStatus: "pending-payment",
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
        shipping: snapshot.shipping,
        tax: snapshot.tax,
        platformFee: snapshot.platformFee,
        discount: promo.discount,
        total,
      },
    },
  });
}

function getPromoDetails(rawCode: string | undefined, subtotal: number) {
  const code = (rawCode ?? "").trim().toUpperCase();

  if (!code) {
    return {
      code: "",
      discount: 0,
    };
  }

  if (code === "GIFT10") {
    return {
      code,
      discount: Math.round(subtotal * 0.1),
    };
  }

  if (code === "WELCOME15") {
    return {
      code,
      discount: subtotal >= 3000 ? Math.round(subtotal * 0.15) : 0,
    };
  }

  if (code === "FREESHIP") {
    return {
      code,
      discount: 199,
    };
  }

  return {
    code,
    discount: 0,
  };
}

function createOrderRef() {
  return `GFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
}
