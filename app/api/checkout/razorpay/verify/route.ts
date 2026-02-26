import crypto from "crypto";
import Razorpay from "razorpay";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CART_COOKIE_NAME, parseCartCookie } from "@/lib/cart-cookie";
import { buildCartSnapshot } from "@/lib/server/cart-service";
import { getMongoDb } from "@/lib/mongodb";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { getUserCart, setUserCart } from "@/lib/server/user-cart-service";
import { AdminOrderDto } from "@/types/api";

type VerifyRequest = {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  orderRef?: string;
};

export async function POST(request: Request) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "RAZORPAY_CONFIG_MISSING", message: "Razorpay is not configured on server." },
      },
      { status: 500 },
    );
  }

  const payload = (await request.json().catch(() => ({}))) as VerifyRequest;

  if (!payload.razorpayOrderId || !payload.razorpayPaymentId || !payload.razorpaySignature) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "INVALID_PAYLOAD", message: "Missing Razorpay verification fields." },
      },
      { status: 400 },
    );
  }

  const digest = crypto
    .createHmac("sha256", keySecret)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  if (digest !== payload.razorpaySignature) {
    return NextResponse.json(
      {
        success: false,
        error: { code: "SIGNATURE_MISMATCH", message: "Payment signature verification failed." },
      },
      { status: 400 },
    );
  }

  const db = await getMongoDb();
  const orders = db.collection<AdminOrderDto>("orders");

  const existing = await orders.findOne({ paymentId: payload.razorpayPaymentId });
  if (existing) {
    return NextResponse.json({
      success: true,
      data: {
        orderId: existing.orderRef ?? existing.id,
        paymentId: payload.razorpayPaymentId,
      },
    });
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
        error: { code: "CART_EMPTY", message: "No cart items found for this payment verification." },
      },
      { status: 400 },
    );
  }

  const razorpay = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });

  const razorpayOrder = await razorpay.orders.fetch(payload.razorpayOrderId);
  const notes = razorpayOrder.notes ?? {};
  const customerName = typeof notes.customerName === "string" ? notes.customerName : "Gifta Customer";
  const customerEmail = typeof notes.customerEmail === "string" ? notes.customerEmail : undefined;
  const customerPhone = typeof notes.customerPhone === "string" ? notes.customerPhone : undefined;
  const deliveryAddressLabel = typeof notes.addressLabel === "string" ? notes.addressLabel : undefined;

  const orderRef = payload.orderRef ?? `GFT-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const now = new Date().toISOString();

  const orderRows: AdminOrderDto[] = snapshot.lines.map((line, index) => ({
    id: `${orderRef}-${String(index + 1).padStart(2, "0")}`,
    orderRef,
    paymentId: payload.razorpayPaymentId,
    razorpayOrderId: payload.razorpayOrderId,
    storeId: line.selectedOffer?.storeId ?? "direct",
    productId: line.product.id,
    quantity: line.quantity,
    totalAmount: line.lineSubtotal,
    customerName,
    customerEmail,
    customerPhone,
    deliveryAddressLabel,
    status: "placed",
    createdAt: now,
  }));

  await orders.insertMany(orderRows);

  if (userId) {
    await setUserCart(userId, []);
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: orderRef,
      paymentId: payload.razorpayPaymentId,
    },
  });
}
