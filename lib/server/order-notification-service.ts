import { ObjectId } from "mongodb";
import { getMongoDb } from "@/lib/mongodb";
import { parseRole } from "@/lib/roles";
import { publishOrderSnapshot, publishUserNotification } from "@/lib/server/firebase-realtime";
import { getTransporter } from "@/lib/server/otp-service";
import { AdminOrderDto } from "@/types/api";

type AuthUserDoc = {
  _id?: ObjectId;
  email?: string;
  fullName?: string;
  role?: string;
};

type StoreDoc = {
  _id?: ObjectId;
  id: string;
  name: string;
  ownerUserId?: string;
  details?: {
    owner?: {
      fullName?: string;
      email?: string;
    };
  };
};

type OrderDoc = AdminOrderDto & {
  _id?: ObjectId;
  customerUserObjectId?: ObjectId;
};

type OrderNotificationEventDoc = {
  _id?: ObjectId;
  key: string;
  orderRef: string;
  eventType: string;
  timelineStatus: string;
  status: AdminOrderDto["status"];
  paymentStatus?: string;
  shippingStatus?: string;
  title: string;
  message: string;
  note?: string;
  createdAt: string;
};

type SyncOrderLifecycleEventInput = {
  orderRef: string;
  eventType: string;
  timelineStatus?: string;
  status: AdminOrderDto["status"];
  paymentStatus?: string;
  shippingStatus?: string;
  timestamp?: string;
  note?: string;
  notificationType?: "order-update" | "payment";
  title?: string;
  message?: string;
  adminTitle?: string;
  adminMessage?: string;
  notifyCustomer?: boolean;
  notifyStoreOwners?: boolean;
  notifyAdmins?: boolean;
  silent?: boolean;
};

type Recipient = {
  userId?: string;
  email: string;
  fullName: string;
};

type OrderSummary = {
  orderRef: string;
  customerUserId?: string;
  customerName?: string;
  customerEmail?: string;
  totalAmount: number;
  itemCount: number;
  storeRecipients: Recipient[];
};

type NotificationTemplate = {
  notificationType: "order-update" | "payment";
  customerTitle: string;
  customerMessage: string;
  adminTitle: string;
  adminMessage: string;
};

let indexesReadyPromise: Promise<void> | null = null;

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

async function ensureIndexes() {
  if (!indexesReadyPromise) {
    indexesReadyPromise = (async () => {
      const db = await getMongoDb();
      const events = db.collection<OrderNotificationEventDoc>("order_notification_events");
      await events.createIndex({ key: 1 }, { unique: true });
      await events.createIndex({ orderRef: 1, createdAt: 1 });
    })();
  }

  await indexesReadyPromise;
}

async function getCollections() {
  const db = await getMongoDb();
  return {
    events: db.collection<OrderNotificationEventDoc>("order_notification_events"),
    orders: db.collection<OrderDoc>("orders"),
    users: db.collection<AuthUserDoc>("users"),
    stores: db.collection<StoreDoc>("stores"),
  };
}

