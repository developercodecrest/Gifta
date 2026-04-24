"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { onValue, ref } from "firebase/database";
import { getFirebaseClientDatabase } from "@/lib/client/firebase";

type OrderRealtimeRefreshProps = {
  orderRef?: string;
};

export function OrderRealtimeRefresh({ orderRef }: OrderRealtimeRefreshProps) {
  const router = useRouter();
  const { status, data } = useSession();
  const firstSnapshotRef = useRef(true);

  useEffect(() => {
    if (status !== "authenticated" || !data?.user?.id) {
      return undefined;
    }

    const database = getFirebaseClientDatabase();
    if (!database) {
      return undefined;
    }

    const targetPath = orderRef
      ? `user-orders/${data.user.id}/${orderRef}`
      : `user-orders/${data.user.id}`;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = onValue(ref(database, targetPath), () => {
      if (firstSnapshotRef.current) {
        firstSnapshotRef.current = false;
        return;
      }

      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }

      refreshTimer = setTimeout(() => {
        router.refresh();
      }, 150);
    });

    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer);
      }
      unsubscribe();
    };
  }, [data?.user?.id, orderRef, router, status]);

  return null;
}
