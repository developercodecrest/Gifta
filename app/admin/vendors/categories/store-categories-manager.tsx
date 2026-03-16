"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Plus, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFileToCloudinary } from "@/lib/client/cloudinary-upload";
import { VendorSummaryDto } from "@/types/api";

type Props = {
  vendors: VendorSummaryDto[];
};

export function StoreCategoriesManager({ vendors }: Props) {
  const [selectedStoreId, setSelectedStoreId] = useState(vendors[0]?.id ?? "");
  const selectedStore = useMemo(() => vendors.find((entry) => entry.id === selectedStoreId), [vendors, selectedStoreId]);

  const [categories, setCategories] = useState(selectedStore?.categories ?? []);
  const [newCategory, setNewCategory] = useState("");
  const [subDraftByCategory, setSubDraftByCategory] = useState<Record<string, string>>({});
  const [uploadingByCategory, setUploadingByCategory] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onStoreChange = (id: string) => {
    setSelectedStoreId(id);
    const store = vendors.find((entry) => entry.id === id);
    setCategories(store?.categories ?? []);
    setSubDraftByCategory({});
    setStatus(null);
    setError(null);
  };

  const save = async () => {
    if (!selectedStore) return;
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch(`/api/admin/stores/${selectedStore.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories }),
      });

      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to save categories");
      }

      setStatus("Categories updated successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save categories");
    } finally {
      setSaving(false);
    }
  };

  const uploadCategoryImage = async (categoryName: string, file: File) => {
    setError(null);
    try {
      const url = await uploadFileToCloudinary(file, {
        folder: `gifta/categories/${selectedStoreId || "global"}`,
        resourceType: "image",
        onProgress: (value) => {
          setUploadingByCategory((prev) => ({ ...prev, [categoryName]: value }));
        },
      });

      setCategories((prev) =>
        prev.map((entry) => (entry.name === categoryName ? { ...entry, image: url } : entry)),
      );
      setUploadingByCategory((prev) => ({ ...prev, [categoryName]: 100 }));
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload category image");
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Store</Label>
            <select
              value={selectedStoreId}
              onChange={(event) => onStoreChange(event.target.value)}
              className="min-h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>New Category</Label>
            <div className="flex gap-2">
              <Input value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Example: Cakes" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const name = newCategory.trim();
                  if (!name || categories.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) return;
                  setCategories((prev) => [...prev, { name, subcategories: [] }]);
                  setNewCategory("");
                }}
              >
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {categories.length ? (
            categories.map((entry) => (
              <div key={entry.name} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{entry.name}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCategories((prev) => prev.filter((value) => value.name !== entry.name))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {entry.image ? (
                      <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border">
                        <Image src={entry.image} alt={`${entry.name} image`} fill className="object-cover" sizes="56px" />
                      </div>
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border text-xs text-muted-foreground">
                        No image
                      </div>
                    )}

                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30">
                      <UploadCloud className="h-3.5 w-3.5" /> Upload image
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (!file) return;
                          void uploadCategoryImage(entry.name, file);
                          event.currentTarget.value = "";
                        }}
                      />
                    </label>
                  </div>

                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div className="h-full bg-primary transition-all" style={{ width: `${uploadingByCategory[entry.name] ?? 0}%` }} />
                  </div>

                <p className="mt-1 text-xs text-muted-foreground">{entry.subcategories.join(", ") || "No subcategories"}</p>

                <div className="mt-2 flex gap-2">
                  <Input
                    value={subDraftByCategory[entry.name] ?? ""}
                    onChange={(event) => setSubDraftByCategory((prev) => ({ ...prev, [entry.name]: event.target.value }))}
                    placeholder="Add subcategory"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const value = (subDraftByCategory[entry.name] ?? "").trim();
                      if (!value || entry.subcategories.some((sub) => sub.toLowerCase() === value.toLowerCase())) return;

                      setCategories((prev) =>
                        prev.map((categoryEntry) =>
                          categoryEntry.name === entry.name
                            ? { ...categoryEntry, subcategories: [...categoryEntry.subcategories, value] }
                            : categoryEntry,
                        ),
                      );
                      setSubDraftByCategory((prev) => ({ ...prev, [entry.name]: "" }));
                    }}
                  >
                    <Plus className="h-4 w-4" /> Add Sub
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No categories available for this store.</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => void save()} disabled={!selectedStore || saving}>{saving ? "Saving..." : "Save categories"}</Button>
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
