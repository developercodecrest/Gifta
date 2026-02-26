"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type UserNotification = {
  id: string;
  type: "order-update" | "payment";
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  orderRef?: string;
};

type NotificationsPayload = {
  notifications: UserNotification[];
  unreadCount: number;
};

export default function NotificationsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<NotificationsPayload>({ notifications: [], unreadCount: 0 });

  const loadNotifications = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", { method: "GET" });
      const json = (await response.json()) as {
        success?: boolean;
        data?: NotificationsPayload;
        error?: { message?: string };
      };

      if (!response.ok || !json.success || !json.data) {
        setError(json.error?.message ?? "Unable to load notifications.");
        return;
      }

      setPayload(json.data);
    } catch {
      setError("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
      const json = (await response.json()) as {
        success?: boolean;
        data?: NotificationsPayload;
      };
      if (response.ok && json.success && json.data) {
        setPayload(json.data);
      }
    } catch {
      return;
    }
  };

  const markOneRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [notificationId] }),
      });
      const json = (await response.json()) as {
        success?: boolean;
        data?: NotificationsPayload;
      };
      if (response.ok && json.success && json.data) {
        setPayload(json.data);
      }
    } catch {
      return;
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Badge variant="secondary">Notifications</Badge>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">Updates</h1>
            <p className="mt-2 text-sm text-muted-foreground">Track your order and payment updates in one place.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={payload.unreadCount > 0 ? "warning" : "secondary"}>{payload.unreadCount} unread</Badge>
            <Button type="button" variant="outline" size="sm" onClick={markAllRead} disabled={!payload.unreadCount || isLoading}>
              Mark all read
            </Button>
          </div>
        </div>
      </header>

      {isLoading ? <p className="text-sm text-muted-foreground">Loading notifications...</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {!isLoading && !error && payload.notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : null}

      {!isLoading && !error && payload.notifications.length > 0 ? (
        <div className="space-y-3">
          {payload.notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? "opacity-75" : ""}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold">{notification.title}</h2>
                  <div className="flex items-center gap-2">
                    {!notification.isRead ? <Badge variant="warning">Unread</Badge> : <Badge variant="secondary">Read</Badge>}
                    <Badge variant={notification.type === "payment" ? "success" : "secondary"}>
                      {notification.type === "payment" ? "Payment" : "Order"}
                    </Badge>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{notification.message}</p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                  <span>{formatDate(notification.createdAt)}</span>
                  <div className="flex items-center gap-2">
                    {!notification.isRead ? (
                      <Button type="button" size="sm" variant="outline" onClick={() => markOneRead(notification.id)}>
                        Mark read
                      </Button>
                    ) : null}
                    {notification.orderRef ? (
                      <Button asChild size="sm" variant="outline" onClick={() => markOneRead(notification.id)}>
                        <Link href={`/orders/${notification.orderRef}`}>View order</Link>
                      </Button>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <Button asChild variant="outline">
        <Link href="/account">Back to account</Link>
      </Button>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
