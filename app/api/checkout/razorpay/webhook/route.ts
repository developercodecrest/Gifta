import crypto from "crypto";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { createShipmentForOrderRef, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { publishOrderSnapshot, publishUserNotification } from "@/lib/server/firebase-realtime";
import { AdminOrderDto } from "@/types/api";

export const runtime = "nodejs";

type RazorpayWebhookPayload = {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        status?: string;
      };
    };
    order?: {
      entity?: {
        id?: string;
        status?: string;
      };
    };
    refund?: {
      entity?: {
        id?: string;
        payment_id?: string;
        status?: string;
      };
    };
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return serverError("Razorpay webhook is not configured.", { code: "RAZORPAY_WEBHOOK_CONFIG_MISSING" });
  }

  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return badRequest("Missing Razorpay webhook signature header.");
  }

  const rawBody = await request.text();
  const expectedSignature = crypto.createHmac("sha256", webhookSecret).update(rawBody).digest("hex");

  const provided = Buffer.from(signature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return badRequest("Invalid Razorpay webhook signature.");
  }

  try {
    const payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
    const db = await getMongoDb();
    const orders = db.collection<AdminOrderDto>("orders");

    const event = payload.event ?? "unknown";
    const paymentId = payload.payload?.payment?.entity?.id;
    const razorpayOrderId = payload.payload?.payment?.entity?.order_id ?? payload.payload?.order?.entity?.id;

    let matchedCount = 0;
    let modifiedCount = 0;
    const realtimeUpdates = new Map<string, {
      userId: string;
      orderRef: string;
      status: AdminOrderDto["status"];
      paymentStatus?: string;
      shippingStatus?: string;
      event: string;
    }>();

    if (event === "payment.captured" || event === "order.paid") {
      if (razorpayOrderId) {
        const matchedOrders = await orders.find({ razorpayOrderId }).project({ orderRef: 1, customerUserId: 1, status: 1 }).toArray();
        const updateResult = await orders.updateMany(
          { razorpayOrderId },
          {
            $set: {
              paymentMethod: "razorpay",
              ...(paymentId ? { paymentId } : {}),
              ...(paymentId ? { transactionId: paymentId } : {}),
              transactionStatus: "success",
              shippingProviderStatus: "pending-shipment",
              status: "placed",
            },
          },
        );
        matchedCount += updateResult.matchedCount;
        modifiedCount += updateResult.modifiedCount;

        if (isDelhiveryConfigured()) {
          const refs = Array.from(new Set(matchedOrders.map((entry) => entry.orderRef).filter((value): value is string => Boolean(value))));
          for (const ref of refs) {
            await createShipmentForOrderRef(ref).catch(() => undefined);
          }
        }

        for (const entry of matchedOrders) {
          if (!entry.customerUserId || !entry.orderRef) {
            continue;
          }
          const key = `${entry.customerUserId}:${entry.orderRef}`;
          realtimeUpdates.set(key, {
            userId: entry.customerUserId,
            orderRef: entry.orderRef,
            status: entry.status,
            paymentStatus: "success",
            shippingStatus: "pending-shipment",
            event,
          });
        }
      }
    } else if (event === "payment.failed") {
      if (razorpayOrderId) {
        const matchedOrders = await orders.find({ razorpayOrderId }).project({ orderRef: 1, customerUserId: 1, status: 1 }).toArray();
        const updateResult = await orders.updateMany(
          {
            razorpayOrderId,
            status: { $in: ["placed", "packed"] },
          },
          {
            $set: {
              paymentMethod: "razorpay",
              ...(paymentId ? { paymentId } : {}),
              ...(paymentId ? { transactionId: paymentId } : {}),
              transactionStatus: "failed",
              shippingProviderStatus: "payment-failed",
              status: "cancelled",
            },
          },
        );
        matchedCount += updateResult.matchedCount;
        modifiedCount += updateResult.modifiedCount;

        for (const entry of matchedOrders) {
          if (!entry.customerUserId || !entry.orderRef) {
            continue;
          }
          const key = `${entry.customerUserId}:${entry.orderRef}`;
          realtimeUpdates.set(key, {
            userId: entry.customerUserId,
            orderRef: entry.orderRef,
            status: "cancelled",
            paymentStatus: "failed",
            shippingStatus: "payment-failed",
            event,
          });
        }
      }
    } else if (event === "refund.processed" || event === "refund.created") {
      const refundPaymentId = payload.payload?.refund?.entity?.payment_id;
      if (refundPaymentId) {
        const matchedOrders = await orders
          .find({
            $or: [{ paymentId: refundPaymentId }, { transactionId: refundPaymentId }],
          })
          .project({ orderRef: 1, customerUserId: 1, status: 1 })
          .toArray();

        const updateResult = await orders.updateMany(
          {
            $or: [{ paymentId: refundPaymentId }, { transactionId: refundPaymentId }],
            status: { $ne: "delivered" },
          },
          {
            $set: {
              paymentMethod: "razorpay",
              paymentId: refundPaymentId,
              transactionId: refundPaymentId,
              transactionStatus: "refunded",
              shippingProviderStatus: "payment-refunded",
              status: "cancelled",
            },
          },
        );
        matchedCount += updateResult.matchedCount;
        modifiedCount += updateResult.modifiedCount;

        for (const entry of matchedOrders) {
          if (!entry.customerUserId || !entry.orderRef) {
            continue;
          }
          const key = `${entry.customerUserId}:${entry.orderRef}`;
          realtimeUpdates.set(key, {
            userId: entry.customerUserId,
            orderRef: entry.orderRef,
            status: "cancelled",
            paymentStatus: "refunded",
            shippingStatus: "payment-refunded",
            event,
          });
        }
      }
    }

    if (realtimeUpdates.size) {
      await Promise.all(
        Array.from(realtimeUpdates.values()).map(async (entry) => {
          await publishOrderSnapshot(entry.userId, entry.orderRef, {
            status: entry.status,
            paymentStatus: entry.paymentStatus,
            shippingStatus: entry.shippingStatus,
            timeline: [
              {
                status: entry.event,
                timestamp: new Date().toISOString(),
              },
            ],
          }).catch(() => undefined);

          const title = entry.paymentStatus === "success"
            ? "Payment confirmed"
            : entry.paymentStatus === "failed"
              ? "Payment failed"
              : "Payment refunded";
          const message = entry.paymentStatus === "success"
            ? `Payment received for order ${entry.orderRef}.`
            : entry.paymentStatus === "failed"
              ? `Payment failed for order ${entry.orderRef}.`
              : `Payment refunded for order ${entry.orderRef}.`;

          await publishUserNotification(entry.userId, {
            id: `pay-${entry.orderRef}-${entry.paymentStatus ?? "update"}`,
            type: "payment",
            title,
            message,
            orderRef: entry.orderRef,
          }).catch(() => undefined);
        }),
      );
    }

    return ok({
      received: true,
      event,
      matchedCount,
      modifiedCount,
    });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return badRequest("Invalid Razorpay webhook payload.");
    }
    return serverError("Unable to process Razorpay webhook.", error);
  }
}
