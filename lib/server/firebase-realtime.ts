import { type CartItem } from "@/types/ecommerce";
import { getFirebaseAdminDatabase, getFirebaseAdminMessaging } from "@/lib/server/firebase-admin";
import { getUserDevicePushTokens, removeUserDevicePushTokens } from "@/lib/server/user-device-token-service";

type CartSnapshot = {
  items: CartItem[];
  itemCount: number;
  updatedAt: string;
};

type WishlistSnapshot = {
  productIds: string[];
  itemCount: number;
  updatedAt: string;
};

type OrderSnapshot = {
  orderRef: string;
  status: string;
  paymentStatus?: string;
  shippingStatus?: string;
  updatedAt: string;
  timeline?: Array<{
    status: string;
    timestamp: string;
    note?: string;
  }>;
};

type NotificationSnapshot = {
  id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  orderRef?: string;
};

function nowIso() {
  return new Date().toISOString();
}

export async function publishCartSnapshot(userId: string, items: CartItem[]) {
  const db = getFirebaseAdminDatabase();
  if (!db) {
    return false;
  }

  const payload: CartSnapshot = {
    items,
    itemCount: items.reduce((sum, item) => sum + Math.max(0, item.quantity ?? 0), 0),
    updatedAt: nowIso(),
  };

  try {
    await db.ref(`user-carts/${userId}`).set(payload);
    return true;
  } catch (error) {
    console.warn("publishCartSnapshot failed", {
      userId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}

export async function publishWishlistSnapshot(userId: string, productIds: string[]) {
  const db = getFirebaseAdminDatabase();
  if (!db) {
    return false;
  }

  const dedupedIds = Array.from(
    new Set(
      productIds
        .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
        .filter((entry) => Boolean(entry)),
    ),
  );

  const payload: WishlistSnapshot = {
    productIds: dedupedIds,
    itemCount: dedupedIds.length,
    updatedAt: nowIso(),
  };

  try {
    await db.ref(`user-wishlists/${userId}`).set(payload);
    return true;
  } catch (error) {
    console.warn("publishWishlistSnapshot failed", {
      userId,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}

export async function publishOrderSnapshot(userId: string, orderRef: string, input: Omit<OrderSnapshot, "updatedAt" | "orderRef">) {
  const db = getFirebaseAdminDatabase();
  if (!db) {
    return false;
  }

  const payload: OrderSnapshot = {
    orderRef,
    updatedAt: nowIso(),
    ...input,
  };

  try {
    await db.ref(`user-orders/${userId}/${orderRef}`).update(payload);
    return true;
  } catch (error) {
    console.warn("publishOrderSnapshot failed", {
      userId,
      orderRef,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}

export async function publishUserNotification(userId: string, input: Omit<NotificationSnapshot, "createdAt">) {
  const db = getFirebaseAdminDatabase();

  const payload: NotificationSnapshot = {
    ...input,
    createdAt: nowIso(),
  };

  let realtimeOk = false;

  try {
    if (db) {
      await db.ref(`user-notifications/${userId}/${input.id}`).set(payload);
      realtimeOk = true;
    }
  } catch (error) {
    console.warn("publishUserNotification failed", {
      userId,
      notificationId: input.id,
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  const pushOk = await sendUserPushNotification(userId, payload);
  return realtimeOk || pushOk;
}

async function sendUserPushNotification(userId: string, notification: NotificationSnapshot) {
  const messaging = getFirebaseAdminMessaging();
  if (!messaging) {
    return false;
  }

  const tokens = await getUserDevicePushTokens(userId);
  if (!tokens.length) {
    return false;
  }

  try {
    const result = await messaging.sendEachForMulticast({
      tokens,
      notification: {
        title: notification.title,
        body: notification.message,
      },
      data: {
        type: notification.type,
        notificationId: notification.id,
        ...(notification.orderRef ? { orderRef: notification.orderRef } : {}),
      },
    });

    const invalidTokens: string[] = [];
    result.responses.forEach((entry, index) => {
      if (entry.success) {
        return;
      }

      const code = entry.error?.code;
      if (code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token") {
        const invalidToken = tokens[index];
        if (invalidToken) {
          invalidTokens.push(invalidToken);
        }
      }
    });

    if (invalidTokens.length) {
      await removeUserDevicePushTokens(userId, invalidTokens);
    }

    return result.successCount > 0;
  } catch (error) {
    console.warn("sendUserPushNotification failed", {
      userId,
      notificationId: notification.id,
      message: error instanceof Error ? error.message : "unknown error",
    });
    return false;
  }
}