async function loadOrderSummary(orderRef: string) {
  const { orders, users, stores } = await getCollections();
  const orderRows = await orders.find({ orderRef }).sort({ createdAt: 1 }).toArray();
  if (!orderRows.length) {
    return null;
  }

  const primaryOrder = orderRows[0];
  const userObjectId = primaryOrder?.customerUserId && ObjectId.isValid(primaryOrder.customerUserId)
    ? new ObjectId(primaryOrder.customerUserId)
    : null;
  const customerUser = userObjectId ? await users.findOne({ _id: userObjectId }) : null;
  const storeIds = Array.from(new Set(orderRows.map((row) => row.storeId?.trim()).filter((value): value is string => Boolean(value))));
  const storeDocs = storeIds.length
    ? await stores.find({ id: { $in: storeIds } }, { projection: { id: 1, name: 1, ownerUserId: 1, details: 1 } }).toArray()
    : [];
  const ownerUserIds = storeDocs
    .map((store) => store.ownerUserId?.trim())
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .filter((value) => ObjectId.isValid(value));
  const ownerObjectIds = Array.from(new Set(ownerUserIds.map((value) => new ObjectId(value).toHexString())))
    .map((value) => new ObjectId(value));
  const ownerUsers = ownerObjectIds.length
    ? await users.find({ _id: { $in: ownerObjectIds } }, { projection: { email: 1, fullName: 1 } }).toArray()
    : [];
  const ownerUsersById = new Map(ownerUsers.map((entry) => [entry._id?.toHexString(), entry]));
  const storeRecipients = Array.from(
    new Map(
      storeDocs.flatMap((store) => {
        const ownerUserId = store.ownerUserId?.trim();
        const ownerUser = ownerUserId ? ownerUsersById.get(ownerUserId) : null;
        const email = ownerUser?.email?.trim().toLowerCase() || store.details?.owner?.email?.trim().toLowerCase() || "";

        if (!email) {
          return [];
        }

        const fullName = ownerUser?.fullName?.trim() || store.details?.owner?.fullName?.trim() || `${store.name} Owner`;
        return [[email, {
          userId: ownerUser?._id?.toHexString(),
          email,
          fullName,
        } satisfies Recipient]];
      }),
    ).values(),
  );

  return {
    orderRef,
    customerUserId: primaryOrder.customerUserId,
    customerName: primaryOrder.customerName ?? customerUser?.fullName,
    customerEmail: primaryOrder.customerEmail ?? customerUser?.email,
    totalAmount: orderRows.reduce((sum, row) => sum + (Number.isFinite(row.totalAmount) ? row.totalAmount : 0), 0),
    itemCount: orderRows.reduce((sum, row) => sum + Math.max(0, row.quantity ?? 0), 0),
    storeRecipients,
  } satisfies OrderSummary;
}

async function getAdminRecipients() {
  const { users } = await getCollections();
  const docs = await users.find({ role: { $exists: true } }, { projection: { email: 1, fullName: 1, role: 1 } }).toArray();
  return docs
    .filter((entry) => parseRole(entry.role) === "SADMIN")
    .map((entry) => ({
      userId: entry._id?.toHexString(),
      email: entry.email?.trim().toLowerCase() ?? "",
      fullName: entry.fullName?.trim() || "Gifta Admin",
    }))
    .filter((entry) => Boolean(entry.email));
}

function getDefaultTemplate(input: {
  eventType: string;
  orderRef: string;
  summary: OrderSummary;
}): NotificationTemplate {
  const eventType = input.eventType.trim().toLowerCase();
  const customerName = input.summary.customerName?.trim() || "Customer";
  const orderValue = `Rs ${Math.round(input.summary.totalAmount)}`;

  switch (eventType) {
    case "order-placed":
      return {
        notificationType: "order-update",
        customerTitle: "Order placed",
        customerMessage: `Your order ${input.orderRef} has been placed successfully.`,
        adminTitle: "New order received",
        adminMessage: `New order ${input.orderRef} was placed by ${customerName} for ${orderValue}.`,
      };
    case "payment-success":
      return {
        notificationType: "payment",
        customerTitle: "Payment confirmed",
        customerMessage: `Payment received for order ${input.orderRef}.`,
        adminTitle: "Payment received",
        adminMessage: `Payment was captured for order ${input.orderRef} placed by ${customerName}.`,
      };
    case "payment-failed":
      return {
        notificationType: "payment",
        customerTitle: "Payment failed",
        customerMessage: `Payment failed for order ${input.orderRef}.`,
        adminTitle: "Payment failed",
        adminMessage: `Payment failed for order ${input.orderRef} placed by ${customerName}.`,
      };
    case "payment-refunded":
      return {
        notificationType: "payment",
        customerTitle: "Payment refunded",
        customerMessage: `Payment refunded for order ${input.orderRef}.`,
        adminTitle: "Payment refunded",
        adminMessage: `Payment was refunded for order ${input.orderRef}.`,
      };
    case "order-packed":
      return {
        notificationType: "order-update",
        customerTitle: "Order packed",
        customerMessage: `Your order ${input.orderRef} is packed and ready for dispatch.`,
        adminTitle: "Order packed",
        adminMessage: `Order ${input.orderRef} is now packed.`,
      };
    case "order-out-for-delivery":
      return {
        notificationType: "order-update",
        customerTitle: "Out for delivery",
        customerMessage: `Your order ${input.orderRef} is out for delivery.`,
        adminTitle: "Order out for delivery",
        adminMessage: `Order ${input.orderRef} is out for delivery.`,
      };
    case "order-delivered":
      return {
        notificationType: "order-update",
        customerTitle: "Order delivered",
        customerMessage: `Your order ${input.orderRef} has been delivered.`,
        adminTitle: "Order delivered",
        adminMessage: `Order ${input.orderRef} has been delivered.`,
      };
    case "order-cancelled":
      return {
        notificationType: "order-update",
        customerTitle: "Order cancelled",
        customerMessage: `Your order ${input.orderRef} was cancelled.`,
        adminTitle: "Order cancelled",
        adminMessage: `Order ${input.orderRef} was cancelled.`,
      };
    default:
      return {
        notificationType: "order-update",
        customerTitle: "Order update",
        customerMessage: `A new update is available for order ${input.orderRef}.`,
        adminTitle: "Order update",
        adminMessage: `Order ${input.orderRef} has a new update.`,
      };
  }
}

