"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  orderId: string;
  defaultStatus: "placed" | "packed" | "out-for-delivery" | "delivered" | "cancelled";
};

const statuses: Props["defaultStatus"][] = ["placed", "packed", "out-for-delivery", "delivered", "cancelled"];

export function OrderActions({ orderId, defaultStatus }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Props["defaultStatus"]>(defaultStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update order");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to update order");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this order row?")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete order");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to delete order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <select
        value={status}
        onChange={(event) => setStatus(event.target.value as Props["defaultStatus"])}
        className="h-9 rounded-md border border-border bg-background px-2 text-sm"
      >
        {statuses.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
      <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={saving}>Delete</Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
