"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { ArrowLeft, Plus, UploadCloud, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFileToCloudinary } from "@/lib/client/cloudinary-upload";

type UploadField = "logo" | "banner" | "profileImage" | "bankProofImage";

type StoreForm = {
  basicInfo: {
    name: string;
    slug: string;
    logo: string;
    banner: string;
    shortDescription: string;
    longDescription: string;
    category: string;
    subcategory: string;
  };
  owner: {
    fullName: string;
    email: string;
    phone: string;
    alternatePhone: string;
    profileImage: string;
  };
  business: {
    businessType: "individual" | "partnership" | "llp" | "private_limited" | "public_limited" | "other";
    legalName: string;
    gstNumber: string;
    panNumber: string;
    fssaiLicense: string;
    drugLicense: string;
    shopActLicense: string;
  };
  location: {
    addressLine1: string;
    addressLine2: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
    geo: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  delivery: {
    isPickupAvailable: boolean;
    deliveryRadiusKm: number;
    deliveryChargeType: "fixed" | "dynamic" | "range";
    deliveryCharge: number;
    minDeliveryCharge: number;
    maxDeliveryCharge: number;
    estimatedDeliveryTimeMinutes: number;
    timeSlots: Array<{ day: string; start: string; end: string }>;
  };
  payment: {
    accountHolderName: string;
    accountNumber: string;
    ifscCode: string;
    upiId: string;
    bankProofImage: string;
  };
  productSettings: {
    defaultTaxRate: number;
    measurementUnits: string[];
    minOrderValue: number;
    returnPolicy: string;
    replacementPolicy: string;
  };
  operations: {
    workingDays: string[];
    openingTime: string;
    closingTime: string;
    holidayMode: boolean;
    orderPreparationTimeMinutes: number;
  };
  media: {
    gallery: string[];
    introVideo: string;
  };
  catalog: {
    categories: Array<{ name: string; image?: string; subcategories: string[] }>;
  };
  marketing: {
    couponsEnabled: boolean;
    featured: boolean;
    adBudget: number;
  };
  aiInsights: {
    pricingSuggestionsEnabled: boolean;
    inventoryAlertsEnabled: boolean;
    salesInsightsEnabled: boolean;
    complianceAlertsEnabled: boolean;
    productRecommendationsEnabled: boolean;
  };
  meta: {
    status: "pending" | "active" | "inactive" | "rejected";
    isVerified: boolean;
    profileCompletion: number;
    createdAt: string;
    updatedAt: string;
  };
};

const ALL_UNITS = ["kg", "gram", "piece", "liter", "ml", "dozen", "pack", "box", "set", "meter"];
const ALL_DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const initialForm: StoreForm = {
  basicInfo: {
    name: "",
    slug: "",
    logo: "",
    banner: "",
    shortDescription: "",
    longDescription: "",
    category: "",
    subcategory: "",
  },
  owner: {
    fullName: "",
    email: "",
    phone: "",
    alternatePhone: "",
    profileImage: "",
  },
  business: {
    businessType: "individual",
    legalName: "",
    gstNumber: "",
    panNumber: "",
    fssaiLicense: "",
    drugLicense: "",
    shopActLicense: "",
  },
  location: {
    addressLine1: "",
    addressLine2: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    geo: {
      latitude: null,
      longitude: null,
    },
  },
  delivery: {
    isPickupAvailable: false,
    deliveryRadiusKm: 0,
    deliveryChargeType: "fixed",
    deliveryCharge: 0,
    minDeliveryCharge: 0,
    maxDeliveryCharge: 0,
    estimatedDeliveryTimeMinutes: 0,
    timeSlots: [],
  },
  payment: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    upiId: "",
    bankProofImage: "",
  },
  productSettings: {
    defaultTaxRate: 0,
    measurementUnits: ["kg", "piece", "liter"],
    minOrderValue: 0,
    returnPolicy: "",
    replacementPolicy: "",
  },
  operations: {
    workingDays: [...ALL_DAYS],
    openingTime: "09:00",
    closingTime: "21:00",
    holidayMode: false,
    orderPreparationTimeMinutes: 30,
  },
  media: {
    gallery: [],
    introVideo: "",
  },
  catalog: {
    categories: [],
  },
  marketing: {
    couponsEnabled: true,
    featured: false,
    adBudget: 0,
  },
  aiInsights: {
    pricingSuggestionsEnabled: true,
    inventoryAlertsEnabled: true,
    salesInsightsEnabled: true,
    complianceAlertsEnabled: true,
    productRecommendationsEnabled: true,
  },
  meta: {
    status: "pending",
    isVerified: false,
    profileCompletion: 0,
    createdAt: new Date().toISOString().slice(0, 16),
    updatedAt: new Date().toISOString().slice(0, 16),
  },
};

