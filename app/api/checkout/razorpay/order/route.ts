import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { getUserCart } from "@/lib/server/user-cart-service";

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

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
  if (!razorpayKeyId || !razorpayKeySecret) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "RAZORPAY_CONFIG_MISSING", message: "Razorpay is not configured on server." },
      },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as OrderRequest;
  const session = await auth();
  const userId = session?.user?.id;

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
  const order = await razorpay.orders.create({
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
