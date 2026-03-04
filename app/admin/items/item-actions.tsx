"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  itemId: string;
  defaultName: string;
  defaultCategory: string;
  defaultPrice?: number;
};

export function ItemActions({ itemId, defaultName, defaultCategory, defaultPrice }: Props) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [category, setCategory] = useState(defaultCategory);
  const [price, setPrice] = useState(String(defaultPrice ?? 0));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          price: Number(price) || 0,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update item");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to update item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this item and linked offers/orders/reviews?")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/items/${itemId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete item");
        return;
      }

      router.refresh();
    } catch {
      setError("Unable to delete item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
        <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Price" />
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={saving}>Delete</Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

export function ItemCreateForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Birthday");
  const [price, setPrice] = useState("1000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          price: Number(price) || 0,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to create item");
        return;
      }

      setName("");
      setPrice("1000");
      router.refresh();
    } catch {
      setError("Unable to create item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card p-4">
      <p className="text-sm font-semibold">Create Item</p>
      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Item name" />
        <Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Category" />
        <Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" placeholder="Price" />
      </div>
      <Button type="button" size="sm" onClick={submit} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
