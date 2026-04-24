import crypto from "crypto";
import { NextResponse } from "next/server";
import { getMongoDb } from "@/lib/mongodb";
import { incrementCouponUsage } from "@/lib/server/coupon-service";
import { createShipmentForOrderRef, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { syncOrderLifecycleEvent } from "@/lib/server/order-notification-service";
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
    const updateResult = await orders.updateMany(
      {
        razorpayOrderId: payload.razorpayOrderId,
        transactionStatus: { $ne: "success" },
      },
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

    if (existing.promoCode && updateResult.modifiedCount > 0) {
      await incrementCouponUsage(existing.promoCode).catch(() => undefined);
    }

    let shippingStatus = existing.shippingProviderStatus ?? "pending-shipment";
    const shouldTriggerShipment = process.env.DELHIVERY_TRIGGER_ON_VERIFY === "true";
    if (shouldTriggerShipment && isDelhiveryConfigured() && existing.orderRef) {
      const shipmentResult = await createShipmentForOrderRef(existing.orderRef).catch(() => undefined);
      if (shipmentResult?.createdStores) {
        shippingStatus = "shipment-created";
      }
    }

    const identity = await resolveRequestIdentity(request);
    const userId = identity?.userId;
    if (userId) {
      await setUserCart(userId, []);
    }

    const currentOrder = existing.orderRef
      ? await orders.findOne({ orderRef: existing.orderRef }, { projection: { orderRef: 1, status: 1, shippingProviderStatus: 1 } })
      : null;

    if (existing.orderRef) {
      await syncOrderLifecycleEvent({
        orderRef: existing.orderRef,
        eventType: "payment-success",
        timelineStatus: "payment-success",
        status: currentOrder?.status ?? existing.status,
        paymentStatus: "success",
        shippingStatus: currentOrder?.shippingProviderStatus ?? shippingStatus,
        note: "Payment verified successfully.",
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
