"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { getFirebaseClientApp, getFirebaseWebPushConfig } from "@/lib/client/firebase";

function canUseBrowserPush() {
  return typeof window !== "undefined" && typeof Notification !== "undefined" && "serviceWorker" in navigator;
}

function buildServiceWorkerUrl(config: NonNullable<ReturnType<typeof getFirebaseWebPushConfig>>) {
  const params = new URLSearchParams({
    apiKey: config.apiKey ?? "",
    authDomain: config.authDomain ?? "",
    projectId: config.projectId ?? "",
    storageBucket: config.storageBucket ?? "",
    messagingSenderId: config.messagingSenderId ?? "",
    appId: config.appId ?? "",
  });

  if (config.databaseURL) {
    params.set("databaseURL", config.databaseURL);
  }

  return `/firebase-messaging-sw.js?${params.toString()}`;
}

async function registerBrowserPushToken(token: string) {
  await fetch("/api/notifications/device-token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, platform: "web" }),
    credentials: "include",
  });
}

export function FirebaseBrowserNotifications() {
  const { status, data } = useSession();

  useEffect(() => {
    let disposed = false;
    let unsubscribe: (() => void) | undefined;

    if (status !== "authenticated" || !data?.user?.id || !canUseBrowserPush()) {
      return undefined;
    }

    const config = getFirebaseWebPushConfig();
    if (!config) {
      return undefined;
    }

    const bootstrap = async () => {
      const [{ getMessaging, getToken, isSupported, onMessage }] = await Promise.all([
        import("firebase/messaging"),
      ]);

      if (disposed || !(await isSupported())) {
        return;
      }

      const registration = await navigator.serviceWorker.register(buildServiceWorkerUrl(config));
      const permission = Notification.permission === "granted"
        ? "granted"
        : Notification.permission === "denied"
          ? "denied"
          : await Notification.requestPermission();

      if (disposed || permission !== "granted") {
        return;
      }

      const app = getFirebaseClientApp();
      if (!app) {
        return;
      }

      const messaging = getMessaging(app);
      const token = await getToken(messaging, {
        vapidKey: config.vapidKey,
        serviceWorkerRegistration: registration,
      });

      if (token) {
        await registerBrowserPushToken(token).catch(() => undefined);
      }

      unsubscribe = onMessage(messaging, (payload) => {
        if (Notification.permission !== "granted") {
          return;
        }

        const title = payload.notification?.title ?? "Gifta update";
        const body = payload.notification?.body ?? "You have a new notification.";
        const href = payload.data?.orderRef ? `/orders/${payload.data.orderRef}` : "/notifications";
        const notification = new Notification(title, {
          body,
          data: { href },
        });

        notification.onclick = () => {
          window.focus();
          window.location.href = href;
          notification.close();
        };
      });
    };

    void bootstrap().catch(() => undefined);

    return () => {
      disposed = true;
      unsubscribe?.();
    };
  }, [data?.user?.id, status]);

  return null;
}
