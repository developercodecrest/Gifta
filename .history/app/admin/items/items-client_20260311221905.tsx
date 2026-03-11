"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LayoutGrid, List, Pencil, Plus, Store, Table2, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { AdminEmptyState, AdminSection } from "@/app/admin/_components/admin-surface";
import { VendorSummaryDto } from "@/types/api";

type AdminItemOffer = {
  id: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  deliveryEtaHours: number;
  store?: { name?: string };
};

type AdminItem = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  images: string[];
  featured?: boolean;
  inStock: boolean;
  minOrderQty?: number;
  maxOrderQty?: number;
  bestOffer?: AdminItemOffer;
  offerCount: number;
  offers?: AdminItemOffer[];
};

type ViewMode = "overview" | "grid" | "table";

function formatCurrency(value?: number) {
  if (typeof value !== "number") return "--";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
}

function createSlugPreview(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function ItemsClient({ items, vendors }: { items: AdminItem[]; vendors: VendorSummaryDto[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [storeId, setStoreId] = useState("all");

  const categories = useMemo(() => Array.from(new Set(items.map((item) => item.category))).sort(), [items]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        if (storeId !== "all" && !(item.offers ?? []).some((offer) => offer.storeId === storeId)) return false;
        if (!query) return true;

        return [item.name, item.category, item.description, ...(item.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => right.offerCount - left.offerCount || left.name.localeCompare(right.name));
  }, [items, search, category, storeId]);

  const totalOffers = filtered.reduce((total, item) => total + item.offerCount, 0);

  return (
    <div className="space-y-6">
      <AdminSection
        title="Catalog workspace"
        description="Search by category or store, inspect offer coverage, and create product records that are linked to a specific vendor offer from the start."
        actions={<CreateItemDialog vendors={vendors} />}
      >
        <div className="flex flex-col gap-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.75fr))_auto]">
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item name, category, tags" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
            <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
              <option value="all">All stores</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm text-[#5f5047]">
              <Store className="h-4 w-4 text-primary" /> {filtered.length} items / {totalOffers} offers
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant={viewMode === "overview" ? "default" : "outline"} onClick={() => setViewMode("overview")}>
                <List className="h-4 w-4" /> Overview
              </Button>
              <Button size="sm" variant={viewMode === "grid" ? "default" : "outline"} onClick={() => setViewMode("grid")}>
                <LayoutGrid className="h-4 w-4" /> Grid
              </Button>
              <Button size="sm" variant={viewMode === "table" ? "default" : "outline"} onClick={() => setViewMode("table")}>
                <Table2 className="h-4 w-4" /> Table
              </Button>
            </div>
          </div>

          {!filtered.length ? (
            <AdminEmptyState title="No items matched" description="Try a broader search or create a new store-linked item to expand the catalog." />
          ) : viewMode === "table" ? (
            <div className="overflow-hidden rounded-[1.4rem] border border-border/70 bg-background/70">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="app-table-head text-left text-xs uppercase tracking-[0.22em]">
                    <tr>
                      <th className="px-4 py-3">Item</th>
                      <th className="px-4 py-3">Category</th>
                      <th className="px-4 py-3">Store coverage</th>
                      <th className="px-4 py-3">Best offer</th>
                      <th className="px-4 py-3">Qty guardrails</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-border/60 align-top">
                        <td className="px-4 py-4">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-[#74655c]">/{item.slug}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#5f5047]">{item.category}</td>
                        <td className="px-4 py-4">
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {(item.offers ?? []).map((offer) => (
                              <Badge key={`${item.id}-${offer.storeId}`} variant="outline">{offer.store?.name ?? offer.storeId}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-[#5f5047]">{formatCurrency(item.bestOffer?.price)}</td>
                        <td className="px-4 py-4 text-[#5f5047]">{item.minOrderQty ?? 1} to {item.maxOrderQty ?? 10}</td>
                        <td className="px-4 py-4">
                          <div className="flex justify-end">
                            <ItemRowActions item={item} vendors={vendors} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70 bg-background/80">
                  <CardContent className="flex min-h-72 flex-col space-y-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em]">{item.name}</p>
                        <p className="text-sm text-[#5f5047]">{item.category}</p>
                      </div>
                      {item.featured ? <Badge>Featured</Badge> : <Badge variant="secondary">Standard</Badge>}
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-[#5f5047]">{item.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {(item.tags ?? []).slice(0, 4).map((tag) => (
                        <Badge key={`${item.id}-${tag}`} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-card px-4 py-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-[0.22em] text-[#74655c]">Best offer</span>
                        <span className="text-lg font-semibold">{formatCurrency(item.bestOffer?.price)}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-xs text-[#74655c]">
                        <Truck className="h-3.5 w-3.5 text-primary" />
                        {item.bestOffer?.store?.name ?? "No store linked"} • ETA {item.bestOffer?.deliveryEtaHours ?? "--"} hrs
                      </div>
                    </div>
                    <div className="mt-auto"><ItemRowActions item={item} vendors={vendors} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              {filtered.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70 bg-background/80">
                  <CardContent className="space-y-4 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-xl font-semibold tracking-[-0.03em]">{item.name}</p>
                          {item.featured ? <Badge>Featured</Badge> : null}
                          <Badge variant={item.inStock ? "success" : "warning"}>{item.inStock ? "In stock" : "Inventory off"}</Badge>
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{item.description}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">Qty {item.minOrderQty ?? 1}-{item.maxOrderQty ?? 10}</Badge>
                          <Badge variant="outline">{item.offerCount} linked offers</Badge>
                        </div>
                      </div>
                      <ItemRowActions item={item} vendors={vendors} />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      {(item.offers ?? []).map((offer) => (
                        <div key={offer.id} className="rounded-[1.25rem] border border-border/70 bg-card px-4 py-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">{offer.store?.name ?? offer.storeId}</p>
                              <p className="text-xs text-muted-foreground">{offer.storeId}</p>
                            </div>
                            <Badge variant={offer.inStock ? "success" : "warning"}>{offer.inStock ? "Live" : "Paused"}</Badge>
                          </div>
                          <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                            <span className="font-semibold text-foreground">{formatCurrency(offer.price)}</span>
                            <span className="text-muted-foreground">ETA {offer.deliveryEtaHours} hrs</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </AdminSection>
    </div>
  );
}

function CreateItemDialog({ vendors }: { vendors: VendorSummaryDto[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(vendors[0]?.primaryCategory ?? "Birthday");
  const [storeId, setStoreId] = useState(vendors[0]?.id ?? "");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("1000");
  const [originalPrice, setOriginalPrice] = useState("1200");
  const [deliveryEtaHours, setDeliveryEtaHours] = useState("24");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [maxOrderQty, setMaxOrderQty] = useState("10");
  const [tags, setTags] = useState("gift, premium");
  const [images, setImages] = useState("");
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
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
          storeId,
          name,
          category,
          description,
          price: Number(price) || 0,
          originalPrice: Number(originalPrice) || 0,
          deliveryEtaHours: Number(deliveryEtaHours) || 24,
          minOrderQty: Number(minOrderQty) || 1,
          maxOrderQty: Number(maxOrderQty) || 10,
          tags: tags.split(",").map((entry) => entry.trim()).filter(Boolean),
          images: images.split("\n").map((entry) => entry.trim()).filter(Boolean),
          featured,
          inStock,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to create item");
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError("Unable to create item");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4" /> New item</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create store-linked item</DialogTitle>
          <DialogDescription>Add a detailed product record and publish its first vendor offer in one flow.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Item name"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rose celebration hamper" /></Field>
          <Field label="Slug preview"><div className="min-h-11 rounded-full border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">/{createSlugPreview(name) || "generated-from-name"}</div></Field>
          <Field label="Category"><Input value={category} onChange={(event) => setCategory(event.target.value)} placeholder="Birthday" /></Field>
          <Field label="Store">
            <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Offer price"><Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" /></Field>
          <Field label="Original price"><Input value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} inputMode="decimal" /></Field>
          <Field label="Delivery ETA (hours)"><Input value={deliveryEtaHours} onChange={(event) => setDeliveryEtaHours(event.target.value)} inputMode="numeric" /></Field>
          <Field label="Tags (comma separated)"><Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="gift, premium, same-day" /></Field>
          <Field label="Min order qty"><Input value={minOrderQty} onChange={(event) => setMinOrderQty(event.target.value)} inputMode="numeric" /></Field>
          <Field label="Max order qty"><Input value={maxOrderQty} onChange={(event) => setMaxOrderQty(event.target.value)} inputMode="numeric" /></Field>
          <div className="space-y-2 md:col-span-2">
            <Label>Description</Label>
            <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="min-h-28 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" placeholder="Describe packaging, contents, and gifting use case." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Image URLs (one per line)</Label>
            <textarea value={images} onChange={(event) => setImages(event.target.value)} rows={4} className="min-h-28 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" placeholder="https://..." />
          </div>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
            <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(Boolean(checked))} /> Feature this item
          </label>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
            <Checkbox checked={inStock} onCheckedChange={(checked) => setInStock(Boolean(checked))} /> Offer is active and in stock
          </label>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void create()} disabled={saving || !storeId || !name.trim()}>{saving ? "Creating..." : "Create item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemRowActions({ item, vendors }: { item: AdminItem; vendors: VendorSummaryDto[] }) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [description, setDescription] = useState(item.description);
  const [tags, setTags] = useState((item.tags ?? []).join(", "));
  const [images, setImages] = useState((item.images ?? []).join("\n"));
  const [featured, setFeatured] = useState(Boolean(item.featured));
  const [productInStock, setProductInStock] = useState(item.inStock);
  const [minOrderQty, setMinOrderQty] = useState(String(item.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(String(item.maxOrderQty ?? 10));

  const offers = item.offers ?? [];
  const [offerStoreId, setOfferStoreId] = useState(offers[0]?.storeId ?? vendors[0]?.id ?? "");
  const selectedOffer = offers.find((offer) => offer.storeId === offerStoreId) ?? offers[0];
  const [offerPrice, setOfferPrice] = useState(String(selectedOffer?.price ?? item.bestOffer?.price ?? 0));
  const [originalPrice, setOriginalPrice] = useState(String(selectedOffer?.originalPrice ?? 0));
  const [deliveryEtaHours, setDeliveryEtaHours] = useState(String(selectedOffer?.deliveryEtaHours ?? 24));
  const [offerInStock, setOfferInStock] = useState(selectedOffer?.inStock ?? true);

  const [addOfferOpen, setAddOfferOpen] = useState(false);
  const [newOfferStoreId, setNewOfferStoreId] = useState(vendors.find((vendor) => !offers.some((offer) => offer.storeId === vendor.id))?.id ?? vendors[0]?.id ?? "");
  const [newOfferPrice, setNewOfferPrice] = useState(String(item.bestOffer?.price ?? 0));
  const [newOfferOriginalPrice, setNewOfferOriginalPrice] = useState(String(item.bestOffer?.originalPrice ?? 0));
  const [newOfferEta, setNewOfferEta] = useState("24");
  const [newOfferInStock, setNewOfferInStock] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSelectedOffer = (nextStoreId: string) => {
    setOfferStoreId(nextStoreId);
    const nextOffer = offers.find((offer) => offer.storeId === nextStoreId);
    if (!nextOffer) return;
    setOfferPrice(String(nextOffer.price));
    setOriginalPrice(String(nextOffer.originalPrice ?? 0));
    setDeliveryEtaHours(String(nextOffer.deliveryEtaHours));
    setOfferInStock(nextOffer.inStock);
  };

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const primary = await fetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          category,
          price: Number(offerPrice) || 0,
          inStock: productInStock,
          featured,
          tags: tags.split(",").map((entry) => entry.trim()).filter(Boolean),
          images: images.split("\n").map((entry) => entry.trim()).filter(Boolean),
          offerStoreId,
          offerPrice: Number(offerPrice) || 0,
          originalPrice: Number(originalPrice) || 0,
          deliveryEtaHours: Number(deliveryEtaHours) || 24,
          offerInStock,
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
      router.refresh();
    } catch {
      setError("Unable to update item");
    } finally {
      setSaving(false);
    }
  };

  const addOffer = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/items/${item.id}/offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: newOfferStoreId,
          price: Number(newOfferPrice) || 0,
          originalPrice: Number(newOfferOriginalPrice) || 0,
          deliveryEtaHours: Number(newOfferEta) || 24,
          inStock: newOfferInStock,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to save offer");
        return;
      }

      setAddOfferOpen(false);
      router.refresh();
    } catch {
      setError("Unable to save offer");
    } finally {
      setSaving(false);
    }
  };

  const removeOffer = async () => {
    if (!offerStoreId) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/items/${item.id}/offers`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: offerStoreId }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to remove offer");
        return;
      }

      setEditOpen(false);
      router.refresh();
    } catch {
      setError("Unable to remove offer");
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async () => {
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
      router.refresh();
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
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription>Catalog record and linked store offers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Category" value={item.category} />
              <Info label="Qty range" value={`${item.minOrderQty ?? 1} to ${item.maxOrderQty ?? 10}`} />
              <Info label="Slug" value={item.slug} />
              <Info label="Best offer" value={formatCurrency(item.bestOffer?.price)} />
            </div>
            <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            <div className="flex flex-wrap gap-2">
              {(item.tags ?? []).map((tag) => <Badge key={`${item.id}-${tag}`} variant="outline">{tag}</Badge>)}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {(item.offers ?? []).map((offer) => (
                <div key={offer.id} className="rounded-[1.25rem] border border-border/70 bg-background/60 px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{offer.store?.name ?? offer.storeId}</p>
                    <Badge variant={offer.inStock ? "success" : "warning"}>{offer.inStock ? "Active" : "Paused"}</Badge>
                  </div>
                  <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                    <p>Price: {formatCurrency(offer.price)}</p>
                    <p>Original: {formatCurrency(offer.originalPrice)}</p>
                    <p>ETA: {offer.deliveryEtaHours} hours</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button></DialogTrigger>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Edit item and offers</DialogTitle>
            <DialogDescription>Manage the shared product record and the currently selected store offer.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Item name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
            <Field label="Category"><Input value={category} onChange={(event) => setCategory(event.target.value)} /></Field>
            <div className="space-y-2 md:col-span-2">
              <Label>Description</Label>
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={4} className="min-h-28 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" />
            </div>
            <Field label="Tags (comma separated)"><Input value={tags} onChange={(event) => setTags(event.target.value)} /></Field>
            <Field label="Images (one per line)"><textarea value={images} onChange={(event) => setImages(event.target.value)} rows={3} className="min-h-24 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" /></Field>
            <Field label="Min order qty"><Input value={minOrderQty} onChange={(event) => setMinOrderQty(event.target.value)} inputMode="numeric" /></Field>
            <Field label="Max order qty"><Input value={maxOrderQty} onChange={(event) => setMaxOrderQty(event.target.value)} inputMode="numeric" /></Field>
            <Field label="Manage store offer">
              <select value={offerStoreId} onChange={(event) => syncSelectedOffer(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
                {offers.map((offer) => (
                  <option key={offer.storeId} value={offer.storeId}>{offer.store?.name ?? offer.storeId}</option>
                ))}
              </select>
            </Field>
            <Field label="Offer price"><Input value={offerPrice} onChange={(event) => setOfferPrice(event.target.value)} inputMode="decimal" /></Field>
            <Field label="Original price"><Input value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} inputMode="decimal" /></Field>
            <Field label="Delivery ETA (hours)"><Input value={deliveryEtaHours} onChange={(event) => setDeliveryEtaHours(event.target.value)} inputMode="numeric" /></Field>
            <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
              <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(Boolean(checked))} /> Feature this item
            </label>
            <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
              <Checkbox checked={productInStock} onCheckedChange={(checked) => setProductInStock(Boolean(checked))} /> Product purchasable
            </label>
            <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm md:col-span-2">
              <Checkbox checked={offerInStock} onCheckedChange={(checked) => setOfferInStock(Boolean(checked))} /> Selected store offer is active
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Dialog open={addOfferOpen} onOpenChange={setAddOfferOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline"><Plus className="h-4 w-4" /> Add store offer</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add another store offer</DialogTitle>
                    <DialogDescription>Link this catalog item to another store with its own pricing and delivery promise.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <Field label="Store">
                      <select value={newOfferStoreId} onChange={(event) => setNewOfferStoreId(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
                        {vendors.map((vendor) => (
                          <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Price"><Input value={newOfferPrice} onChange={(event) => setNewOfferPrice(event.target.value)} inputMode="decimal" /></Field>
                    <Field label="Original price"><Input value={newOfferOriginalPrice} onChange={(event) => setNewOfferOriginalPrice(event.target.value)} inputMode="decimal" /></Field>
                    <Field label="Delivery ETA (hours)"><Input value={newOfferEta} onChange={(event) => setNewOfferEta(event.target.value)} inputMode="numeric" /></Field>
                    <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
                      <Checkbox checked={newOfferInStock} onCheckedChange={(checked) => setNewOfferInStock(Boolean(checked))} /> Offer is active
                    </label>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddOfferOpen(false)}>Cancel</Button>
                    <Button onClick={() => void addOffer()} disabled={saving || !newOfferStoreId}>{saving ? "Saving..." : "Save offer"}</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              {offers.length ? <Button variant="destructive" onClick={() => void removeOffer()} disabled={saving}>Remove active offer</Button> : null}
            </div>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete catalog item</DialogTitle>
            <DialogDescription>This removes the product record, linked offers, reviews, and dependent order entries.</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void removeItem()} disabled={saving}>{saving ? "Deleting..." : "Confirm delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-background/60 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-medium text-foreground">{value}</p>
    </div>
  );
}