async function loadTimeline(orderRef: string) {
  const { events } = await getCollections();
  const docs = await events.find({ orderRef }).sort({ createdAt: 1 }).toArray();
  return docs.map((entry) => ({
    status: entry.timelineStatus,
    timestamp: entry.createdAt,
    ...(entry.note ? { note: entry.note } : {}),
  }));
}

async function sendLifecycleEmails(input: {
  summary: OrderSummary;
  customerTitle: string;
  customerMessage: string;
  adminTitle: string;
  adminMessage: string;
  notifyCustomer: boolean;
  notifyStoreOwners: boolean;
  notifyAdmins: boolean;
}) {
  const from = process.env.EMAIL_FROM?.trim();
  if (!from) {
    return;
  }

  const transporter = getTransporter();
  const adminRecipients = await getAdminRecipients();
  const customerEmail = input.summary.customerEmail?.trim().toLowerCase();

  const jobs: Array<Promise<unknown>> = [];

  if (input.notifyCustomer && customerEmail && !customerEmail.endsWith("@gifta.local")) {
    jobs.push(
      transporter.sendMail({
        from,
        to: customerEmail,
        subject: `[Gifta] ${input.customerTitle}`,
        text: `${input.customerMessage}\n\nOrder Ref: ${input.summary.orderRef}`,
        html: `<p>${input.customerMessage}</p><p><strong>Order Ref:</strong> ${input.summary.orderRef}</p>`,
      }),
    );
  }

  if (input.notifyStoreOwners) {
    for (const recipient of input.summary.storeRecipients) {
      if (recipient.email.endsWith("@gifta.local")) {
        continue;
      }

      jobs.push(
        transporter.sendMail({
          from,
          to: recipient.email,
          subject: `[Gifta Store] ${input.adminTitle}`,
          text: `${input.adminMessage}\n\nOrder Ref: ${input.summary.orderRef}`,
          html: `<p>${input.adminMessage}</p><p><strong>Order Ref:</strong> ${input.summary.orderRef}</p>`,
        }),
      );
    }
  }

  if (input.notifyAdmins) {
    for (const recipient of adminRecipients) {
      jobs.push(
        transporter.sendMail({
          from,
          to: recipient.email,
          subject: `[Gifta Admin] ${input.adminTitle}`,
          text: `${input.adminMessage}\n\nOrder Ref: ${input.summary.orderRef}`,
          html: `<p>${input.adminMessage}</p><p><strong>Order Ref:</strong> ${input.summary.orderRef}</p>`,
        }),
      );
    }
  }

  if (jobs.length) {
    await Promise.allSettled(jobs);
  }
}

