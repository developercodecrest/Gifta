import crypto from "crypto";
import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { incrementCouponUsage } from "@/lib/server/coupon-service";
import { createShipmentForOrderRef, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { publishOrderSnapshot, publishUserNotification } from "@/lib/server/firebase-realtime";
import { resolveRequestIdentity } from "@/lib/server/request-auth";
import { setUserCart } from "@/lib/server/user-cart-service";
import { AdminOrderDto } from "@/types/api";

type VerifyRequest = {
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  orderRef?: string;
};

export const runtime = "nodejs";

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

  const existing = await orders.findOne({ paymentId: payload.razorpayPaymentId })
    ?? await orders.findOne({ razorpayOrderId: payload.razorpayOrderId });

  if (existing) {
    await orders.updateMany(
      { razorpayOrderId: payload.razorpayOrderId },
      {
        $set: {
          paymentMethod: "razorpay",
          paymentId: payload.razorpayPaymentId,
          transactionId: payload.razorpayPaymentId,
          transactionStatus: "success",
          shippingProviderStatus: "pending-shipment",
        },
      },
    );

    if (existing.promoCode) {
      await incrementCouponUsage(existing.promoCode).catch(() => undefined);
    }

    const shouldTriggerShipment = process.env.DELHIVERY_TRIGGER_ON_VERIFY === "true";
    if (shouldTriggerShipment && isDelhiveryConfigured() && existing.orderRef) {
      await createShipmentForOrderRef(existing.orderRef).catch(() => undefined);
    }

    const identity = await resolveRequestIdentity(request);
    const userId = identity?.userId;
    if (userId) {
      await setUserCart(userId, []);
    }

    const targetUserId = existing.customerUserId ?? userId;
    if (targetUserId && existing.orderRef) {
      await publishOrderSnapshot(targetUserId, existing.orderRef, {
        status: existing.status,
        paymentStatus: "success",
        shippingStatus: "pending-shipment",
        timeline: [
          {
            status: "payment-success",
            timestamp: new Date().toISOString(),
            note: "Payment verified successfully.",
          },
        ],
      }).catch(() => undefined);

      await publishUserNotification(targetUserId, {
        id: `pay-${payload.razorpayPaymentId}`,
        type: "payment",
        title: "Payment confirmed",
        message: `Payment received for order ${existing.orderRef}.`,
        orderRef: existing.orderRef,
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: existing.orderRef ?? existing.id,
        paymentId: payload.razorpayPaymentId,
      },
    });
  }

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "ORDER_NOT_FOUND",
        message: "No order found for this Razorpay order. Retry checkout to regenerate payment order.",
      },
    },
    { status: 404 },
  );
}
