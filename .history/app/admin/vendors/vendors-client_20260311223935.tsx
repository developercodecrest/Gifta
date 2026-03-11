"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, LayoutGrid, List, Pencil, Table2, Trash2, Plus } from "lucide-react";
import { AdminEmptyState } from "@/app/admin/_components/admin-surface";
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
import { VendorSummaryDto } from "@/types/api";

type ViewMode = "grid" | "list" | "table";

type Props = {
  vendors: VendorSummaryDto[];
};

export function VendorsClient({ vendors }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");

  const categories = useMemo(
    () => Array.from(new Set(vendors.map((vendor) => vendor.primaryCategory).filter((value): value is string => Boolean(value)))).sort(),
    [vendors],
  );

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...vendors]
      .filter((vendor) => {
        if (status === "active" && !vendor.active) return false;
        if (status === "inactive" && vendor.active) return false;
        if (category !== "all" && vendor.primaryCategory !== category) return false;
        if (!query) return true;

        return [vendor.name, vendor.primaryCategory, vendor.primarySubcategory]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => Number(right.active) - Number(left.active) || right.rating - left.rating);
  }, [vendors, search, status, category]);

  const activeCount = sorted.filter((vendor) => vendor.active).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 rounded-[1.25rem] border border-border/70 bg-card/85 p-3.5 lg:grid-cols-[minmax(0,1.3fr)_repeat(2,minmax(0,0.8fr))_auto]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search store, category, subcategory" />
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
          <option value="all">All categories</option>
          {categories.map((entry) => (
            <option key={entry} value={entry}>{entry}</option>
          ))}
        </select>
        <div className="flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-[#5f5047]">
          {sorted.length} stores • {activeCount} active
        </div>
        <div className="flex items-center justify-end gap-2">
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
      </div>

      {!sorted.length ? (
        <AdminEmptyState title="No vendors matched" description="Adjust the search or filters, or create a new store to expand the seller network." />
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="app-table-head text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5">Store</th>
                  <th className="px-3 py-2.5">Category</th>
                  <th className="px-3 py-2.5">Rating</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Items</th>
                  <th className="px-3 py-2.5">Offers</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((vendor) => (
                  <tr key={vendor.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium">{vendor.name}</td>
                    <td className="px-3 py-2.5 text-[#5f5047]">{vendor.primaryCategory ?? "-"}</td>
                    <td className="px-3 py-2.5">{vendor.rating.toFixed(1)}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={vendor.active ? "default" : "secondary"}>{vendor.active ? "Active" : "Inactive"}</Badge>
                    </td>
                    <td className="px-3 py-2.5">{vendor.itemCount}</td>
                    <td className="px-3 py-2.5">{vendor.offerCount}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end">
                        <VendorRowActions vendor={vendor} />
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
          {sorted.map((vendor) => (
            <Card key={vendor.id} className="border-border/70 bg-background/80">
              <CardContent className="flex flex-wrap items-start justify-between gap-3 p-3.5">
                <div className="space-y-1.5">
                  <p className="text-base font-semibold">{vendor.name}</p>
                  <p className="text-sm text-[#5f5047]">{vendor.primaryCategory ?? "Uncategorized"}{vendor.primarySubcategory ? ` • ${vendor.primarySubcategory}` : ""}</p>
                  <p className="text-sm text-[#5f5047]">Rating {vendor.rating.toFixed(1)} • Items {vendor.itemCount} • Offers {vendor.offerCount}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant={vendor.active ? "default" : "secondary"}>{vendor.active ? "Active" : "Inactive"}</Badge>
                  <VendorRowActions vendor={vendor} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sorted.map((vendor) => (
            <Card key={vendor.id} className="border-border/80 bg-background/80">
              <CardContent className="flex min-h-44 flex-col space-y-2.5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-base font-semibold">{vendor.name}</p>
                    <p className="text-xs text-[#74655c]">{vendor.id}</p>
                  </div>
                  <Badge variant={vendor.active ? "default" : "secondary"}>{vendor.active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="space-y-1 text-sm text-[#5f5047]">
                  <p>Category: {vendor.primaryCategory ?? "Uncategorized"}</p>
                  <p>Subcategory: {vendor.primarySubcategory ?? "-"}</p>
                  <p>Rating: {vendor.rating.toFixed(1)}</p>
                  <p>Items: {vendor.itemCount} • Offers: {vendor.offerCount}</p>
                </div>
                <div className="mt-auto"><VendorRowActions vendor={vendor} /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function VendorRowActions({ vendor }: { vendor: VendorSummaryDto }) {
  const router = useRouter();

  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(vendor.name);
  const [rating, setRating] = useState(String(vendor.rating));
  const [active, setActive] = useState(vendor.active);
  const [categories, setCategories] = useState(vendor.categories ?? []);
  const [category, setCategory] = useState(vendor.primaryCategory ?? "");
  const [subcategory, setSubcategory] = useState(vendor.primarySubcategory ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [newSubByCategory, setNewSubByCategory] = useState<Record<string, string>>({});

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subcategoryOptions = useMemo(
    () => categories.find((entry) => entry.name === category)?.subcategories ?? [],
    [categories, category],
  );

  const save = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/stores/${vendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          rating: Number(rating) || 0,
          active,
          category,
          subcategory,
          categories,
        }),
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update store");
        return;
      }

      setEditOpen(false);
      router.refresh();
    } catch {
      setError("Unable to update store");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/stores/${vendor.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete store");
        return;
      }

      setDeleteOpen(false);
      router.refresh();
    } catch {
      setError("Unable to delete store");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{vendor.name}</DialogTitle>
            <DialogDescription>Store summary</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Store ID:</span> {vendor.id}</p>
            <p><span className="font-medium text-foreground">Slug:</span> {vendor.slug}</p>
            <p><span className="font-medium text-foreground">Rating:</span> {vendor.rating.toFixed(1)}</p>
            <p><span className="font-medium text-foreground">Status:</span> {vendor.active ? "Active" : "Inactive"}</p>
            <p><span className="font-medium text-foreground">Category:</span> {vendor.primaryCategory ?? "-"}</p>
            <p><span className="font-medium text-foreground">Subcategory:</span> {vendor.primarySubcategory ?? "-"}</p>
          </div>
          <div className="space-y-2">
            <Label>Category Setup</Label>
            <div className="rounded-md border border-border p-3">
              {vendor.categories.length ? (
                <div className="space-y-2">
                  {vendor.categories.map((entry) => (
                    <div key={entry.name} className="text-sm">
                      <p className="font-medium">{entry.name}</p>
                      <p className="text-xs text-muted-foreground">{entry.subcategories.join(", ") || "No subcategories"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No categories configured.</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit store</DialogTitle>
            <DialogDescription>Update profile and category mapping.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Store Name</Label>
              <Input value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Rating</Label>
              <Input value={rating} onChange={(event) => setRating(event.target.value)} inputMode="decimal" />
            </div>

            <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm md:col-span-2">
              <Checkbox checked={active} onCheckedChange={(checked) => setActive(Boolean(checked))} /> Active store
            </label>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <select
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={category}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setCategory(nextCategory);
                  const nextSubOptions = categories.find((entry) => entry.name === nextCategory)?.subcategories ?? [];
                  setSubcategory(nextSubOptions[0] ?? "");
                }}
              >
                <option value="">Select category</option>
                {categories.map((entry) => (
                  <option key={entry.name} value={entry.name}>{entry.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label>Subcategory</Label>
              <select
                className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
              >
                <option value="">Select subcategory</option>
                {subcategoryOptions.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-3 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Store categories</p>
              <span className="text-xs text-muted-foreground">For this store only</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                placeholder="New category"
                value={newCategory}
                onChange={(event) => setNewCategory(event.target.value)}
                className="max-w-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const name = newCategory.trim();
                  if (!name || categories.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) return;
                  setCategories((prev) => [...prev, { name, subcategories: [] }]);
                  setNewCategory("");
                  if (!category) {
                    setCategory(name);
                    setSubcategory("");
                  }
                }}
              >
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>

            <div className="space-y-3">
              {categories.length ? (
                categories.map((entry) => (
                  <div key={entry.name} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{entry.name}</p>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCategories((prev) => prev.filter((value) => value.name !== entry.name));
                          if (category === entry.name) {
                            setCategory("");
                            setSubcategory("");
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="mt-1 text-xs text-muted-foreground">{entry.subcategories.join(", ") || "No subcategories"}</p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        placeholder="New subcategory"
                        value={newSubByCategory[entry.name] ?? ""}
                        onChange={(event) => setNewSubByCategory((prev) => ({ ...prev, [entry.name]: event.target.value }))}
                        className="max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const value = (newSubByCategory[entry.name] ?? "").trim();
                          if (!value || entry.subcategories.some((sub) => sub.toLowerCase() === value.toLowerCase())) return;
                          setCategories((prev) =>
                            prev.map((categoryEntry) =>
                              categoryEntry.name === entry.name
                                ? { ...categoryEntry, subcategories: [...categoryEntry.subcategories, value] }
                                : categoryEntry,
                            ),
                          );
                          setNewSubByCategory((prev) => ({ ...prev, [entry.name]: "" }));
                          if (category === entry.name && !subcategory) {
                            setSubcategory(value);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" /> Add Subcategory
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No categories added yet.</p>
              )}
            </div>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete store</DialogTitle>
            <DialogDescription>This action removes the store and linked offers/orders.</DialogDescription>
          </DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={saving}>{saving ? "Deleting..." : "Confirm delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