async function publishLifecyclePushNotifications(input: {
  summary: OrderSummary;
  notificationType: "order-update" | "payment";
  customerTitle: string;
  customerMessage: string;
  adminTitle: string;
  adminMessage: string;
  eventType: string;
  notifyCustomer: boolean;
  notifyStoreOwners: boolean;
  notifyAdmins: boolean;
}) {
  const notificationId = `${input.notificationType === "payment" ? "pay" : "ord"}-${input.summary.orderRef}-${toSlug(input.eventType)}`;

  if (input.notifyCustomer && input.summary.customerUserId) {
    await publishUserNotification(input.summary.customerUserId, {
      id: notificationId,
      type: input.notificationType,
      title: input.customerTitle,
      message: input.customerMessage,
      orderRef: input.summary.orderRef,
    }).catch(() => undefined);
  }

  if (input.notifyStoreOwners) {
    await Promise.all(
      input.summary.storeRecipients.map(async (recipient) => {
        if (!recipient.userId) {
          return;
        }

        await publishUserNotification(recipient.userId, {
          id: notificationId,
          type: input.notificationType,
          title: input.adminTitle,
          message: input.adminMessage,
          orderRef: input.summary.orderRef,
        }).catch(() => undefined);
      }),
    );
  }

  if (input.notifyAdmins) {
    const adminRecipients = await getAdminRecipients();
    await Promise.all(
      adminRecipients.map(async (recipient) => {
        if (!recipient.userId) {
          return;
        }

        await publishUserNotification(recipient.userId, {
          id: notificationId,
          type: input.notificationType,
          title: input.adminTitle,
          message: input.adminMessage,
          orderRef: input.summary.orderRef,
        }).catch(() => undefined);
      }),
    );
  }
}

export async function syncOrderLifecycleEvent(input: SyncOrderLifecycleEventInput) {
  await ensureIndexes();

  const timestamp = input.timestamp?.trim() || new Date().toISOString();
  const summary = await loadOrderSummary(input.orderRef);
  if (!summary) {
    return { eventInserted: false, orderRef: input.orderRef, reason: "ORDER_NOT_FOUND" as const };
  }

  const defaults = getDefaultTemplate({
    eventType: input.eventType,
    orderRef: input.orderRef,
    summary,
  });

  const title = input.title?.trim() || defaults.customerTitle;
  const message = input.message?.trim() || defaults.customerMessage;
  const adminTitle = input.adminTitle?.trim() || defaults.adminTitle;
  const adminMessage = input.adminMessage?.trim() || defaults.adminMessage;
  const notificationType = input.notificationType ?? defaults.notificationType;
  const defaultStoreOwnerNotification = /^(order|shipping)-/i.test(input.eventType.trim());
  const notifyCustomer = input.notifyCustomer ?? true;
  const notifyStoreOwners = input.notifyStoreOwners ?? defaultStoreOwnerNotification;
  const notifyAdmins = input.notifyAdmins ?? true;
  const eventKey = `${input.orderRef}:${toSlug(input.eventType)}`;

  const { events } = await getCollections();
  const insertResult = await events.updateOne(
    { key: eventKey },
    {
      $setOnInsert: {
        key: eventKey,
        orderRef: input.orderRef,
        eventType: input.eventType,
        timelineStatus: input.timelineStatus?.trim() || input.status,
        status: input.status,
        ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
        ...(input.shippingStatus ? { shippingStatus: input.shippingStatus } : {}),
        title,
        message,
        ...(input.note ? { note: input.note } : {}),
        createdAt: timestamp,
      } satisfies OrderNotificationEventDoc,
    },
    { upsert: true },
  );

  const timeline = await loadTimeline(input.orderRef);

  if (summary.customerUserId) {
    await publishOrderSnapshot(summary.customerUserId, input.orderRef, {
      status: input.status,
      ...(input.paymentStatus ? { paymentStatus: input.paymentStatus } : {}),
      ...(input.shippingStatus ? { shippingStatus: input.shippingStatus } : {}),
      timeline,
    }).catch(() => undefined);
  }

  const eventInserted = Boolean(insertResult.upsertedCount);
  if (!eventInserted || input.silent) {
    return {
      eventInserted,
      orderRef: input.orderRef,
      reason: eventInserted ? (input.silent ? "SILENT" : "OK") : "DUPLICATE",
    } as const;
  }

  await sendLifecycleEmails({
    summary,
    customerTitle: title,
    customerMessage: message,
    adminTitle,
    adminMessage,
    notifyCustomer,
    notifyStoreOwners,
    notifyAdmins,
  }).catch(() => undefined);

  await publishLifecyclePushNotifications({
    summary,
    notificationType,
    customerTitle: title,
    customerMessage: message,
    adminTitle,
    adminMessage,
    eventType: input.eventType,
    notifyCustomer,
    notifyStoreOwners,
    notifyAdmins,
  }).catch(() => undefined);

  return { eventInserted: true, orderRef: input.orderRef, reason: "OK" as const };
}
