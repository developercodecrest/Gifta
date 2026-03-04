"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

type Props = {
  storeId: string;
  defaultName: string;
  defaultRating: number;
  defaultActive: boolean;
};

export function VendorActions({ storeId, defaultName, defaultRating, defaultActive }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [rating, setRating] = useState(String(defaultRating));
  const [active, setActive] = useState(defaultActive);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rating: Number(rating) || 0,
          active,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update store");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update store");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this store? This also removes linked offers/orders.")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/stores/${storeId}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete store");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to delete store");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 space-y-2 border-t border-border pt-3">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Store name" />
        <Input value={rating} onChange={(event) => setRating(event.target.value)} placeholder="Rating" inputMode="decimal" />
        <label className="flex items-center gap-2 rounded-md border border-border px-3 text-sm">
          <Checkbox checked={active} onCheckedChange={(value) => setActive(Boolean(value))} /> Active
        </label>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={saving}>Delete</Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
