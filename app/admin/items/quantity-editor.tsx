"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  itemId: string;
  minOrderQty?: number;
  maxOrderQty?: number;
};

export function QuantityEditor({ itemId, minOrderQty = 1, maxOrderQty = 10 }: Props) {
  const [minQty, setMinQty] = useState(String(minOrderQty));
  const [maxQty, setMaxQty] = useState(String(maxOrderQty));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const save = async () => {
    setMessage(null);
    const minValue = Number(minQty);
    const maxValue = Number(maxQty);

    if (!Number.isFinite(minValue) || !Number.isFinite(maxValue)) {
      setMessage("Enter valid numbers.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch(`/api/admin/items/${itemId}/quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minOrderQty: minValue,
          maxOrderQty: maxValue,
        }),
      });

      const payload = (await response.json()) as {
        success?: boolean;
        data?: { minOrderQty: number; maxOrderQty: number };
        error?: { message?: string };
      };

      if (!response.ok || !payload.success || !payload.data) {
        setMessage(payload.error?.message ?? "Unable to save quantity limits.");
        return;
      }

      setMinQty(String(payload.data.minOrderQty));
      setMaxQty(String(payload.data.maxOrderQty));
      setMessage("Saved");
    } catch {
      setMessage("Unable to save quantity limits.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        min={1}
        value={minQty}
        onChange={(event) => setMinQty(event.target.value)}
        className="h-9 w-20"
        aria-label="Min quantity"
      />
      <Input
        type="number"
        min={0}
        value={maxQty}
        onChange={(event) => setMaxQty(event.target.value)}
        className="h-9 w-20"
        aria-label="Max quantity"
      />
      <Button type="button" size="sm" variant="outline" onClick={save} disabled={saving}>
        {saving ? "Saving..." : "Save"}
      </Button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
