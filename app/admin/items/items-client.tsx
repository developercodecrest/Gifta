"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, FileUp, LayoutGrid, List, Pencil, Plus, Store, Table2, Trash2, Truck, UploadCloud, X } from "lucide-react";
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
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { AdminEmptyState, AdminSection } from "@/app/admin/_components/admin-surface";
import { uploadFileToCloudinary } from "@/lib/client/cloudinary-upload";
import { PRODUCT_DIMENSION_UNIT_OPTIONS, PRODUCT_WEIGHT_UNIT_OPTIONS, normalizeProductDimensionUnit, normalizeProductWeightUnit } from "@/lib/product-shipping";
import { ProductDimensionUnit, ProductMediaItem, ProductWeightUnit } from "@/types/ecommerce";
import { StoreCategoryOption, VendorSummaryDto } from "@/types/api";

type AdminItemOffer = {
  id: string;
  storeId: string;
  price: number;
  originalPrice?: number;
  inStock: boolean;
  deliveryEtaHours: number;
  store?: { name?: string };
};

type AdminItemAttribute = {
  name: string;
  values: string[];
};

type AdminItemVariant = {
  id: string;
  options: Record<string, string>;
  salePrice: number;
  regularPrice?: number;
  weight?: number;
  weightUnit?: ProductWeightUnit;
  size?: string;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: ProductDimensionUnit;
  inStock: boolean;
};

type AdminItem = {
  id: string;
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  disclaimerHtml?: string;
  howToPersonaliseHtml?: string;
  brandDetailsHtml?: string;
  category: string;
  subcategory?: string;
  tags: string[];
  media?: ProductMediaItem[];
  images: string[];
  featured?: boolean;
  inStock: boolean;
  minOrderQty?: number;
  maxOrderQty?: number;
  weight?: number;
  weightUnit?: ProductWeightUnit;
  length?: number;
  width?: number;
  height?: number;
  dimensionUnit?: ProductDimensionUnit;
  bestOffer?: AdminItemOffer;
  offerCount: number;
  offers?: AdminItemOffer[];
  attributes?: AdminItemAttribute[];
  variants?: AdminItemVariant[];
};

type ViewMode = "overview" | "grid" | "table";

type AttributeInputRow = {
  id: string;
  name: string;
  value: string;
};

type VariantInputRow = {
  id: string;
  options: Record<string, string>;
  salePrice: string;
  regularPrice: string;
  weight: string;
  weightUnit: ProductWeightUnit;
  size: string;
  length: string;
  width: string;
  height: string;
  dimensionUnit: ProductDimensionUnit;
  inStock: boolean;
};

type CsvCanonicalField =
  | "storeId"
  | "name"
  | "shortDescription"
  | "description"
  | "disclaimerHtml"
  | "howToPersonaliseHtml"
  | "brandDetailsHtml"
  | "category"
  | "subcategory"
  | "price"
  | "originalPrice"
  | "deliveryEtaHours"
  | "minOrderQty"
  | "maxOrderQty"
  | "tags"
  | "featured"
  | "inStock"
  | "media"
  | "variantId"
  | "variantSize"
  | "variantSalePrice"
  | "variantRegularPrice"
  | "variantWeight"
  | "variantWeightUnit"
  | "variantLength"
  | "variantWidth"
  | "variantHeight"
  | "variantDimensionUnit";

type CsvColumnMapping = Partial<Record<CsvCanonicalField, string>>;

type CsvFieldDefinition = {
  key: CsvCanonicalField;
  label: string;
  aliases: string[];
};

type CsvImportRow = Record<string, string>;

type CsvImportFailure = {
  rowNumber: number;
  message: string;
};

type AdminItemCreatePayload = {
  storeId: string;
  name: string;
  shortDescription?: string;
  description?: string;
  disclaimerHtml?: string;
  howToPersonaliseHtml?: string;
  brandDetailsHtml?: string;
  category: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  deliveryEtaHours?: number;
  minOrderQty?: number;
  maxOrderQty?: number;
  tags?: string[];
  media?: ProductMediaItem[];
  featured?: boolean;
  inStock?: boolean;
  weight?: number | string;
  weightUnit?: ProductWeightUnit;
  length?: number | string;
  width?: number | string;
  height?: number | string;
  dimensionUnit?: ProductDimensionUnit;
  attributes?: AdminItemAttribute[];
  variants?: AdminItemVariant[];
};

type CsvPreparedItem = {
  key: string;
  rowNumbers: number[];
  payload: AdminItemCreatePayload;
};

const CSV_FIELD_DEFINITIONS: CsvFieldDefinition[] = [
  { key: "storeId", label: "Store ID", aliases: ["storeid", "store", "vendorid", "vendor", "shopid"] },
  { key: "name", label: "Item Name", aliases: ["name", "itemname", "productname", "title"] },
  { key: "shortDescription", label: "Short Description", aliases: ["shortdescription", "shortdesc", "summary", "snippet"] },
  { key: "description", label: "Description", aliases: ["description", "desc", "details"] },
  { key: "disclaimerHtml", label: "Disclaimer (HTML)", aliases: ["disclaimerhtml", "disclaimer", "terms"] },
  { key: "howToPersonaliseHtml", label: "How To Personalise (HTML)", aliases: ["howtopersonalisehtml", "howtopersonalizehtml", "howtopersonalise", "personalisation", "personalization"] },
  { key: "brandDetailsHtml", label: "Brand Details (HTML)", aliases: ["branddetailshtml", "branddetails", "brandstory"] },
  { key: "category", label: "Category", aliases: ["category", "cat"] },
  { key: "subcategory", label: "Subcategory", aliases: ["subcategory", "subcat"] },
  { key: "price", label: "Price", aliases: ["price", "saleprice", "itemprice", "mrpprice"] },
  { key: "originalPrice", label: "Original Price", aliases: ["originalprice", "mrp", "regularprice", "listprice"] },
  { key: "deliveryEtaHours", label: "Delivery ETA (hours)", aliases: ["deliveryetahours", "eta", "deliveryhours"] },
  { key: "minOrderQty", label: "Min Order Qty", aliases: ["minorderqty", "minqty", "minimumqty"] },
  { key: "maxOrderQty", label: "Max Order Qty", aliases: ["maxorderqty", "maxqty", "maximumqty"] },
  { key: "tags", label: "Tags", aliases: ["tags", "tag", "keywords"] },
  { key: "featured", label: "Featured", aliases: ["featured", "isfeatured", "highlighted"] },
  { key: "inStock", label: "In Stock", aliases: ["instock", "stock", "active", "available"] },
  { key: "media", label: "Media URLs", aliases: ["media", "mediaurls", "images", "imageurls", "assets"] },
  { key: "variantId", label: "Variant ID", aliases: ["variantid", "sku", "variationid"] },
  { key: "variantSize", label: "Variant Size", aliases: ["variantsize", "size", "dimensionname"] },
  { key: "variantSalePrice", label: "Variant Sale Price", aliases: ["variantsaleprice", "variantsale", "variantprice"] },
  { key: "variantRegularPrice", label: "Variant Regular Price", aliases: ["variantregularprice", "variantmrp", "variantoriginalprice"] },
  { key: "variantWeight", label: "Variant Weight", aliases: ["variantweight", "weight"] },
  { key: "variantWeightUnit", label: "Variant Weight Unit", aliases: ["variantweightunit", "weightunit"] },
  { key: "variantLength", label: "Variant Length", aliases: ["variantlength", "length"] },
  { key: "variantWidth", label: "Variant Width", aliases: ["variantwidth", "width"] },
  { key: "variantHeight", label: "Variant Height", aliases: ["variantheight", "height"] },
  { key: "variantDimensionUnit", label: "Variant Dimension Unit", aliases: ["variantdimensionunit", "dimensionunit", "sizeunit"] },
];

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

function parseImageLines(value: string) {
  return value.split("\n").map((entry) => entry.trim()).filter(Boolean);
}

function inferMediaTypeFromUrl(url: string): "image" | "video" {
  const normalized = url.trim().toLowerCase();
  if (normalized.includes("/video/upload/")) {
    return "video";
  }
  if (/\.(mp4|webm|mov|mkv|m4v)(\?|$)/i.test(normalized)) {
    return "video";
  }
  return "image";
}

function deriveCloudinaryVideoThumbnail(url: string) {
  if (!url.includes("res.cloudinary.com") || !url.includes("/video/upload/")) {
    return undefined;
  }

  const [base, query = ""] = url.split("?");
  const withFrame = base.replace("/video/upload/", "/video/upload/so_0/");
  const asImage = /\.[a-z0-9]+$/i.test(withFrame)
    ? withFrame.replace(/\.[a-z0-9]+$/i, ".jpg")
    : `${withFrame}.jpg`;

  return query ? `${asImage}?${query}` : asImage;
}

function toMediaInputLines(media: ProductMediaItem[] | undefined, images: string[] | undefined) {
  const urls = Array.from(
    new Set([
      ...(media ?? []).map((entry) => entry.url.trim()),
      ...((images ?? []).map((entry) => entry.trim())),
    ].filter(Boolean)),
  );

  return urls.join("\n");
}

function parseMediaInputLines(value: string): ProductMediaItem[] {
  const urls = parseImageLines(value);
  return urls.map((url) => {
    const type = inferMediaTypeFromUrl(url);
    return {
      type,
      url,
      ...(type === "video" ? { thumbnailUrl: deriveCloudinaryVideoThumbnail(url) } : {}),
    };
  });
}

function toNormalizedGlobalCategoryOptions(categories: StoreCategoryOption[]) {
  const map = new Map<string, { name: string; subcategories: string[] }>();

  for (const category of categories) {
    const name = category.name.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    const existing = map.get(key);
    const subcategories = Array.from(new Set((category.subcategories ?? []).map((entry) => entry.trim()).filter(Boolean)));

    if (!existing) {
      map.set(key, { name, subcategories });
      continue;
    }

    map.set(key, {
      name: existing.name,
      subcategories: Array.from(new Set([...existing.subcategories, ...subcategories])),
    });
  }

  return Array.from(map.values()).sort((left, right) => left.name.localeCompare(right.name));
}