function FileUploadField({
  label,
  progress,
  value,
  onUpload,
  accept,
}: {
  label: string;
  progress: number;
  value: string;
  onUpload: (file: File) => Promise<void>;
  accept: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
        <UploadCloud className="h-4 w-4" /> Upload media
        <input
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            onUpload(file).catch(() => null);
            event.currentTarget.value = "";
          }}
        />
      </label>
      <div className="h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>
      {value ? <p className="truncate text-xs text-muted-foreground">{value}</p> : null}
    </div>
  );
}

export function StoreCreateForm() {
  const [form, setForm] = useState<StoreForm>(initialForm);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newSubByCategory, setNewSubByCategory] = useState<Record<string, string>>({});
  const [unitInput, setUnitInput] = useState("");
  const [galleryProgress, setGalleryProgress] = useState(0);
  const [fieldProgress, setFieldProgress] = useState<Record<UploadField, number>>({
    logo: 0,
    banner: 0,
    profileImage: 0,
    bankProofImage: 0,
  });
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const completion = useMemo(() => {
    const required = [form.basicInfo.name, form.basicInfo.category, form.owner.fullName, form.owner.email, form.location.city];
    const done = required.filter((value) => value.trim().length > 0).length;
    return Math.round((done / required.length) * 100);
  }, [form]);

  const categoryOptions = useMemo(() => form.catalog.categories.map((entry) => entry.name), [form.catalog.categories]);
  const subcategoryOptions = useMemo(() => {
    return form.catalog.categories.find((entry) => entry.name === form.basicInfo.category)?.subcategories ?? [];
  }, [form.catalog.categories, form.basicInfo.category]);

  async function uploadToCloudinary(file: File, onProgress: (value: number) => void) {
    return uploadFileToCloudinary(file, {
      folder: "gifta/stores",
      resourceType: "image",
      onProgress,
    });
  }

  async function uploadCategoryImage(categoryName: string, file: File) {
    setError(null);
    const url = await uploadFileToCloudinary(file, {
      folder: "gifta/categories",
      resourceType: "image",
      onProgress: (value) => {
        setGalleryProgress(value);
      },
    });

    setForm((prev) => ({
      ...prev,
      catalog: {
        ...prev.catalog,
        categories: prev.catalog.categories.map((entry) =>
          entry.name === categoryName
            ? { ...entry, image: url }
            : entry,
        ),
      },
    }));
  }

  async function uploadSingle(field: UploadField, file: File) {
    setError(null);
    const url = await uploadToCloudinary(file, (value) => {
      setFieldProgress((prev) => ({ ...prev, [field]: value }));
    });

    if (field === "logo" || field === "banner") {
      setForm((prev) => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [field]: url,
        },
      }));
      return;
    }

    if (field === "profileImage") {
      setForm((prev) => ({
        ...prev,
        owner: {
          ...prev.owner,
          profileImage: url,
        },
      }));
      return;
    }

    setForm((prev) => ({
      ...prev,
      payment: {
        ...prev.payment,
        bankProofImage: url,
      },
    }));
  }

  async function uploadGallery(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError(null);
    const url = await uploadToCloudinary(file, setGalleryProgress);
    setForm((prev) => ({
      ...prev,
      media: {
        ...prev.media,
        gallery: [...prev.media.gallery, url],
      },
    }));
    event.currentTarget.value = "";
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    setStatus(null);

    const payload = {
      store: {
        ...form,
        meta: {
          ...form.meta,
          profileCompletion: completion,
          updatedAt: new Date().toISOString(),
        },
      },
    };

    try {
      const response = await fetch("/api/admin/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result?.error?.message ?? "Unable to create store");
      }

      setStatus(`Store created: ${result.data.name} (${result.data.slug})`);
      setForm((prev) => ({
        ...prev,
        meta: {
          ...prev.meta,
          updatedAt: new Date().toISOString().slice(0, 16),
        },
      }));
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create store");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Badge variant="secondary">Admin / Vendors</Badge>
          <h1 className="mt-2 text-2xl font-bold">Create Store</h1>
          <p className="text-sm text-muted-foreground">Complete all business sections and submit for verification.</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/vendors" className="inline-flex items-center gap-2 whitespace-nowrap"><ArrowLeft className="h-4 w-4" />Back to vendors</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic info</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Store Name</Label><Input value={form.basicInfo.name} onChange={(e) => setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, name: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Slug</Label><Input value={form.basicInfo.slug} onChange={(e) => setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, slug: e.target.value } }))} placeholder="optional-auto-generated" /></div>
          <div className="space-y-1.5"><Label>Category</Label><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.basicInfo.category} onChange={(e) => {
            const category = e.target.value;
            const subcategory = form.catalog.categories.find((entry) => entry.name === category)?.subcategories[0] ?? "";
            setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, category, subcategory } }));
          }}><option value="">Select category</option>{categoryOptions.map((category) => (<option key={category} value={category}>{category}</option>))}</select></div>
          <div className="space-y-1.5"><Label>Subcategory</Label><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.basicInfo.subcategory} onChange={(e) => setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, subcategory: e.target.value } }))}><option value="">Select subcategory</option>{subcategoryOptions.map((subcategory) => (<option key={subcategory} value={subcategory}>{subcategory}</option>))}</select></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Short Description</Label><Input value={form.basicInfo.shortDescription} onChange={(e) => setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, shortDescription: e.target.value } }))} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Long Description (textarea)</Label><textarea className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.basicInfo.longDescription} onChange={(e) => setForm((p) => ({ ...p, basicInfo: { ...p.basicInfo, longDescription: e.target.value } }))} /></div>

          <div className="space-y-3 rounded-lg border border-border p-4 md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium">Create categories for this store</p>
              <span className="text-xs text-muted-foreground">Used in create/edit dropdowns</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} placeholder="Add category" className="max-w-xs" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const name = newCategoryName.trim();
                  if (!name || form.catalog.categories.some((entry) => entry.name.toLowerCase() === name.toLowerCase())) return;
                  setForm((prev) => ({ ...prev, catalog: { ...prev.catalog, categories: [...prev.catalog.categories, { name, image: "", subcategories: [] }] } }));
                  setNewCategoryName("");
                  if (!form.basicInfo.category) {
                    setForm((prev) => ({ ...prev, basicInfo: { ...prev.basicInfo, category: name, subcategory: "" } }));
                  }
                }}
              >
                <Plus className="h-4 w-4" /> Add Category
              </Button>
            </div>

            <div className="space-y-3">
              {form.catalog.categories.length ? (
                form.catalog.categories.map((entry) => (
                  <div key={entry.name} className="rounded-md border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{entry.name}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setForm((prev) => ({
                            ...prev,
                            catalog: {
                              ...prev.catalog,
                              categories: prev.catalog.categories.filter((categoryEntry) => categoryEntry.name !== entry.name),
                            },
                            basicInfo: prev.basicInfo.category === entry.name
                              ? { ...prev.basicInfo, category: "", subcategory: "" }
                              : prev.basicInfo,
                          }));
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{entry.subcategories.join(", ") || "No subcategories"}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {entry.image ? <p className="truncate text-xs text-muted-foreground">{entry.image}</p> : <p className="text-xs text-muted-foreground">No category image</p>}
                      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10">
                        <UploadCloud className="h-3.5 w-3.5" /> Upload Category Image
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
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Input
                        value={newSubByCategory[entry.name] ?? ""}
                        onChange={(e) => setNewSubByCategory((prev) => ({ ...prev, [entry.name]: e.target.value }))}
                        placeholder="Add subcategory"
                        className="max-w-xs"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          const value = (newSubByCategory[entry.name] ?? "").trim();
                          if (!value || entry.subcategories.some((subcategory) => subcategory.toLowerCase() === value.toLowerCase())) return;
                          setForm((prev) => ({
                            ...prev,
                            catalog: {
                              ...prev.catalog,
                              categories: prev.catalog.categories.map((categoryEntry) => categoryEntry.name === entry.name
                                ? { ...categoryEntry, subcategories: [...categoryEntry.subcategories, value] }
                                : categoryEntry),
                            },
                            basicInfo: prev.basicInfo.category === entry.name && !prev.basicInfo.subcategory
                              ? { ...prev.basicInfo, subcategory: value }
                              : prev.basicInfo,
                          }));
                          setNewSubByCategory((prev) => ({ ...prev, [entry.name]: "" }));
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

          <FileUploadField label="Logo upload" progress={fieldProgress.logo} value={form.basicInfo.logo} onUpload={(file) => uploadSingle("logo", file)} accept="image/*" />
          <FileUploadField label="Banner upload" progress={fieldProgress.banner} value={form.basicInfo.banner} onUpload={(file) => uploadSingle("banner", file)} accept="image/*" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Owner & business</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Owner Full Name</Label><Input value={form.owner.fullName} onChange={(e) => setForm((p) => ({ ...p, owner: { ...p.owner, fullName: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.owner.email} onChange={(e) => setForm((p) => ({ ...p, owner: { ...p.owner, email: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.owner.phone} onChange={(e) => setForm((p) => ({ ...p, owner: { ...p.owner, phone: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Alternate Phone</Label><Input value={form.owner.alternatePhone} onChange={(e) => setForm((p) => ({ ...p, owner: { ...p.owner, alternatePhone: e.target.value } }))} /></div>
          <FileUploadField label="Owner Profile Image" progress={fieldProgress.profileImage} value={form.owner.profileImage} onUpload={(file) => uploadSingle("profileImage", file)} accept="image/*" />

          <div className="space-y-1.5"><Label>Business Type (dropdown)</Label><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.business.businessType} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, businessType: e.target.value as StoreForm["business"]["businessType"] } }))}><option value="individual">Individual</option><option value="partnership">Partnership</option><option value="llp">LLP</option><option value="private_limited">Private Limited</option><option value="public_limited">Public Limited</option><option value="other">Other</option></select></div>
          <div className="space-y-1.5"><Label>Legal Name</Label><Input value={form.business.legalName} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, legalName: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>GST Number</Label><Input value={form.business.gstNumber} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, gstNumber: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>PAN Number</Label><Input value={form.business.panNumber} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, panNumber: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>FSSAI</Label><Input value={form.business.fssaiLicense} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, fssaiLicense: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Drug License</Label><Input value={form.business.drugLicense} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, drugLicense: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Shop Act</Label><Input value={form.business.shopActLicense} onChange={(e) => setForm((p) => ({ ...p, business: { ...p.business, shopActLicense: e.target.value } }))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Location, delivery, operations</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Address 1</Label><Input value={form.location.addressLine1} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, addressLine1: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Address 2</Label><Input value={form.location.addressLine2} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, addressLine2: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Landmark</Label><Input value={form.location.landmark} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, landmark: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={form.location.city} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, city: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>State</Label><Input value={form.location.state} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, state: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.location.pincode} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, pincode: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Latitude</Label><Input type="number" value={form.location.geo.latitude ?? ""} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, geo: { ...p.location.geo, latitude: e.target.value ? Number(e.target.value) : null } } }))} /></div>
          <div className="space-y-1.5"><Label>Longitude</Label><Input type="number" value={form.location.geo.longitude ?? ""} onChange={(e) => setForm((p) => ({ ...p, location: { ...p.location, geo: { ...p.location.geo, longitude: e.target.value ? Number(e.target.value) : null } } }))} /></div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.delivery.isPickupAvailable} onChange={(e) => setForm((p) => ({ ...p, delivery: { ...p.delivery, isPickupAvailable: e.target.checked } }))} /> Pickup available (switch)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.operations.holidayMode} onChange={(e) => setForm((p) => ({ ...p, operations: { ...p.operations, holidayMode: e.target.checked } }))} /> Holiday mode (switch)</label>

          <div className="space-y-1.5"><Label>Delivery Radius (km)</Label><Input type="number" value={form.delivery.deliveryRadiusKm} onChange={(e) => setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryRadiusKm: Number(e.target.value) || 0 } }))} /></div>
          <div className="space-y-1.5"><Label>Charge Type</Label><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.delivery.deliveryChargeType} onChange={(e) => setForm((p) => ({ ...p, delivery: { ...p.delivery, deliveryChargeType: e.target.value as StoreForm["delivery"]["deliveryChargeType"] } }))}><option value="fixed">Fixed</option><option value="dynamic">Dynamic</option><option value="range">Range</option></select></div>

          <div className="space-y-1.5"><Label>Opening Time (time selector)</Label><Input type="time" value={form.operations.openingTime} onChange={(e) => setForm((p) => ({ ...p, operations: { ...p.operations, openingTime: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Closing Time (time selector)</Label><Input type="time" value={form.operations.closingTime} onChange={(e) => setForm((p) => ({ ...p, operations: { ...p.operations, closingTime: e.target.value } }))} /></div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Working days (multi-select dropdown)</Label>
            <select
              multiple
              value={form.operations.workingDays}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                setForm((prev) => ({ ...prev, operations: { ...prev.operations, workingDays: selected } }));
              }}
              className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {ALL_DAYS.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Payment, products, media, AI</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5"><Label>Account Holder</Label><Input value={form.payment.accountHolderName} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, accountHolderName: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Account Number</Label><Input value={form.payment.accountNumber} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, accountNumber: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>IFSC</Label><Input value={form.payment.ifscCode} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, ifscCode: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>UPI ID</Label><Input value={form.payment.upiId} onChange={(e) => setForm((p) => ({ ...p, payment: { ...p.payment, upiId: e.target.value } }))} /></div>
          <FileUploadField label="Bank Proof Image" progress={fieldProgress.bankProofImage} value={form.payment.bankProofImage} onUpload={(file) => uploadSingle("bankProofImage", file)} accept="image/*" />

          <div className="space-y-1.5"><Label>Default Tax %</Label><Input type="number" value={form.productSettings.defaultTaxRate} onChange={(e) => setForm((p) => ({ ...p, productSettings: { ...p.productSettings, defaultTaxRate: Number(e.target.value) || 0 } }))} /></div>
          <div className="space-y-1.5"><Label>Min Order Value</Label><Input type="number" value={form.productSettings.minOrderValue} onChange={(e) => setForm((p) => ({ ...p, productSettings: { ...p.productSettings, minOrderValue: Number(e.target.value) || 0 } }))} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Return Policy (textarea)</Label><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.productSettings.returnPolicy} onChange={(e) => setForm((p) => ({ ...p, productSettings: { ...p.productSettings, returnPolicy: e.target.value } }))} /></div>
          <div className="space-y-1.5 md:col-span-2"><Label>Replacement Policy (textarea)</Label><textarea className="min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.productSettings.replacementPolicy} onChange={(e) => setForm((p) => ({ ...p, productSettings: { ...p.productSettings, replacementPolicy: e.target.value } }))} /></div>

          <div className="space-y-2 md:col-span-2">
            <Label>Measurement Units (tag selector)</Label>
            <div className="flex gap-2">
              <Input value={unitInput} onChange={(e) => setUnitInput(e.target.value)} placeholder="Add unit (e.g., tray)" />
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const value = unitInput.trim().toLowerCase();
                  if (!value || form.productSettings.measurementUnits.includes(value)) return;
                  setForm((prev) => ({ ...prev, productSettings: { ...prev.productSettings, measurementUnits: [...prev.productSettings.measurementUnits, value] } }));
                  setUnitInput("");
                }}
              >
                <Plus className="h-4 w-4" />Add
              </Button>
            </div>
            <select
              multiple
              value={form.productSettings.measurementUnits}
              onChange={(event) => {
                const selected = Array.from(event.target.selectedOptions).map((option) => option.value);
                setForm((prev) => ({ ...prev, productSettings: { ...prev.productSettings, measurementUnits: selected } }));
              }}
              className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {Array.from(new Set([...ALL_UNITS, ...form.productSettings.measurementUnits])).map((unit) => (
                <option key={unit} value={unit}>{unit}</option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              {form.productSettings.measurementUnits.map((unit) => (
                <span key={unit} className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium">
                  {unit}
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, productSettings: { ...prev.productSettings, measurementUnits: prev.productSettings.measurementUnits.filter((entry) => entry !== unit) } }))}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Media Gallery Upload</Label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary/50 bg-primary/5 px-4 py-3 text-sm font-medium text-primary hover:bg-primary/10">
              <UploadCloud className="h-4 w-4" /> Upload gallery image
              <input type="file" accept="image/*" className="hidden" onChange={(event) => void uploadGallery(event)} />
            </label>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div className="h-full bg-primary transition-all" style={{ width: `${galleryProgress}%` }} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {form.media.gallery.map((url) => (
                <p key={url} className="truncate rounded border border-border px-2 py-1 text-xs text-muted-foreground">{url}</p>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 md:col-span-2"><Label>Intro Video URL</Label><Input value={form.media.introVideo} onChange={(e) => setForm((p) => ({ ...p, media: { ...p.media, introVideo: e.target.value } }))} placeholder="https://..." /></div>

          <div className="space-y-1.5 md:col-span-2">
            <Label>Ad Budget (range selector)</Label>
            <input
              type="range"
              min={0}
              max={100000}
              step={500}
              value={form.marketing.adBudget}
              onChange={(e) => setForm((p) => ({ ...p, marketing: { ...p.marketing, adBudget: Number(e.target.value) || 0 } }))}
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">₹{form.marketing.adBudget}</p>
          </div>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.marketing.couponsEnabled} onChange={(e) => setForm((p) => ({ ...p, marketing: { ...p.marketing, couponsEnabled: e.target.checked } }))} /> Coupons enabled (switch)</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.marketing.featured} onChange={(e) => setForm((p) => ({ ...p, marketing: { ...p.marketing, featured: e.target.checked } }))} /> Featured (switch)</label>

          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiInsights.pricingSuggestionsEnabled} onChange={(e) => setForm((p) => ({ ...p, aiInsights: { ...p.aiInsights, pricingSuggestionsEnabled: e.target.checked } }))} /> Pricing Suggestions</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiInsights.inventoryAlertsEnabled} onChange={(e) => setForm((p) => ({ ...p, aiInsights: { ...p.aiInsights, inventoryAlertsEnabled: e.target.checked } }))} /> Inventory Alerts</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiInsights.salesInsightsEnabled} onChange={(e) => setForm((p) => ({ ...p, aiInsights: { ...p.aiInsights, salesInsightsEnabled: e.target.checked } }))} /> Sales Insights</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiInsights.complianceAlertsEnabled} onChange={(e) => setForm((p) => ({ ...p, aiInsights: { ...p.aiInsights, complianceAlertsEnabled: e.target.checked } }))} /> Compliance Alerts</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.aiInsights.productRecommendationsEnabled} onChange={(e) => setForm((p) => ({ ...p, aiInsights: { ...p.aiInsights, productRecommendationsEnabled: e.target.checked } }))} /> Product Recommendations</label>

          <div className="space-y-1.5"><Label>Status</Label><select className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.meta.status} onChange={(e) => setForm((p) => ({ ...p, meta: { ...p.meta, status: e.target.value as StoreForm["meta"]["status"] } }))}><option value="pending">Pending</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="rejected">Rejected</option></select></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.meta.isVerified} onChange={(e) => setForm((p) => ({ ...p, meta: { ...p.meta, isVerified: e.target.checked } }))} /> Verified (switch)</label>
          <div className="space-y-1.5"><Label>Created At (date-time selector)</Label><Input type="datetime-local" value={form.meta.createdAt} onChange={(e) => setForm((p) => ({ ...p, meta: { ...p.meta, createdAt: e.target.value } }))} /></div>
          <div className="space-y-1.5"><Label>Updated At (date-time selector)</Label><Input type="datetime-local" value={form.meta.updatedAt} onChange={(e) => setForm((p) => ({ ...p, meta: { ...p.meta, updatedAt: e.target.value } }))} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-5">
          <p className="text-sm text-muted-foreground">Profile completion estimate: {completion}%</p>
          <Button className="w-full" onClick={() => void submit()} disabled={submitting}>{submitting ? "Creating store..." : "Create store"}</Button>
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
