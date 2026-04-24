import crypto from "crypto";
import { badRequest, ok, serverError } from "@/lib/api-response";
import { getMongoDb } from "@/lib/mongodb";
import { createShipmentForOrderRef, isDelhiveryConfigured } from "@/lib/server/delhivery-service";
import { syncOrderLifecycleEvent } from "@/lib/server/order-notification-service";
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
    const touchedOrderRefs = new Set<string>();

    if (event === "payment.captured" || event === "order.paid") {
      if (razorpayOrderId) {
        const matchedOrders = await orders.find({ razorpayOrderId }).project({ orderRef: 1, customerUserId: 1, status: 1 }).toArray();
        const updateResult = await orders.updateMany(
          {
            razorpayOrderId,
            transactionStatus: { $ne: "success" },
          },
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
            touchedOrderRefs.add(ref);
            await createShipmentForOrderRef(ref).catch(() => undefined);
          }
        }

        for (const entry of matchedOrders) {
          if (!entry.orderRef) {
            continue;
          }
          touchedOrderRefs.add(entry.orderRef);
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
          if (!entry.orderRef) {
            continue;
          }
          touchedOrderRefs.add(entry.orderRef);
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
          if (!entry.orderRef) {
            continue;
          }
          touchedOrderRefs.add(entry.orderRef);
        }
      }
    }

    if (touchedOrderRefs.size) {
      await Promise.all(
        Array.from(touchedOrderRefs.values()).map(async (orderRef) => {
          const current = await orders.findOne(
            { orderRef },
            { projection: { orderRef: 1, status: 1, transactionStatus: 1, shippingProviderStatus: 1 } },
          );

          if (!current?.orderRef) {
            return;
          }

          const paymentStatus = current.transactionStatus;
          const eventType = paymentStatus === "success"
            ? "payment-success"
            : paymentStatus === "failed"
              ? "payment-failed"
              : paymentStatus === "refunded"
                ? "payment-refunded"
                : "payment-update";

          await syncOrderLifecycleEvent({
            orderRef: current.orderRef,
            eventType,
            timelineStatus: eventType,
            status: current.status,
            paymentStatus,
            shippingStatus: current.shippingProviderStatus,
            note: event,
            ...(paymentStatus === "success"
              ? {}
              : paymentStatus === "failed"
                ? {
                    title: `Payment failed for order ${current.orderRef}.`,
                    message: `Payment failed for order ${current.orderRef}.`,
                  }
                : paymentStatus === "refunded"
                  ? {
                      title: `Payment refunded for order ${current.orderRef}.`,
                      message: `Payment refunded for order ${current.orderRef}.`,
                    }
                  : {}),
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