export function ItemsClient({
  items,
  vendors,
  globalCategories,
  lockedStoreId,
}: {
  items: AdminItem[];
  vendors: VendorSummaryDto[];
  globalCategories: StoreCategoryOption[];
  lockedStoreId?: string;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [storeId, setStoreId] = useState("all");

  const activeStoreId = lockedStoreId ?? storeId;
  const isVendorLocked = Boolean(lockedStoreId);
  const lockedVendor = lockedStoreId ? vendors.find((entry) => entry.id === lockedStoreId) : undefined;

  const categories = useMemo(() => {
    const itemCategories = items.map((item) => item.category).filter(Boolean);
    const globalCategoryValues = globalCategories.flatMap((entry) => [entry.name, ...entry.subcategories]).filter(Boolean);
    const vendorCategoryValues = lockedVendor
      ? lockedVendor.categories.flatMap((entry) => [entry.name, ...entry.subcategories]).filter(Boolean)
      : [];

    return Array.from(
      new Set([...globalCategoryValues, ...vendorCategoryValues, ...itemCategories].map((entry) => entry.trim()).filter(Boolean)),
    ).sort((left, right) => left.localeCompare(right));
  }, [globalCategories, items, lockedVendor]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...items]
      .filter((item) => {
        if (category !== "all" && item.category !== category) return false;
        if (activeStoreId !== "all" && !(item.offers ?? []).some((offer) => offer.storeId === activeStoreId)) return false;
        if (!query) return true;

        return [item.name, item.category, item.description, ...(item.tags ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => right.offerCount - left.offerCount || left.name.localeCompare(right.name));
  }, [items, search, category, activeStoreId]);

  const totalOffers = filtered.reduce((total, item) => total + item.offerCount, 0);

  return (
    <div className="space-y-6">
      <AdminSection
        title={isVendorLocked ? `${lockedVendor?.name ?? "Vendor"} catalog` : "Catalog workspace"}
        description={isVendorLocked ? "Manage items mapped to this vendor only and keep category mapping aligned to vendor taxonomy." : "Search by category or store, inspect offer coverage, and create product records that are linked to a specific vendor offer from the start."}
        actions={(
          <div className="flex flex-wrap gap-2">
            <ImportItemsDialog lockedStoreId={lockedStoreId} />
            <CreateItemDialog vendors={vendors} lockedStoreId={lockedStoreId} globalCategories={globalCategories} />
          </div>
        )}
      >
        <div className="flex flex-col gap-3.5">
          <div className={isVendorLocked ? "grid gap-2.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.8fr)_auto]" : "grid gap-2.5 lg:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.75fr))_auto]"}>
            <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search item name, category, tags" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
              <option value="all">All categories</option>
              {categories.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
            {!isVendorLocked ? (
              <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
                <option value="all">All stores</option>
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            ) : null}
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
            <div className="overflow-hidden rounded-[1.25rem] border border-border/70 bg-background/70">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="app-table-head text-left text-xs uppercase tracking-[0.22em]">
                    <tr>
                      <th className="px-3 py-2.5">Item</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Store coverage</th>
                      <th className="px-3 py-2.5">Best offer</th>
                      <th className="px-3 py-2.5">Qty guardrails</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((item) => (
                      <tr key={item.id} className="border-t border-border/60 align-top">
                        <td className="px-3 py-3">
                          <div className="space-y-1">
                            <p className="font-medium text-foreground">{item.name}</p>
                            <p className="text-xs text-[#74655c]">/{item.slug}</p>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#5f5047]">{item.category}</td>
                        <td className="px-3 py-3">
                          <div className="flex max-w-xs flex-wrap gap-2">
                            {(item.offers ?? []).map((offer) => (
                              <Badge key={`${item.id}-${offer.storeId}`} variant="outline">{offer.store?.name ?? offer.storeId}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="px-3 py-3 text-[#5f5047]">{formatCurrency(item.bestOffer?.price)}</td>
                        <td className="px-3 py-3 text-[#5f5047]">{item.minOrderQty ?? 1} to {item.maxOrderQty ?? 10}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end">
                            <ItemRowActions item={item} vendors={vendors} globalCategories={globalCategories} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {filtered.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70 bg-background/80">
                  <CardContent className="flex min-h-60 flex-col space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em]">{item.name}</p>
                        <p className="text-sm text-[#5f5047]">{item.category}</p>
                      </div>
                      {item.featured ? <Badge>Featured</Badge> : <Badge variant="secondary">Standard</Badge>}
                    </div>
                    <RichTextPreview value={item.description} />
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
                    <div className="mt-auto"><ItemRowActions item={item} vendors={vendors} globalCategories={globalCategories} /></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid gap-3 xl:grid-cols-2 2xl:grid-cols-3">
              {filtered.map((item) => (
                <Card key={item.id} className="overflow-hidden border-border/70 bg-background/80">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-lg font-semibold tracking-[-0.03em]">{item.name}</p>
                          {item.featured ? <Badge>Featured</Badge> : null}
                          <Badge variant={item.inStock ? "success" : "warning"}>{item.inStock ? "In stock" : "Inventory off"}</Badge>
                        </div>
                        <RichTextPreview value={item.description} />
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="secondary">{item.category}</Badge>
                          <Badge variant="outline">Qty {item.minOrderQty ?? 1}-{item.maxOrderQty ?? 10}</Badge>
                          <Badge variant="outline">{item.offerCount} linked offers</Badge>
                        </div>
                      </div>
                      <ItemRowActions item={item} vendors={vendors} globalCategories={globalCategories} />
                    </div>

                    <div className="grid gap-2.5 md:grid-cols-2">
                      {(item.offers ?? []).map((offer) => (
                        <div key={offer.id} className="rounded-[1.1rem] border border-border/70 bg-card px-3 py-2.5">
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

function ImportItemsDialog({ lockedStoreId }: { lockedStoreId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<CsvImportRow[]>([]);
  const [mapping, setMapping] = useState<CsvColumnMapping>({});
  const [step, setStep] = useState<"upload" | "map" | "result">("upload");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ successCount: number; skippedCount: number; failures: CsvImportFailure[] } | null>(null);

  const requiredFields = useMemo<CsvCanonicalField[]>(
    () => (lockedStoreId ? ["name", "category", "price"] : ["storeId", "name", "category", "price"]),
    [lockedStoreId],
  );

  const missingRequiredMapping = useMemo(
    () => requiredFields.filter((field) => !mapping[field]),
    [mapping, requiredFields],
  );

  const resetDialogState = () => {
    setFileName("");
    setHeaders([]);
    setRows([]);
    setMapping({});
    setStep("upload");
    setSaving(false);
    setError(null);
    setResult(null);
  };

  const handleFileSelection = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const parsed = parseCsvContent(await file.text());
      if (parsed.error) {
        setError(parsed.error);
        return;
      }

      const autoMapping = buildAutoCsvMapping(parsed.headers);

      if (lockedStoreId) {
        delete autoMapping.storeId;
      }

      setFileName(file.name);
      setHeaders(parsed.headers);
      setRows(parsed.rows);
      setMapping(autoMapping);
      setStep("map");
    } catch {
      setError("Unable to parse CSV file");
    }
  };

  const runImport = async () => {
    setSaving(true);
    setError(null);
    setResult(null);

    try {
      const prepared = toCsvImportItems({ rows, mapping, lockedStoreId });
      const failures: CsvImportFailure[] = [...prepared.failures];
      let successCount = 0;

      if (!prepared.items.length) {
        setResult({
          successCount,
          skippedCount: prepared.failures.length,
          failures,
        });
        setStep("result");
        return;
      }

      for (const item of prepared.items) {
        try {
          const response = await fetch("/api/admin/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item.payload),
          });

          const payload = (await response.json().catch(() => ({}))) as {
            success?: boolean;
            error?: { message?: string };
          };

          if (!response.ok || !payload.success) {
            const firstRow = item.rowNumbers[0] ?? 0;
            failures.push({
              rowNumber: firstRow,
              message: `Rows ${item.rowNumbers.join(", ")}: ${payload.error?.message ?? "Unable to import item"}`,
            });
            continue;
          }

          successCount += 1;
        } catch {
          const firstRow = item.rowNumbers[0] ?? 0;
          failures.push({
            rowNumber: firstRow,
            message: `Rows ${item.rowNumbers.join(", ")}: Unable to import item`,
          });
        }
      }

      setResult({
        successCount,
        skippedCount: prepared.failures.length,
        failures,
      });
      setStep("result");

      if (successCount > 0) {
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          resetDialogState();
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline"><FileUp className="h-4 w-4" /> Import CSV</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Import catalog via CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file, verify auto-mapped columns, adjust manually where needed, then import with partial success handling.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-dashed border-border p-5">
              <Label htmlFor="items-csv-file">CSV file</Label>
              <Input
                id="items-csv-file"
                type="file"
                accept=".csv,text/csv"
                className="mt-2"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) {
                    return;
                  }
                  void handleFileSelection(file);
                  event.currentTarget.value = "";
                }}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Required fields: {lockedStoreId ? "name, category, price" : "storeId, name, category, price"}.
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {step === "map" ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-card/40 p-4 text-sm">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-muted-foreground">{rows.length} data row(s) detected</p>
              {lockedStoreId ? <p className="text-muted-foreground">Store is locked to {lockedStoreId}</p> : null}
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4">
              <p className="text-sm font-semibold">Column mapping</p>
              <div className="grid gap-3 md:grid-cols-2">
                {CSV_FIELD_DEFINITIONS.map((definition) => {
                  const isRequired = requiredFields.includes(definition.key);
                  const isStoreLockedField = definition.key === "storeId" && Boolean(lockedStoreId);
                  return (
                    <div key={definition.key} className="space-y-1.5">
                      <Label>{definition.label}{isRequired ? " *" : ""}</Label>
                      <select
                        value={isStoreLockedField ? "" : mapping[definition.key] ?? ""}
                        onChange={(event) =>
                          setMapping((current) => ({
                            ...current,
                            [definition.key]: event.target.value || undefined,
                          }))
                        }
                        className="min-h-11 w-full rounded-[1.25rem] border border-input bg-background px-4 py-2 text-sm"
                        disabled={isStoreLockedField}
                      >
                        <option value="">{isStoreLockedField ? "Locked by vendor page" : "Ignore field"}</option>
                        {headers.map((header) => (
                          <option key={`${definition.key}-${header}`} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  );
                })}
              </div>
            </div>

            {rows.length ? (
              <div className="space-y-2 rounded-[1.25rem] border border-border/70 bg-card/40 p-4">
                <p className="text-sm font-semibold">Preview (first 5 rows)</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border">
                        {headers.map((header) => (
                          <th key={`preview-${header}`} className="px-2 py-2 font-semibold text-foreground">{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((row, index) => (
                        <tr key={`preview-row-${index}`} className="border-b border-border/70">
                          {headers.map((header) => (
                            <td key={`preview-row-${index}-${header}`} className="max-w-56 truncate px-2 py-2 text-muted-foreground">{row[header]}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {missingRequiredMapping.length ? (
              <p className="text-sm text-destructive">
                Map required fields before import: {missingRequiredMapping.join(", ")}
              </p>
            ) : null}

            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
        ) : null}

        {step === "result" && result ? (
          <div className="space-y-4">
            <div className="rounded-[1.25rem] border border-border/70 bg-card/40 p-4 text-sm">
              <p className="font-semibold text-foreground">Import completed</p>
              <p className="text-muted-foreground">Items imported: {result.successCount}</p>
              <p className="text-muted-foreground">Rows skipped before request: {result.skippedCount}</p>
              <p className="text-muted-foreground">Rows failed: {result.failures.length}</p>
            </div>

            {result.failures.length ? (
              <div className="space-y-2 rounded-[1.25rem] border border-border/70 bg-card/40 p-4">
                <p className="text-sm font-semibold">Failed rows</p>
                <div className="max-h-56 space-y-2 overflow-y-auto">
                  {result.failures.map((failure, index) => (
                    <p key={`failure-${index}`} className="text-xs text-destructive">
                      Row {failure.rowNumber}: {failure.message}
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          {step === "upload" ? (
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          ) : null}

          {step === "map" ? (
            <>
              <Button variant="outline" onClick={() => setStep("upload")}>Back</Button>
              <Button onClick={() => void runImport()} disabled={saving || Boolean(missingRequiredMapping.length)}>
                {saving ? "Importing..." : "Start import"}
              </Button>
            </>
          ) : null}

          {step === "result" ? (
            <>
              <Button variant="outline" onClick={() => setStep("map")}>Back to mapping</Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateItemDialog({
  vendors,
  lockedStoreId,
  globalCategories,
}: {
  vendors: VendorSummaryDto[];
  lockedStoreId?: string;
  globalCategories: StoreCategoryOption[];
}) {
  const router = useRouter();
  const globalCategoryOptions = useMemo(() => toNormalizedGlobalCategoryOptions(globalCategories), [globalCategories]);
  const safeCategoryOptions = useMemo(
    () => globalCategoryOptions.map((entry) => entry.name),
    [globalCategoryOptions],
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState(safeCategoryOptions[0] ?? "");
  const [subcategory, setSubcategory] = useState("");
  const [storeId, setStoreId] = useState(lockedStoreId ?? vendors[0]?.id ?? "");
  const [shortDescription, setShortDescription] = useState("");
  const [description, setDescription] = useState("<p></p>");
  const [disclaimerHtml, setDisclaimerHtml] = useState("<p></p>");
  const [howToPersonaliseHtml, setHowToPersonaliseHtml] = useState("<p></p>");
  const [brandDetailsHtml, setBrandDetailsHtml] = useState("<p></p>");
  const [price, setPrice] = useState("1000");
  const [originalPrice, setOriginalPrice] = useState("1200");
  const [deliveryEtaHours, setDeliveryEtaHours] = useState("24");
  const [minOrderQty, setMinOrderQty] = useState("1");
  const [maxOrderQty, setMaxOrderQty] = useState("10");
  const [productWeight, setProductWeight] = useState("");
  const [productWeightUnit, setProductWeightUnit] = useState<ProductWeightUnit>("g");
  const [productLength, setProductLength] = useState("");
  const [productWidth, setProductWidth] = useState("");
  const [productHeight, setProductHeight] = useState("");
  const [productDimensionUnit, setProductDimensionUnit] = useState<ProductDimensionUnit>("cm");
  const [tags, setTags] = useState("gift, premium");
  const [mediaInput, setMediaInput] = useState("");
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [attributeRows, setAttributeRows] = useState<AttributeInputRow[]>([{ id: makeLocalId("attr"), name: "", value: "" }]);
  const [variantRows, setVariantRows] = useState<VariantInputRow[]>([]);
  const [featured, setFeatured] = useState(false);
  const [inStock, setInStock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSubcategoryOptions = useMemo(
    () => globalCategoryOptions.find((entry) => entry.name === category)?.subcategories ?? [],
    [category, globalCategoryOptions],
  );

  const mediaList = useMemo(() => parseMediaInputLines(mediaInput), [mediaInput]);

  const uploadItemMedia = async (file: File) => {
    setError(null);
    try {
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const url = await uploadFileToCloudinary(file, {
        folder: "gifta/items",
        resourceType,
        onProgress: setMediaUploadProgress,
      });

      setMediaInput((current) => {
        const next = [...parseImageLines(current), url];
        return next.join("\n");
      });
      setMediaUploadProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload media");
    }
  };
  const attributeDefinitions = useMemo(() => getAttributeDefinitions(attributeRows), [attributeRows]);

  const syncVariantRows = () => {
    setVariantRows((current) =>
      syncVariantRowsWithAttributes(attributeDefinitions, current, {
        salePrice: price,
        regularPrice: originalPrice,
        weight: "0",
        weightUnit: productWeightUnit,
        size: "",
        length: "",
        width: "",
        height: "",
        dimensionUnit: productDimensionUnit,
        inStock,
      }),
    );
  };

  const create = async () => {
    setSaving(true);
    setError(null);

    try {
      const syncedVariantRows = syncVariantRowsWithAttributes(attributeDefinitions, variantRows, {
        salePrice: price,
        regularPrice: originalPrice,
        weight: "0",
        weightUnit: productWeightUnit,
        size: "",
        length: "",
        width: "",
        height: "",
        dimensionUnit: productDimensionUnit,
        inStock,
      });

      const response = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          name,
          shortDescription,
          category,
          subcategory,
          description,
          disclaimerHtml,
          howToPersonaliseHtml,
          brandDetailsHtml,
          price: Number(price) || 0,
          originalPrice: Number(originalPrice) || 0,
          deliveryEtaHours: Number(deliveryEtaHours) || 24,
          minOrderQty: Number(minOrderQty) || 1,
          maxOrderQty: Number(maxOrderQty) || 10,
          tags: tags.split(",").map((entry) => entry.trim()).filter(Boolean),
          media: parseMediaInputLines(mediaInput),
          featured,
          inStock,
          ...buildProductShippingCreatePayload({
            weight: productWeight,
            weightUnit: productWeightUnit,
            length: productLength,
            width: productWidth,
            height: productHeight,
            dimensionUnit: productDimensionUnit,
          }),
          attributes: attributeDefinitions,
          variants: toVariantPayload(syncedVariantRows, attributeDefinitions),
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
        <Button><Plus className="h-4 w-4" /> Add item</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create store-linked item</DialogTitle>
          <DialogDescription>Add a detailed product record and publish its first vendor offer in one flow.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Item name"><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Rose celebration hamper" /></Field>
          <Field label="Short description"><Input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} placeholder="A concise one-line product summary" /></Field>
          <Field label="Slug preview"><div className="min-h-11 rounded-full border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">/{createSlugPreview(name) || "generated-from-name"}</div></Field>
          <Field label="Category">
            <select
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value;
                setCategory(nextCategory);
                const nextSubcategories = globalCategoryOptions.find((entry) => entry.name === nextCategory)?.subcategories ?? [];
                setSubcategory(nextSubcategories[0] ?? "");
              }}
              className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
            >
              <option value="">Select category</option>
              {safeCategoryOptions.map((entry) => (
                <option key={entry} value={entry}>{entry}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory">
            <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
              <option value="">Select subcategory</option>
              {selectedSubcategoryOptions.map((entry) => (
                <option key={`${category}-${entry}`} value={entry}>{entry}</option>
              ))}
            </select>
          </Field>
          <Field label="Store">
            {lockedStoreId ? (
              <div className="min-h-11 rounded-full border border-input bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
                {vendors.find((vendor) => vendor.id === lockedStoreId)?.name ?? lockedStoreId}
              </div>
            ) : (
              <select value={storeId} onChange={(event) => setStoreId(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
                {vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>{vendor.name}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Offer price"><Input value={price} onChange={(event) => setPrice(event.target.value)} inputMode="decimal" /></Field>
          <Field label="Original price"><Input value={originalPrice} onChange={(event) => setOriginalPrice(event.target.value)} inputMode="decimal" /></Field>
          <Field label="Delivery ETA (hours)"><Input value={deliveryEtaHours} onChange={(event) => setDeliveryEtaHours(event.target.value)} inputMode="numeric" /></Field>
          <Field label="Tags (comma separated)"><Input value={tags} onChange={(event) => setTags(event.target.value)} placeholder="gift, premium, same-day" /></Field>
          <Field label="Min order qty"><Input value={minOrderQty} onChange={(event) => setMinOrderQty(event.target.value)} inputMode="numeric" /></Field>
          <Field label="Max order qty"><Input value={maxOrderQty} onChange={(event) => setMaxOrderQty(event.target.value)} inputMode="numeric" /></Field>

          <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-base">Product package details</Label>
              <p className="text-xs text-muted-foreground">Used as the Delhivery fallback package when a variant doesn&apos;t override it.</p>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Weight">
                <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                  <Input value={productWeight} onChange={(event) => setProductWeight(event.target.value)} inputMode="decimal" placeholder="0" />
                  <select value={productWeightUnit} onChange={(event) => setProductWeightUnit((normalizeProductWeightUnit(event.target.value) ?? "g") as ProductWeightUnit)} className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm">
                    {PRODUCT_WEIGHT_UNIT_OPTIONS.map((unit) => (
                      <option key={`create-product-weight-${unit}`} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </Field>

              <Field label="Dimensions">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-3">
                  <Input value={productLength} onChange={(event) => setProductLength(event.target.value)} inputMode="decimal" placeholder="Length" />
                  <Input value={productWidth} onChange={(event) => setProductWidth(event.target.value)} inputMode="decimal" placeholder="Width" />
                  <Input value={productHeight} onChange={(event) => setProductHeight(event.target.value)} inputMode="decimal" placeholder="Height" />
                  <select value={productDimensionUnit} onChange={(event) => setProductDimensionUnit((normalizeProductDimensionUnit(event.target.value) ?? "cm") as ProductDimensionUnit)} className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm">
                    {PRODUCT_DIMENSION_UNIT_OPTIONS.map((unit) => (
                      <option key={`create-product-dimension-${unit}`} value={unit}>{unit}</option>
                    ))}
                  </select>
                </div>
              </Field>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <Label className="text-base">Attributes</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAttributeRows((current) => [...current, { id: makeLocalId("attr"), name: "", value: "" }])}
              >
                Add attributes
              </Button>
            </div>
            <div className="space-y-3">
              {attributeRows.map((row) => (
                <div key={row.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                  <Field label="Name">
                    <Input
                      value={row.name}
                      onChange={(event) =>
                        setAttributeRows((current) =>
                          current.map((entry) => (entry.id === row.id ? { ...entry, name: event.target.value } : entry)),
                        )
                      }
                      placeholder="size"
                    />
                  </Field>
                  <Field label="Value">
                    <Input
                      value={row.value}
                      onChange={(event) =>
                        setAttributeRows((current) =>
                          current.map((entry) => (entry.id === row.id ? { ...entry, value: event.target.value } : entry)),
                        )
                      }
                      placeholder="10"
                    />
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() =>
                        setAttributeRows((current) => {
                          if (current.length <= 1) {
                            return [{ id: makeLocalId("attr"), name: "", value: "" }];
                          }
                          return current.filter((entry) => entry.id !== row.id);
                        })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Label className="text-base">Variations</Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => void syncVariantRows()}>Sync with attributes</Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setVariantRows((current) => [
                      ...current,
                      {
                        id: makeLocalId("var"),
                        options: Object.fromEntries(attributeDefinitions.map((attribute) => [attribute.name, attribute.values[0] ?? ""])),
                        salePrice: price,
                        regularPrice: originalPrice,
                        weight: "0",
                          weightUnit: productWeightUnit,
                          size: "",
                          length: "",
                          width: "",
                          height: "",
                          dimensionUnit: productDimensionUnit,
                        inStock,
                      },
                    ])
                  }
                  disabled={!attributeDefinitions.length}
                >
                  Add variations
                </Button>
              </div>
            </div>

            {!attributeDefinitions.length ? <p className="text-sm text-muted-foreground">Add attributes first to build variations.</p> : null}

            <div className="space-y-4">
              {variantRows.map((variant) => (
                <div key={variant.id} className="rounded-2xl border border-border/70 bg-background/60 p-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    {attributeDefinitions.map((attribute) => (
                      <Field key={`${variant.id}-${attribute.name}`} label={attribute.name}>
                        <select
                          value={variant.options[attribute.name] ?? ""}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) =>
                                entry.id === variant.id
                                  ? {
                                      ...entry,
                                      options: {
                                        ...entry.options,
                                        [attribute.name]: event.target.value,
                                      },
                                    }
                                  : entry,
                              ),
                            )
                          }
                          className="min-h-11 w-full rounded-[1.25rem] border border-input bg-background px-4 py-2 text-sm"
                        >
                          {attribute.values.map((value) => (
                            <option key={`${variant.id}-${attribute.name}-${value}`} value={value}>{value}</option>
                          ))}
                        </select>
                      </Field>
                    ))}

                    <Field label="Weight">
                      <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                        <Input
                          value={variant.weight}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, weight: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                          placeholder="0"
                        />
                        <select
                          value={variant.weightUnit}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) =>
                                  entry.id === variant.id ? { ...entry, weightUnit: (normalizeProductWeightUnit(event.target.value) ?? "g") as ProductWeightUnit } : entry,
                              ),
                            )
                          }
                          className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm"
                        >
                            {PRODUCT_WEIGHT_UNIT_OPTIONS.map((unit) => (
                              <option key={`${variant.id}-weight-${unit}`} value={unit}>{unit}</option>
                            ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="Size">
                      <Input
                        value={variant.size}
                        onChange={(event) =>
                          setVariantRows((current) =>
                            current.map((entry) => (entry.id === variant.id ? { ...entry, size: event.target.value } : entry)),
                          )
                        }
                        placeholder="S / M / L"
                      />
                    </Field>

                    <Field label="Dimensions">
                      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-3">
                        <Input
                          value={variant.length}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, length: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                          placeholder="Length"
                        />
                        <Input
                          value={variant.width}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, width: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                          placeholder="Width"
                        />
                        <Input
                          value={variant.height}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, height: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                          placeholder="Height"
                        />
                        <select
                          value={variant.dimensionUnit}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) =>
                                  entry.id === variant.id ? { ...entry, dimensionUnit: (normalizeProductDimensionUnit(event.target.value) ?? "cm") as ProductDimensionUnit } : entry,
                              ),
                            )
                          }
                          className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm"
                        >
                            {PRODUCT_DIMENSION_UNIT_OPTIONS.map((unit) => (
                              <option key={`${variant.id}-dimension-${unit}`} value={unit}>{unit}</option>
                            ))}
                        </select>
                      </div>
                    </Field>

                    <Field label="Sale price">
                      <Input
                        value={variant.salePrice}
                        onChange={(event) =>
                          setVariantRows((current) =>
                            current.map((entry) => (entry.id === variant.id ? { ...entry, salePrice: event.target.value } : entry)),
                          )
                        }
                        inputMode="decimal"
                      />
                    </Field>

                    <Field label="Regular price">
                      <Input
                        value={variant.regularPrice}
                        onChange={(event) =>
                          setVariantRows((current) =>
                            current.map((entry) => (entry.id === variant.id ? { ...entry, regularPrice: event.target.value } : entry)),
                          )
                        }
                        inputMode="decimal"
                      />
                    </Field>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm">
                      <Checkbox
                        checked={variant.inStock}
                        onCheckedChange={(checked) =>
                          setVariantRows((current) =>
                            current.map((entry) => (entry.id === variant.id ? { ...entry, inStock: Boolean(checked) } : entry)),
                          )
                        }
                      />
                      Variant in stock
                    </label>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setVariantRows((current) => current.filter((entry) => entry.id !== variant.id))}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Media URLs (images/videos, one per line)</Label>
            <textarea value={mediaInput} onChange={(event) => setMediaInput(event.target.value)} rows={4} className="min-h-28 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" placeholder="https://..." />
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30">
              <UploadCloud className="h-3.5 w-3.5" /> Upload media
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void uploadItemMedia(file);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${mediaUploadProgress}%` }} />
            </div>
            {mediaList.length ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {mediaList.map((entry) => (
                  <div key={`${entry.type}-${entry.url}`} className="relative overflow-hidden rounded-xl border border-border">
                    <div className="relative h-24 w-full bg-muted/20">
                      <Image src={entry.type === "video" ? (entry.thumbnailUrl || entry.url) : entry.url} alt="Item media" fill className="object-cover" sizes="160px" />
                      {entry.type === "video" ? <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">VIDEO</div> : null}
                    </div>
                    <button
                      type="button"
                      className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                      onClick={() => setMediaInput((current) => parseImageLines(current).filter((url) => url !== entry.url).join("\n"))}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
            <Checkbox checked={featured} onCheckedChange={(checked) => setFeatured(Boolean(checked))} /> Feature this item
          </label>
          <label className="flex items-center gap-3 rounded-[1.25rem] border border-border bg-background px-4 py-3 text-sm">
            <Checkbox checked={inStock} onCheckedChange={(checked) => setInStock(Boolean(checked))} /> Offer is active and in stock
          </label>
          <div className="space-y-2 md:col-span-2">
            <RichTextEditor
              label="Description"
              value={description}
              onChange={setDescription}
              placeholder="Describe packaging, contents, and gifting use case."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <RichTextEditor
              label="Disclaimer"
              value={disclaimerHtml}
              onChange={setDisclaimerHtml}
              placeholder="Add product-specific legal or usage disclaimer."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <RichTextEditor
              label="How To Personalise"
              value={howToPersonaliseHtml}
              onChange={setHowToPersonaliseHtml}
              placeholder="Guide users on how to submit names, photos, or custom text."
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <RichTextEditor
              label="Brand Details"
              value={brandDetailsHtml}
              onChange={setBrandDetailsHtml}
              placeholder="Share brand story, craftsmanship, and packaging details."
            />
          </div>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => void create()} disabled={saving || !storeId || !name.trim() || !category.trim()}>{saving ? "Creating..." : "Create item"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ItemRowActions({
  item,
  vendors,
  globalCategories,
}: {
  item: AdminItem;
  vendors: VendorSummaryDto[];
  globalCategories: StoreCategoryOption[];
}) {
  const router = useRouter();
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [name, setName] = useState(item.name);
  const [category, setCategory] = useState(item.category);
  const [subcategory, setSubcategory] = useState(item.subcategory ?? "");
  const [shortDescription, setShortDescription] = useState(item.shortDescription ?? "");
  const [description, setDescription] = useState(item.description);
  const [disclaimerHtml, setDisclaimerHtml] = useState(item.disclaimerHtml ?? "<p></p>");
  const [howToPersonaliseHtml, setHowToPersonaliseHtml] = useState(item.howToPersonaliseHtml ?? "<p></p>");
  const [brandDetailsHtml, setBrandDetailsHtml] = useState(item.brandDetailsHtml ?? "<p></p>");
  const [tags, setTags] = useState((item.tags ?? []).join(", "));
  const [mediaInput, setMediaInput] = useState(() => toMediaInputLines(item.media, item.images));
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [attributeRows, setAttributeRows] = useState<AttributeInputRow[]>(() => toAttributeRows(item.attributes));
  const [variantRows, setVariantRows] = useState<VariantInputRow[]>(() => toVariantRows(item.variants));
  const [featured, setFeatured] = useState(Boolean(item.featured));
  const [productInStock, setProductInStock] = useState(item.inStock);
  const [minOrderQty, setMinOrderQty] = useState(String(item.minOrderQty ?? 1));
  const [maxOrderQty, setMaxOrderQty] = useState(String(item.maxOrderQty ?? 10));
  const [productWeight, setProductWeight] = useState(String(item.weight ?? ""));
  const [productWeightUnit, setProductWeightUnit] = useState<ProductWeightUnit>(item.weightUnit ?? "g");
  const [productLength, setProductLength] = useState(String(item.length ?? ""));
  const [productWidth, setProductWidth] = useState(String(item.width ?? ""));
  const [productHeight, setProductHeight] = useState(String(item.height ?? ""));
  const [productDimensionUnit, setProductDimensionUnit] = useState<ProductDimensionUnit>(item.dimensionUnit ?? "cm");

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

  const globalCategoryOptions = useMemo(() => toNormalizedGlobalCategoryOptions(globalCategories), [globalCategories]);
  const safeCategoryOptions = useMemo(() => globalCategoryOptions.map((entry) => entry.name), [globalCategoryOptions]);
  const selectedSubcategoryOptions = useMemo(
    () => globalCategoryOptions.find((entry) => entry.name === category)?.subcategories ?? [],
    [category, globalCategoryOptions],
  );

  const mediaList = useMemo(() => parseMediaInputLines(mediaInput), [mediaInput]);

  const uploadItemMedia = async (file: File) => {
    setError(null);
    try {
      const resourceType = file.type.startsWith("video/") ? "video" : "image";
      const url = await uploadFileToCloudinary(file, {
        folder: "gifta/items",
        resourceType,
        onProgress: setMediaUploadProgress,
      });

      setMediaInput((current) => {
        const next = [...parseImageLines(current), url];
        return next.join("\n");
      });
      setMediaUploadProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload media");
    }
  };
  const attributeDefinitions = useMemo(() => getAttributeDefinitions(attributeRows), [attributeRows]);

  const syncVariantRows = () => {
    setVariantRows((current) =>
      syncVariantRowsWithAttributes(attributeDefinitions, current, {
        salePrice: offerPrice,
        regularPrice: originalPrice,
        weight: "0",
        weightUnit: productWeightUnit,
        size: "",
        length: "",
        width: "",
        height: "",
        dimensionUnit: productDimensionUnit,
        inStock: offerInStock,
      }),
    );
  };

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
      const syncedVariantRows = syncVariantRowsWithAttributes(attributeDefinitions, variantRows, {
        salePrice: offerPrice,
        regularPrice: originalPrice,
        weight: "0",
        weightUnit: productWeightUnit,
        size: "",
        length: "",
        width: "",
        height: "",
        dimensionUnit: productDimensionUnit,
        inStock: offerInStock,
      });

      const primary = await fetch(`/api/admin/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          shortDescription,
          description,
          disclaimerHtml,
          howToPersonaliseHtml,
          brandDetailsHtml,
          category,
          subcategory,
          price: Number(offerPrice) || 0,
          inStock: productInStock,
          featured,
          tags: tags.split(",").map((entry) => entry.trim()).filter(Boolean),
          media: parseMediaInputLines(mediaInput),
          offerStoreId,
          offerPrice: Number(offerPrice) || 0,
          originalPrice: Number(originalPrice) || 0,
          deliveryEtaHours: Number(deliveryEtaHours) || 24,
          offerInStock,
          ...buildProductShippingUpdatePayload({
            weight: productWeight,
            weightUnit: productWeightUnit,
            length: productLength,
            width: productWidth,
            height: productHeight,
            dimensionUnit: productDimensionUnit,
          }),
          attributes: attributeDefinitions,
          variants: toVariantPayload(syncedVariantRows, attributeDefinitions),
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
        <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> Show more</Button></DialogTrigger>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{item.name}</DialogTitle>
            <DialogDescription>Catalog record, all product text fields, and linked store offers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Category" value={item.category} />
              <Info label="Subcategory" value={item.subcategory || "--"} />
              <Info label="Qty range" value={`${item.minOrderQty ?? 1} to ${item.maxOrderQty ?? 10}`} />
              <Info label="Slug" value={item.slug} />
              <Info label="Best offer" value={formatCurrency(item.bestOffer?.price)} />
            </div>

            <div className="space-y-3">
              <TextSection label="Short description" value={item.shortDescription} />
              <RichTextSection label="Description" value={item.description} />
              <RichTextSection label="How To Personalise" value={item.howToPersonaliseHtml ?? ""} />
              <RichTextSection label="Brand Details" value={item.brandDetailsHtml ?? ""} />
              <RichTextSection label="Disclaimer" value={item.disclaimerHtml ?? ""} />
            </div>

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
            <Field label="Short description"><Input value={shortDescription} onChange={(event) => setShortDescription(event.target.value)} /></Field>
            <Field label="Category">
              <select
                value={category}
                onChange={(event) => {
                  const nextCategory = event.target.value;
                  setCategory(nextCategory);
                  const nextSubcategories = globalCategoryOptions.find((entry) => entry.name === nextCategory)?.subcategories ?? [];
                  setSubcategory(nextSubcategories[0] ?? "");
                }}
                className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm"
              >
                <option value="">Select category</option>
                {safeCategoryOptions.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
            </Field>
            <Field label="Subcategory">
              <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="min-h-11 w-full rounded-full border border-input bg-background px-4 py-2 text-sm">
                <option value="">Select subcategory</option>
                {selectedSubcategoryOptions.map((entry) => (
                  <option key={`${category}-${entry}`} value={entry}>{entry}</option>
                ))}
              </select>
            </Field>
            <Field label="Tags (comma separated)"><Input value={tags} onChange={(event) => setTags(event.target.value)} /></Field>
            <div className="space-y-2">
              <Label>Media URLs (images/videos)</Label>
              <textarea value={mediaInput} onChange={(event) => setMediaInput(event.target.value)} rows={3} className="min-h-24 w-full rounded-[1.25rem] border border-input bg-background px-4 py-3 text-sm outline-none transition focus:border-primary/40" />
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/30">
                <UploadCloud className="h-3.5 w-3.5" /> Upload media
                <input
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void uploadItemMedia(file);
                    event.currentTarget.value = "";
                  }}
                />
              </label>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${mediaUploadProgress}%` }} />
              </div>
              {mediaList.length ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  {mediaList.map((entry) => (
                    <div key={`${entry.type}-${entry.url}`} className="relative overflow-hidden rounded-xl border border-border">
                      <div className="relative h-24 w-full bg-muted/20">
                        <Image src={entry.type === "video" ? (entry.thumbnailUrl || entry.url) : entry.url} alt="Item media" fill className="object-cover" sizes="160px" />
                        {entry.type === "video" ? <div className="absolute right-1.5 top-1.5 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white">VIDEO</div> : null}
                      </div>
                      <button
                        type="button"
                        className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white"
                        onClick={() => setMediaInput((current) => parseImageLines(current).filter((url) => url !== entry.url).join("\n"))}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
            <Field label="Min order qty"><Input value={minOrderQty} onChange={(event) => setMinOrderQty(event.target.value)} inputMode="numeric" /></Field>
            <Field label="Max order qty"><Input value={maxOrderQty} onChange={(event) => setMaxOrderQty(event.target.value)} inputMode="numeric" /></Field>

            <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base">Product package details</Label>
                <p className="text-xs text-muted-foreground">Used as the Delhivery fallback package when a variant doesn&apos;t override it.</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Weight">
                  <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                    <Input value={productWeight} onChange={(event) => setProductWeight(event.target.value)} inputMode="decimal" placeholder="0" />
                    <select value={productWeightUnit} onChange={(event) => setProductWeightUnit((normalizeProductWeightUnit(event.target.value) ?? "g") as ProductWeightUnit)} className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm">
                      {PRODUCT_WEIGHT_UNIT_OPTIONS.map((unit) => (
                        <option key={`edit-product-weight-${unit}`} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field label="Dimensions">
                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-3">
                    <Input value={productLength} onChange={(event) => setProductLength(event.target.value)} inputMode="decimal" placeholder="Length" />
                    <Input value={productWidth} onChange={(event) => setProductWidth(event.target.value)} inputMode="decimal" placeholder="Width" />
                    <Input value={productHeight} onChange={(event) => setProductHeight(event.target.value)} inputMode="decimal" placeholder="Height" />
                    <select value={productDimensionUnit} onChange={(event) => setProductDimensionUnit((normalizeProductDimensionUnit(event.target.value) ?? "cm") as ProductDimensionUnit)} className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm">
                      {PRODUCT_DIMENSION_UNIT_OPTIONS.map((unit) => (
                        <option key={`edit-product-dimension-${unit}`} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <Label className="text-base">Attributes</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAttributeRows((current) => [...current, { id: makeLocalId("attr"), name: "", value: "" }])}
                >
                  Add attributes
                </Button>
              </div>
              <div className="space-y-3">
                {attributeRows.map((row) => (
                  <div key={row.id} className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <Field label="Name">
                      <Input
                        value={row.name}
                        onChange={(event) =>
                          setAttributeRows((current) =>
                            current.map((entry) => (entry.id === row.id ? { ...entry, name: event.target.value } : entry)),
                          )
                        }
                        placeholder="size"
                      />
                    </Field>
                    <Field label="Value">
                      <Input
                        value={row.value}
                        onChange={(event) =>
                          setAttributeRows((current) =>
                            current.map((entry) => (entry.id === row.id ? { ...entry, value: event.target.value } : entry)),
                          )
                        }
                        placeholder="10"
                      />
                    </Field>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() =>
                          setAttributeRows((current) => {
                            if (current.length <= 1) {
                              return [{ id: makeLocalId("attr"), name: "", value: "" }];
                            }
                            return current.filter((entry) => entry.id !== row.id);
                          })
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-[1.25rem] border border-border/70 bg-card/40 p-4 md:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Label className="text-base">Variations</Label>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void syncVariantRows()}>Sync with attributes</Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setVariantRows((current) => [
                        ...current,
                        {
                          id: makeLocalId("var"),
                          options: Object.fromEntries(attributeDefinitions.map((attribute) => [attribute.name, attribute.values[0] ?? ""])),
                          salePrice: offerPrice,
                          regularPrice: originalPrice,
                          weight: "0",
                          weightUnit: productWeightUnit,
                          size: "",
                          length: "",
                          width: "",
                          height: "",
                          dimensionUnit: productDimensionUnit,
                          inStock: offerInStock,
                        },
                      ])
                    }
                    disabled={!attributeDefinitions.length}
                  >
                    Add variations
                  </Button>
                </div>
              </div>

              {!attributeDefinitions.length ? <p className="text-sm text-muted-foreground">Add attributes first to build variations.</p> : null}

              <div className="space-y-4">
                {variantRows.map((variant) => (
                  <div key={variant.id} className="rounded-2xl border border-border/70 bg-background/60 p-3">
                    <div className="grid gap-3 md:grid-cols-2">
                      {attributeDefinitions.map((attribute) => (
                        <Field key={`${variant.id}-${attribute.name}`} label={attribute.name}>
                          <select
                            value={variant.options[attribute.name] ?? ""}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) =>
                                  entry.id === variant.id
                                    ? {
                                        ...entry,
                                        options: {
                                          ...entry.options,
                                          [attribute.name]: event.target.value,
                                        },
                                      }
                                    : entry,
                                ),
                              )
                            }
                            className="min-h-11 w-full rounded-[1.25rem] border border-input bg-background px-4 py-2 text-sm"
                          >
                            {attribute.values.map((value) => (
                              <option key={`${variant.id}-${attribute.name}-${value}`} value={value}>{value}</option>
                            ))}
                          </select>
                        </Field>
                      ))}

                      <Field label="Weight">
                        <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-3">
                          <Input
                            value={variant.weight}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) => (entry.id === variant.id ? { ...entry, weight: event.target.value } : entry)),
                              )
                            }
                            inputMode="decimal"
                            placeholder="0"
                          />
                          <select
                            value={variant.weightUnit}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) =>
                                    entry.id === variant.id ? { ...entry, weightUnit: (normalizeProductWeightUnit(event.target.value) ?? "g") as ProductWeightUnit } : entry,
                                ),
                              )
                            }
                            className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm"
                          >
                              {PRODUCT_WEIGHT_UNIT_OPTIONS.map((unit) => (
                                <option key={`${variant.id}-edit-weight-${unit}`} value={unit}>{unit}</option>
                              ))}
                          </select>
                        </div>
                      </Field>

                      <Field label="Size">
                        <Input
                          value={variant.size}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, size: event.target.value } : entry)),
                            )
                          }
                          placeholder="S / M / L"
                        />
                      </Field>

                      <Field label="Dimensions">
                        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_80px] gap-3">
                          <Input
                            value={variant.length}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) => (entry.id === variant.id ? { ...entry, length: event.target.value } : entry)),
                              )
                            }
                            inputMode="decimal"
                            placeholder="Length"
                          />
                          <Input
                            value={variant.width}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) => (entry.id === variant.id ? { ...entry, width: event.target.value } : entry)),
                              )
                            }
                            inputMode="decimal"
                            placeholder="Width"
                          />
                          <Input
                            value={variant.height}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) => (entry.id === variant.id ? { ...entry, height: event.target.value } : entry)),
                              )
                            }
                            inputMode="decimal"
                            placeholder="Height"
                          />
                          <select
                            value={variant.dimensionUnit}
                            onChange={(event) =>
                              setVariantRows((current) =>
                                current.map((entry) =>
                                    entry.id === variant.id ? { ...entry, dimensionUnit: (normalizeProductDimensionUnit(event.target.value) ?? "cm") as ProductDimensionUnit } : entry,
                                ),
                              )
                            }
                            className="min-h-11 rounded-[1.25rem] border border-input bg-background px-3 py-2 text-sm"
                          >
                              {PRODUCT_DIMENSION_UNIT_OPTIONS.map((unit) => (
                                <option key={`${variant.id}-edit-dimension-${unit}`} value={unit}>{unit}</option>
                              ))}
                          </select>
                        </div>
                      </Field>

                      <Field label="Sale price">
                        <Input
                          value={variant.salePrice}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, salePrice: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                        />
                      </Field>

                      <Field label="Regular price">
                        <Input
                          value={variant.regularPrice}
                          onChange={(event) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, regularPrice: event.target.value } : entry)),
                            )
                          }
                          inputMode="decimal"
                        />
                      </Field>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                      <label className="flex items-center gap-3 rounded-2xl border border-border bg-background px-3 py-2 text-sm">
                        <Checkbox
                          checked={variant.inStock}
                          onCheckedChange={(checked) =>
                            setVariantRows((current) =>
                              current.map((entry) => (entry.id === variant.id ? { ...entry, inStock: Boolean(checked) } : entry)),
                            )
                          }
                        />
                        Variant in stock
                      </label>

                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => setVariantRows((current) => current.filter((entry) => entry.id !== variant.id))}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

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
            <div className="space-y-2 md:col-span-2">
              <RichTextEditor
                label="Description"
                value={description}
                onChange={setDescription}
                placeholder="Describe packaging, contents, and gifting use case."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <RichTextEditor
                label="Disclaimer"
                value={disclaimerHtml}
                onChange={setDisclaimerHtml}
                placeholder="Add product-specific legal or usage disclaimer."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <RichTextEditor
                label="How To Personalise"
                value={howToPersonaliseHtml}
                onChange={setHowToPersonaliseHtml}
                placeholder="Guide users on how to submit names, photos, or custom text."
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <RichTextEditor
                label="Brand Details"
                value={brandDetailsHtml}
                onChange={setBrandDetailsHtml}
                placeholder="Share brand story, craftsmanship, and packaging details."
              />
            </div>
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
            <Button onClick={() => void save()} disabled={saving || !category.trim()}>{saving ? "Saving..." : "Save changes"}</Button>
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

function TextSection({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-background/60 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm leading-6 text-foreground">{value?.trim() ? value : "Not provided."}</p>
    </div>
  );
}

function RichTextSection({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.2rem] border border-border/70 bg-background/60 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
      <div
        className="prose prose-sm mt-3 max-w-none text-[#1f1f1f] leading-7 prose-p:text-[#5f5047] prose-li:text-[#5f5047] prose-strong:text-[#3a2a22]"
        dangerouslySetInnerHTML={{ __html: renderRichHtml(value) }}
      />
    </div>
  );
}

function RichTextPreview({ value }: { value: string }) {
  return (
    <div
      className="prose prose-sm line-clamp-10 max-w-none text-sm leading-6 text-[#5f5047] prose-p:text-[#5f5047] prose-li:text-[#5f5047] prose-strong:text-[#3a2a22]"
      dangerouslySetInnerHTML={{ __html: renderRichHtml(value) }}
    />
  );
}

function renderRichHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '<p class="text-sm text-muted-foreground">Not provided.</p>';
  }

  if (/[<>]/.test(trimmed)) {
    return trimmed;
  }

  return `<p>${escapeHtml(trimmed)}</p>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function makeLocalId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function toAttributeRows(attributes: AdminItemAttribute[] | undefined): AttributeInputRow[] {
  const rows = (attributes ?? []).flatMap((attribute) =>
    attribute.values.map((value) => ({
      id: makeLocalId("attr"),
      name: attribute.name,
      value,
    })),
  );

  return rows.length ? rows : [{ id: makeLocalId("attr"), name: "", value: "" }];
}

function toVariantRows(variants: AdminItemVariant[] | undefined): VariantInputRow[] {
  return (variants ?? []).map((variant) => ({
    id: variant.id,
    options: variant.options ?? {},
    salePrice: String(variant.salePrice ?? 0),
    regularPrice: String(variant.regularPrice ?? ""),
    weight: String(variant.weight ?? ""),
    weightUnit: variant.weightUnit ?? "g",
    size: variant.size ?? (variant.options?.size ?? ""),
    length: String(variant.length ?? ""),
    width: String(variant.width ?? ""),
    height: String(variant.height ?? ""),
    dimensionUnit: variant.dimensionUnit ?? "cm",
    inStock: variant.inStock,
  }));
}

function getAttributeDefinitions(rows: AttributeInputRow[]): AdminItemAttribute[] {
  const map = new Map<string, Set<string>>();
  for (const row of rows) {
    const name = row.name.trim();
    const value = row.value.trim();
    if (!name || !value) {
      continue;
    }
    if (!map.has(name)) {
      map.set(name, new Set());
    }
    map.get(name)?.add(value);
  }

  return Array.from(map.entries()).map(([name, values]) => ({
    name,
    values: Array.from(values),
  }));
}

function buildVariantSignature(options: Record<string, string>, attributes: AdminItemAttribute[]) {
  return attributes.map((attribute) => `${attribute.name}:${options[attribute.name] ?? ""}`).join("|");
}

function getAttributeCombinations(attributes: AdminItemAttribute[]): Array<Record<string, string>> {
  if (!attributes.length) {
    return [];
  }

  let combinations: Array<Record<string, string>> = [{}];
  for (const attribute of attributes) {
    const next: Array<Record<string, string>> = [];
    for (const existing of combinations) {
      for (const value of attribute.values) {
        next.push({ ...existing, [attribute.name]: value });
      }
    }
    combinations = next;
  }
  return combinations;
}

function syncVariantRowsWithAttributes(
  attributes: AdminItemAttribute[],
  existing: VariantInputRow[],
  defaults: {
    salePrice: string;
    regularPrice: string;
    weight: string;
    weightUnit: ProductWeightUnit;
    size: string;
    length: string;
    width: string;
    height: string;
    dimensionUnit: ProductDimensionUnit;
    inStock: boolean;
  },
) {
  if (!attributes.length) {
    return [] as VariantInputRow[];
  }

  const existingBySignature = new Map(
    existing.map((entry) => [buildVariantSignature(entry.options, attributes), entry]),
  );

  return getAttributeCombinations(attributes).map((options) => {
    const signature = buildVariantSignature(options, attributes);
    const previous = existingBySignature.get(signature);
    return {
      id: previous?.id ?? makeLocalId("var"),
      options,
      salePrice: previous?.salePrice ?? defaults.salePrice,
      regularPrice: previous?.regularPrice ?? defaults.regularPrice,
      weight: previous?.weight ?? defaults.weight,
      weightUnit: previous?.weightUnit ?? defaults.weightUnit,
      size: previous?.size ?? defaults.size,
      length: previous?.length ?? defaults.length,
      width: previous?.width ?? defaults.width,
      height: previous?.height ?? defaults.height,
      dimensionUnit: previous?.dimensionUnit ?? defaults.dimensionUnit,
      inStock: previous?.inStock ?? defaults.inStock,
    };
  });
}

function toVariantPayload(rows: VariantInputRow[], attributes: AdminItemAttribute[]): AdminItemVariant[] {
  const signatures = new Set<string>();
  const output: AdminItemVariant[] = [];

  for (const row of rows) {
    if (!attributes.length) {
      continue;
    }

    const options: Record<string, string> = {};
    let valid = true;
    for (const attribute of attributes) {
      const selected = row.options[attribute.name];
      if (!selected || !attribute.values.includes(selected)) {
        valid = false;
        break;
      }
      options[attribute.name] = selected;
    }

    if (!valid) {
      continue;
    }

    const salePrice = Number(row.salePrice);
    if (!Number.isFinite(salePrice)) {
      continue;
    }

    const signature = buildVariantSignature(options, attributes);
    if (signatures.has(signature)) {
      continue;
    }
    signatures.add(signature);

    const regularPriceNumber = row.regularPrice.trim() ? Number(row.regularPrice) : undefined;
    const weightNumber = row.weight.trim() ? Number(row.weight) : undefined;
    const lengthNumber = row.length.trim() ? Number(row.length) : undefined;
    const widthNumber = row.width.trim() ? Number(row.width) : undefined;
    const heightNumber = row.height.trim() ? Number(row.height) : undefined;
    const size = row.size.trim();
    const normalizedLength = typeof lengthNumber === "number" && Number.isFinite(lengthNumber) ? Math.max(0, lengthNumber) : undefined;
    const normalizedWidth = typeof widthNumber === "number" && Number.isFinite(widthNumber) ? Math.max(0, widthNumber) : undefined;
    const normalizedHeight = typeof heightNumber === "number" && Number.isFinite(heightNumber) ? Math.max(0, heightNumber) : undefined;
    const hasDimensions = normalizedLength !== undefined || normalizedWidth !== undefined || normalizedHeight !== undefined;

    output.push({
      id: row.id,
      options,
      salePrice: Math.max(0, salePrice),
      regularPrice: typeof regularPriceNumber === "number" && Number.isFinite(regularPriceNumber) ? Math.max(0, regularPriceNumber) : undefined,
      weight: typeof weightNumber === "number" && Number.isFinite(weightNumber) ? Math.max(0, weightNumber) : undefined,
      weightUnit: row.weightUnit,
      ...(size ? { size } : {}),
      ...(normalizedLength !== undefined ? { length: normalizedLength } : {}),
      ...(normalizedWidth !== undefined ? { width: normalizedWidth } : {}),
      ...(normalizedHeight !== undefined ? { height: normalizedHeight } : {}),
      ...(hasDimensions ? { dimensionUnit: row.dimensionUnit } : {}),
      inStock: row.inStock,
    });
  }

  return output;
}

function buildProductShippingCreatePayload(input: {
  weight: string;
  weightUnit: ProductWeightUnit;
  length: string;
  width: string;
  height: string;
  dimensionUnit: ProductDimensionUnit;
}) {
  const weight = normalizeCreateShippingValue(input.weight);
  const length = normalizeCreateShippingValue(input.length);
  const width = normalizeCreateShippingValue(input.width);
  const height = normalizeCreateShippingValue(input.height);
  const hasDimensions = length !== undefined || width !== undefined || height !== undefined;

  return {
    ...(weight !== undefined ? { weight, weightUnit: input.weightUnit } : {}),
    ...(length !== undefined ? { length } : {}),
    ...(width !== undefined ? { width } : {}),
    ...(height !== undefined ? { height } : {}),
    ...(hasDimensions ? { dimensionUnit: input.dimensionUnit } : {}),
  };
}

function buildProductShippingUpdatePayload(input: {
  weight: string;
  weightUnit: ProductWeightUnit;
  length: string;
  width: string;
  height: string;
  dimensionUnit: ProductDimensionUnit;
}) {
  const weight = normalizeUpdateShippingValue(input.weight);
  const length = normalizeUpdateShippingValue(input.length);
  const width = normalizeUpdateShippingValue(input.width);
  const height = normalizeUpdateShippingValue(input.height);
  const hasDimensions = length !== "" || width !== "" || height !== "";

  return {
    weight,
    weightUnit: weight !== "" ? input.weightUnit : "",
    length,
    width,
    height,
    dimensionUnit: hasDimensions ? input.dimensionUnit : "",
  };
}

function normalizeCreateShippingValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeUpdateShippingValue(value: string) {
  return value.trim();
}

function normalizeCsvToken(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildAutoCsvMapping(headers: string[]): CsvColumnMapping {
  const mapped: CsvColumnMapping = {};
  const normalizedHeaders = headers.map((header) => ({
    header,
    token: normalizeCsvToken(header),
  }));
  const usedHeaders = new Set<string>();

  for (const field of CSV_FIELD_DEFINITIONS) {
    const aliasTokens = field.aliases.map((alias) => normalizeCsvToken(alias));
    const exact = normalizedHeaders.find((entry) => !usedHeaders.has(entry.header) && aliasTokens.includes(entry.token));
    const loose = exact
      ? undefined
      : normalizedHeaders.find(
        (entry) =>
          !usedHeaders.has(entry.header)
          && aliasTokens.some((token) => entry.token.startsWith(token) || entry.token.includes(token)),
      );

    const matched = exact ?? loose;
    if (!matched) {
      continue;
    }

    mapped[field.key] = matched.header;
    usedHeaders.add(matched.header);
  }

  return mapped;
}

function parseCsvContent(content: string): {
  headers: string[];
  rows: CsvImportRow[];
  error?: string;
} {
  const source = content.replace(/^\uFEFF/, "");
  if (!source.trim()) {
    return {
      headers: [],
      rows: [],
      error: "CSV file is empty",
    };
  }

  const records: string[][] = [];
  let currentCell = "";
  let currentRow: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (char === '"') {
      const next = source[index + 1];
      if (inQuotes && next === '"') {
        currentCell += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if (!inQuotes && (char === "\n" || char === "\r")) {
      if (char === "\r" && source[index + 1] === "\n") {
        index += 1;
      }
      currentRow.push(currentCell);
      records.push(currentRow);
      currentCell = "";
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (inQuotes) {
    return {
      headers: [],
      rows: [],
      error: "CSV appears malformed due to an unclosed quoted value",
    };
  }

  if (currentCell.length || currentRow.length) {
    currentRow.push(currentCell);
    records.push(currentRow);
  }

  if (!records.length) {
    return {
      headers: [],
      rows: [],
      error: "CSV file has no parsable records",
    };
  }

  const headers = records[0].map((entry, index) => {
    const trimmed = entry.trim();
    return trimmed || `column_${index + 1}`;
  });

  if (!headers.some((header) => header.trim())) {
    return {
      headers: [],
      rows: [],
      error: "CSV header row is missing",
    };
  }

  const rows: CsvImportRow[] = records
    .slice(1)
    .map((record) => {
      const row: CsvImportRow = {};
      headers.forEach((header, index) => {
        row[header] = (record[index] ?? "").trim();
      });
      return row;
    })
    .filter((row) => Object.values(row).some((value) => value.trim().length > 0));

  if (!rows.length) {
    return {
      headers,
      rows: [],
      error: "CSV contains header columns but no data rows",
    };
  }

  return { headers, rows };
}

function getMappedCsvValue(row: CsvImportRow, mapping: CsvColumnMapping, field: CsvCanonicalField) {
  const mappedHeader = mapping[field];
  if (!mappedHeader) {
    return "";
  }
  return (row[mappedHeader] ?? "").trim();
}

function splitDelimitedValues(value: string, splitOnComma = false) {
  if (!value.trim()) {
    return [] as string[];
  }

  const separator = splitOnComma ? /[\n\r|;,]+/ : /[\n\r|;]+/;
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function parseNumberValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

function parseBooleanValue(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (["1", "true", "yes", "y", "active", "live", "in-stock", "instock"].includes(normalized)) {
    return true;
  }

  if (["0", "false", "no", "n", "inactive", "paused", "out-of-stock", "outofstock"].includes(normalized)) {
    return false;
  }

  return undefined;
}

function parseWeightUnit(value: string): ProductWeightUnit | undefined {
  return normalizeProductWeightUnit(value);
}

function parseDimensionUnit(value: string): ProductDimensionUnit | undefined {
  return normalizeProductDimensionUnit(value);
}

function toCsvImportItems(input: {
  rows: CsvImportRow[];
  mapping: CsvColumnMapping;
  lockedStoreId?: string;
}): {
  items: CsvPreparedItem[];
  failures: CsvImportFailure[];
} {
  const failures: CsvImportFailure[] = [];
  const grouped = new Map<string, {
    key: string;
    rowNumbers: number[];
    payload: AdminItemCreatePayload;
    sizeValues: Set<string>;
    variantSignatures: Set<string>;
    tagValues: Set<string>;
    mediaUrlValues: Set<string>;
  }>();

  for (let index = 0; index < input.rows.length; index += 1) {
    const row = input.rows[index];
    const rowNumber = index + 2;

    const storeId = input.lockedStoreId ?? getMappedCsvValue(row, input.mapping, "storeId");
    const name = getMappedCsvValue(row, input.mapping, "name");
    const category = getMappedCsvValue(row, input.mapping, "category");
    const subcategory = getMappedCsvValue(row, input.mapping, "subcategory");
    const shortDescription = getMappedCsvValue(row, input.mapping, "shortDescription");
    const description = getMappedCsvValue(row, input.mapping, "description");
    const disclaimerHtml = getMappedCsvValue(row, input.mapping, "disclaimerHtml");
    const howToPersonaliseHtml = getMappedCsvValue(row, input.mapping, "howToPersonaliseHtml");
    const brandDetailsHtml = getMappedCsvValue(row, input.mapping, "brandDetailsHtml");
    const priceRaw = getMappedCsvValue(row, input.mapping, "price");
    const originalPriceRaw = getMappedCsvValue(row, input.mapping, "originalPrice");
    const deliveryEtaRaw = getMappedCsvValue(row, input.mapping, "deliveryEtaHours");
    const minQtyRaw = getMappedCsvValue(row, input.mapping, "minOrderQty");
    const maxQtyRaw = getMappedCsvValue(row, input.mapping, "maxOrderQty");
    const featuredRaw = getMappedCsvValue(row, input.mapping, "featured");
    const inStockRaw = getMappedCsvValue(row, input.mapping, "inStock");
    const tagsRaw = getMappedCsvValue(row, input.mapping, "tags");
    const mediaRaw = getMappedCsvValue(row, input.mapping, "media");

    const variantIdRaw = getMappedCsvValue(row, input.mapping, "variantId");
    const variantSize = getMappedCsvValue(row, input.mapping, "variantSize");
    const variantSaleRaw = getMappedCsvValue(row, input.mapping, "variantSalePrice");
    const variantRegularRaw = getMappedCsvValue(row, input.mapping, "variantRegularPrice");
    const variantWeightRaw = getMappedCsvValue(row, input.mapping, "variantWeight");
    const variantWeightUnitRaw = getMappedCsvValue(row, input.mapping, "variantWeightUnit");
    const variantLengthRaw = getMappedCsvValue(row, input.mapping, "variantLength");
    const variantWidthRaw = getMappedCsvValue(row, input.mapping, "variantWidth");
    const variantHeightRaw = getMappedCsvValue(row, input.mapping, "variantHeight");
    const variantDimensionUnitRaw = getMappedCsvValue(row, input.mapping, "variantDimensionUnit");

    if (!storeId) {
      failures.push({ rowNumber, message: "Missing storeId" });
      continue;
    }

    if (!name) {
      failures.push({ rowNumber, message: "Missing item name" });
      continue;
    }

    if (!category) {
      failures.push({ rowNumber, message: "Missing category" });
      continue;
    }

    const price = parseNumberValue(priceRaw);
    if (price === undefined) {
      failures.push({ rowNumber, message: "Missing or invalid price" });
      continue;
    }

    const originalPrice = originalPriceRaw ? parseNumberValue(originalPriceRaw) : undefined;
    if (originalPriceRaw && originalPrice === undefined) {
      failures.push({ rowNumber, message: "Invalid originalPrice" });
      continue;
    }

    const deliveryEtaHours = deliveryEtaRaw ? parseNumberValue(deliveryEtaRaw) : undefined;
    if (deliveryEtaRaw && deliveryEtaHours === undefined) {
      failures.push({ rowNumber, message: "Invalid deliveryEtaHours" });
      continue;
    }

    const minOrderQty = minQtyRaw ? parseNumberValue(minQtyRaw) : undefined;
    if (minQtyRaw && minOrderQty === undefined) {
      failures.push({ rowNumber, message: "Invalid minOrderQty" });
      continue;
    }

    const maxOrderQty = maxQtyRaw ? parseNumberValue(maxQtyRaw) : undefined;
    if (maxQtyRaw && maxOrderQty === undefined) {
      failures.push({ rowNumber, message: "Invalid maxOrderQty" });
      continue;
    }

    const featured = featuredRaw ? parseBooleanValue(featuredRaw) : undefined;
    if (featuredRaw && featured === undefined) {
      failures.push({ rowNumber, message: "Invalid featured value" });
      continue;
    }

    const inStock = inStockRaw ? parseBooleanValue(inStockRaw) : undefined;
    if (inStockRaw && inStock === undefined) {
      failures.push({ rowNumber, message: "Invalid inStock value" });
      continue;
    }

    const mediaUrls = splitDelimitedValues(mediaRaw, true);

    const hasVariantValues = Boolean(
      variantIdRaw
      || variantSize
      || variantSaleRaw
      || variantRegularRaw
      || variantWeightRaw
      || variantWeightUnitRaw
      || variantLengthRaw
      || variantWidthRaw
      || variantHeightRaw
      || variantDimensionUnitRaw,
    );

    if (hasVariantValues && !variantSize) {
      failures.push({ rowNumber, message: "variantSize is required when variant fields are provided" });
      continue;
    }

    const variantSale = hasVariantValues
      ? (variantSaleRaw ? parseNumberValue(variantSaleRaw) : price)
      : undefined;
    if (hasVariantValues && variantSale === undefined) {
      failures.push({ rowNumber, message: "Invalid variantSalePrice" });
      continue;
    }

    const variantRegular = variantRegularRaw ? parseNumberValue(variantRegularRaw) : undefined;
    if (variantRegularRaw && variantRegular === undefined) {
      failures.push({ rowNumber, message: "Invalid variantRegularPrice" });
      continue;
    }

    const variantWeight = variantWeightRaw ? parseNumberValue(variantWeightRaw) : undefined;
    if (variantWeightRaw && variantWeight === undefined) {
      failures.push({ rowNumber, message: "Invalid variantWeight" });
      continue;
    }

    const variantLength = variantLengthRaw ? parseNumberValue(variantLengthRaw) : undefined;
    if (variantLengthRaw && variantLength === undefined) {
      failures.push({ rowNumber, message: "Invalid variantLength" });
      continue;
    }

    const variantWidth = variantWidthRaw ? parseNumberValue(variantWidthRaw) : undefined;
    if (variantWidthRaw && variantWidth === undefined) {
      failures.push({ rowNumber, message: "Invalid variantWidth" });
      continue;
    }

    const variantHeight = variantHeightRaw ? parseNumberValue(variantHeightRaw) : undefined;
    if (variantHeightRaw && variantHeight === undefined) {
      failures.push({ rowNumber, message: "Invalid variantHeight" });
      continue;
    }

    const variantWeightUnit = variantWeightUnitRaw ? parseWeightUnit(variantWeightUnitRaw) : undefined;
    if (variantWeightUnitRaw && !variantWeightUnit) {
      failures.push({ rowNumber, message: "variantWeightUnit must be g, kg, oz, or lb" });
      continue;
    }

    const variantDimensionUnit = variantDimensionUnitRaw ? parseDimensionUnit(variantDimensionUnitRaw) : undefined;
    if (variantDimensionUnitRaw && !variantDimensionUnit) {
      failures.push({ rowNumber, message: "variantDimensionUnit must be mm, cm, m, in, or ft" });
      continue;
    }

    const groupKey = `${storeId.trim().toLowerCase()}|${name.trim().toLowerCase()}|${category.trim().toLowerCase()}|${subcategory.trim().toLowerCase()}`;
    let group = grouped.get(groupKey);
    if (!group) {
      const payload: AdminItemCreatePayload = {
        storeId,
        name,
        category,
        price: Math.max(0, price),
      };

      if (subcategory) {
        payload.subcategory = subcategory;
      }

      group = {
        key: groupKey,
        rowNumbers: [],
        payload,
        sizeValues: new Set<string>(),
        variantSignatures: new Set<string>(),
        tagValues: new Set<string>(),
        mediaUrlValues: new Set<string>(),
      };
      grouped.set(groupKey, group);
    }

    group.rowNumbers.push(rowNumber);

    if (shortDescription && !group.payload.shortDescription) group.payload.shortDescription = shortDescription;
    if (description && !group.payload.description) group.payload.description = description;
    if (disclaimerHtml && !group.payload.disclaimerHtml) group.payload.disclaimerHtml = disclaimerHtml;
    if (howToPersonaliseHtml && !group.payload.howToPersonaliseHtml) group.payload.howToPersonaliseHtml = howToPersonaliseHtml;
    if (brandDetailsHtml && !group.payload.brandDetailsHtml) group.payload.brandDetailsHtml = brandDetailsHtml;

    if (originalPrice !== undefined) {
      group.payload.originalPrice = Math.max(0, originalPrice);
    }

    if (deliveryEtaHours !== undefined) {
      group.payload.deliveryEtaHours = Math.max(1, Math.floor(deliveryEtaHours));
    }

    if (minOrderQty !== undefined) {
      group.payload.minOrderQty = Math.max(1, Math.floor(minOrderQty));
    }

    if (maxOrderQty !== undefined) {
      group.payload.maxOrderQty = Math.max(1, Math.floor(maxOrderQty));
    }

    if (featured !== undefined) {
      group.payload.featured = featured;
    }

    if (inStock !== undefined) {
      group.payload.inStock = inStock;
    }

    for (const tag of splitDelimitedValues(tagsRaw, true)) {
      group.tagValues.add(tag);
    }

    if (mediaUrls.length) {
      const existingMedia = group.payload.media ?? [];
      for (const url of mediaUrls) {
        if (group.mediaUrlValues.has(url)) {
          continue;
        }
        group.mediaUrlValues.add(url);
        const mediaType = inferMediaTypeFromUrl(url);
        existingMedia.push({
          type: mediaType,
          url,
          ...(mediaType === "video" ? { thumbnailUrl: deriveCloudinaryVideoThumbnail(url) } : {}),
        });
      }
      group.payload.media = existingMedia;
    }

    if (!hasVariantValues) {
      continue;
    }

    const variantSignature = variantSize.trim().toLowerCase();
    if (group.variantSignatures.has(variantSignature)) {
      failures.push({ rowNumber, message: `Duplicate variant size ${variantSize} for the same item` });
      continue;
    }

    group.variantSignatures.add(variantSignature);
    group.sizeValues.add(variantSize);

    if (!group.payload.variants) {
      group.payload.variants = [];
    }

    const hasDimensions = variantLength !== undefined || variantWidth !== undefined || variantHeight !== undefined;
    const variantId = variantIdRaw || makeLocalId("var");
    const normalizedVariantSale = variantSale === undefined ? Math.max(0, price) : Math.max(0, variantSale);

    group.payload.variants.push({
      id: variantId,
      options: { size: variantSize },
      salePrice: normalizedVariantSale,
      regularPrice: variantRegular === undefined ? undefined : Math.max(0, variantRegular),
      weight: variantWeight === undefined ? undefined : Math.max(0, variantWeight),
      weightUnit: variantWeight !== undefined ? (variantWeightUnit ?? "g") : undefined,
      size: variantSize,
      length: variantLength === undefined ? undefined : Math.max(0, variantLength),
      width: variantWidth === undefined ? undefined : Math.max(0, variantWidth),
      height: variantHeight === undefined ? undefined : Math.max(0, variantHeight),
      dimensionUnit: hasDimensions ? (variantDimensionUnit ?? "cm") : undefined,
      inStock: group.payload.inStock ?? true,
    });
  }

  const items: CsvPreparedItem[] = [];
  for (const entry of grouped.values()) {
    if (entry.tagValues.size) {
      entry.payload.tags = Array.from(entry.tagValues);
    }

    if (entry.payload.variants?.length && entry.sizeValues.size) {
      entry.payload.attributes = [{
        name: "size",
        values: Array.from(entry.sizeValues),
      }];
    }

    items.push({
      key: entry.key,
      rowNumbers: entry.rowNumbers,
      payload: entry.payload,
    });
  }

  return { items, failures };
}