"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Eye, Filter, LayoutGrid, List, Pencil, Plus, Table2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AdminItem = {
  id: string;
  name: string;
  category: string;
  slug: string;
  minOrderQty?: number;
  maxOrderQty?: number;
  bestOffer?: { price: number; store?: { name: string } };
  offerCount: number;
};

type ViewMode = "grid" | "list" | "table";

export function ItemsClient({ items }: { items: AdminItem[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const sorted = useMemo(
    () => [...items].sort((left, right) => right.offerCount - left.offerCount || left.name.localeCompare(right.name)),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
          <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" /> List
          </Button>
          <Button variant={viewMode === "grid" ? "default" : "outline"} size="sm" onClick={() => setViewMode("grid")}>
            <LayoutGrid className="h-4 w-4" /> Grid
          </Button>
          <Button variant={viewMode === "table" ? "default" : "outline"} size="sm" onClick={() => setViewMode("table")}>
            <Table2 className="h-4 w-4" /> Table
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <ItemCreateDialog />
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" /> Filters
          </Button>
        </div>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Best Price</th>
                  <th className="px-4 py-3">Offers</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{item.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3">₹{item.bestOffer?.price ?? "--"}</td>
                    <td className="px-4 py-3">{item.offerCount}</td>
                    <td className="px-4 py-3">{item.minOrderQty ?? 1} - {item.maxOrderQty ?? 10}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <ItemRowActions item={item} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sorted.map((item) => (
            <Card key={item.id}>
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-4">
                <div className="space-y-1.5">
                  <p className="text-base font-semibold">{item.name}</p>
                  <p className="text-sm text-muted-foreground">{item.category} • {item.offerCount} offers</p>
                  <p className="text-sm text-muted-foreground">Best vendor: {item.bestOffer?.store?.name ?? "N/A"}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary">₹{item.bestOffer?.price ?? "--"}</Badge>
                  <ItemRowActions item={item} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3 p-5">
                <p className="text-base font-semibold">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.category}</p>
                <p className="text-sm text-muted-foreground">Offers: {item.offerCount}</p>
                <p className="text-sm text-muted-foreground">Qty: {item.minOrderQty ?? 1} - {item.maxOrderQty ?? 10}</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold">₹{item.bestOffer?.price ?? "--"}</p>
                  <ItemRowActions item={item} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCreateDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Birthday");
  const [price, setPrice] = useState("1000");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
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

      setOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to create item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> Create item</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create item</DialogTitle>
          <DialogDescription>Add a new catalog item.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={(event) => setCategory(event.target.value)} /></div>
          <div className="space-y-1.5"><Label>Price</Label><Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" /></div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void create()} disabled={saving}>{saving ? "Creating..." : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemRowActions({ item }: { item: AdminItem }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [price, setPrice] = useState(String(item.bestOffer?.price ?? 0));
  const [minOrderQty, setMinOrderQty] = useState(String(item.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(String(item.maxOrderQty ?? 10));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const primary = await fetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          category,
          price: Number(price) || 0,
        }),
      });
      const primaryPayload = (await primary.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!primary.ok || !primaryPayload.success) {
        setError(primaryPayload.error?.message ?? "Unable to update item");
        return;
      }

      const qty = await fetch(`/api/admin/items/${item.id}/quantity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          minOrderQty: Number(minOrderQty) || 1,
          maxOrderQty: Number(maxOrderQty) || 10,
        }),
      });
      const qtyPayload = (await qty.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!qty.ok || !qtyPayload.success) {
        setError(qtyPayload.error?.message ?? "Unable to update quantity");
        return;
      }

      setEditOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to update item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/items/${item.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete item");
        return;
      }

      setDeleteOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to delete item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{item.name}</DialogTitle><DialogDescription>Item details</DialogDescription></DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Category: {item.category}</p>
            <p>Price: ₹{item.bestOffer?.price ?? "--"}</p>
            <p>Offers: {item.offerCount}</p>
            <p>Qty range: {item.minOrderQty ?? 1} - {item.maxOrderQty ?? 10}</p>
            <Button asChild variant="outline" size="sm"><Link href={`/store/${item.slug}`}>Open item</Link></Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit item</DialogTitle><DialogDescription>Update item details</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={name} onChange={(event) => setName(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Category</Label><Input value={category} onChange={(event) => setCategory(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Price</Label><Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" /></div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Min Qty</Label><Input value={minOrderQty} onChange={(event) => setMinOrderQty(event.target.value)} inputMode="numeric" /></div>
              <div className="space-y-1.5"><Label>Max Qty</Label><Input value={maxOrderQty} onChange={(event) => setMaxOrderQty(event.target.value)} inputMode="numeric" /></div>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete item</DialogTitle><DialogDescription>This deletes item and linked offers/orders/reviews.</DialogDescription></DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={saving}>{saving ? "Deleting..." : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
