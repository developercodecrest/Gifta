"use client";

import { useEffect } from "react";
import { useRecentStore } from "@/features/recent/store";

export function TrackRecent({ productId }: { productId: string }) {
  const push = useRecentStore((state) => state.push);

  useEffect(() => {
    push(productId);
  }, [productId, push]);

  return null;
}
