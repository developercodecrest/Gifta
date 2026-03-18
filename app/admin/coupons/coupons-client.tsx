"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CouponDto } from "@/types/api";

type CouponFormState = {
  code: string;
  title: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: string;
  maxDiscount: string;
  minSubtotal: string;
  usageLimit: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
};

const emptyForm: CouponFormState = {
  code: "",
  title: "",
  description: "",
  discountType: "percent",
  discountValue: "",
  maxDiscount: "",
  minSubtotal: "",
  usageLimit: "",
  startsAt: "",
  endsAt: "",
  active: true,
};

export function CouponsClient({ initialCoupons }: { initialCoupons: CouponDto[] }) {
  const [coupons, setCoupons] = useState<CouponDto[]>(initialCoupons);
  const [form, setForm] = useState<CouponFormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<CouponFormState>(emptyForm);

  const sortedCoupons = useMemo(
    () => [...coupons].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [coupons],
  );

  const createCoupon = async () => {
    setError(null);

    if (!form.code.trim() || !form.title.trim() || !form.discountValue.trim()) {
      setError("Code, title and discount value are required.");
      return;
    }

    const payload = {
      code: form.code,
      title: form.title,
      description: form.description || undefined,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      minSubtotal: form.minSubtotal ? Number(form.minSubtotal) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startsAt: form.startsAt || undefined,
      endsAt: form.endsAt || undefined,
      active: form.active,
    };

    if (!Number.isFinite(payload.discountValue) || payload.discountValue < 0) {
      setError("Discount value must be a non-negative number.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: CouponDto;
        error?: { message?: string };
      };

      if (!response.ok || !result.success || !result.data) {
        setError(result.error?.message ?? "Unable to create coupon.");
        return;
      }

      setCoupons((prev) => [result.data!, ...prev]);
      setForm(emptyForm);
    } catch {
      setError("Unable to create coupon.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: CouponDto) => {
    const response = await fetch(`/api/admin/coupons/${encodeURIComponent(coupon.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !coupon.active }),
    });

    const result = (await response.json()) as {
      success?: boolean;
      data?: CouponDto;
      error?: { message?: string };
    };

    if (!response.ok || !result.success || !result.data) {
      setError(result.error?.message ?? "Unable to update coupon.");
      return;
    }

    setCoupons((prev) => prev.map((item) => (item.id === coupon.id ? result.data! : item)));
  };

  const startEdit = (coupon: CouponDto) => {
    setError(null);
    setEditingId(coupon.id);
    setEditForm({
      code: coupon.code,
      title: coupon.title,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      maxDiscount: coupon.maxDiscount ? String(coupon.maxDiscount) : "",
      minSubtotal: coupon.minSubtotal ? String(coupon.minSubtotal) : "",
      usageLimit: typeof coupon.usageLimit === "number" ? String(coupon.usageLimit) : "",
      startsAt: coupon.startsAt ?? "",
      endsAt: coupon.endsAt ?? "",
      active: coupon.active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm(emptyForm);
  };

  const saveEdit = async (couponId: string) => {
    setError(null);
    const payload = {
      code: editForm.code,
      title: editForm.title,
      description: editForm.description || undefined,
      discountType: editForm.discountType,
      discountValue: Number(editForm.discountValue),
      maxDiscount: editForm.maxDiscount ? Number(editForm.maxDiscount) : null,
      minSubtotal: editForm.minSubtotal ? Number(editForm.minSubtotal) : null,
      usageLimit: editForm.usageLimit ? Number(editForm.usageLimit) : null,
      startsAt: editForm.startsAt || null,
      endsAt: editForm.endsAt || null,
      active: editForm.active,
    };

    if (!payload.code.trim() || !payload.title.trim() || !Number.isFinite(payload.discountValue) || payload.discountValue < 0) {
      setError("Provide valid code, title and discount value before saving.");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/coupons/${encodeURIComponent(couponId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: CouponDto;
        error?: { message?: string };
      };

      if (!response.ok || !result.success || !result.data) {
        setError(result.error?.message ?? "Unable to save coupon changes.");
        return;
      }

      setCoupons((prev) => prev.map((item) => (item.id === couponId ? result.data! : item)));
      cancelEdit();
    } catch {
      setError("Unable to save coupon changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 rounded-3xl border border-border/70 bg-background/70 p-4 md:grid-cols-2">
        <Field label="Code">
          <Input value={form.code} onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} placeholder="WELCOME10" />
        </Field>
        <Field label="Title">
          <Input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} placeholder="Welcome offer" />
        </Field>
        <Field label="Description">
          <Input value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} placeholder="Optional" />
        </Field>
        <Field label="Discount type">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.discountType}
            onChange={(event) => setForm((prev) => ({ ...prev, discountType: event.target.value as "percent" | "flat" }))}
          >
            <option value="percent">Percent</option>
            <option value="flat">Flat</option>
          </select>
        </Field>
        <Field label="Discount value">
          <Input value={form.discountValue} onChange={(event) => setForm((prev) => ({ ...prev, discountValue: event.target.value }))} placeholder="10" />
        </Field>
        <Field label="Max discount (optional)">
          <Input value={form.maxDiscount} onChange={(event) => setForm((prev) => ({ ...prev, maxDiscount: event.target.value }))} placeholder="250" />
        </Field>
        <Field label="Min subtotal (optional)">
          <Input value={form.minSubtotal} onChange={(event) => setForm((prev) => ({ ...prev, minSubtotal: event.target.value }))} placeholder="1000" />
        </Field>
        <Field label="Usage limit (optional)">
          <Input value={form.usageLimit} onChange={(event) => setForm((prev) => ({ ...prev, usageLimit: event.target.value }))} placeholder="100" />
        </Field>
        <Field label="Starts at (ISO optional)">
          <Input value={form.startsAt} onChange={(event) => setForm((prev) => ({ ...prev, startsAt: event.target.value }))} placeholder="2026-01-01T00:00:00.000Z" />
        </Field>
        <Field label="Ends at (ISO optional)">
          <Input value={form.endsAt} onChange={(event) => setForm((prev) => ({ ...prev, endsAt: event.target.value }))} placeholder="2026-12-31T23:59:59.000Z" />
        </Field>
        <label className="col-span-full inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          Active
        </label>

        <div className="col-span-full flex items-center gap-3">
          <Button type="button" onClick={createCoupon} disabled={saving}>
            {saving ? "Saving..." : "Create coupon"}
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-3xl border border-border/70 bg-background/70">
        <table className="w-full min-w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Rule</th>
              <th className="px-4 py-3">Min subtotal</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Window</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedCoupons.map((coupon) => (
              <tr key={coupon.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-semibold">
                  {editingId === coupon.id ? (
                    <Input value={editForm.code} onChange={(event) => setEditForm((prev) => ({ ...prev, code: event.target.value.toUpperCase() }))} className="h-8" />
                  ) : coupon.code}
                </td>
                <td className="px-4 py-3">
                  {editingId === coupon.id ? (
                    <Input value={editForm.title} onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))} className="h-8" />
                  ) : coupon.title}
                </td>
                <td className="px-4 py-3">
                  {editingId === coupon.id ? (
                    <div className="flex items-center gap-2">
                      <select
                        className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                        value={editForm.discountType}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, discountType: event.target.value as "percent" | "flat" }))}
                      >
                        <option value="percent">%</option>
                        <option value="flat">₹</option>
                      </select>
                      <Input value={editForm.discountValue} onChange={(event) => setEditForm((prev) => ({ ...prev, discountValue: event.target.value }))} className="h-8" />
                      <Input value={editForm.maxDiscount} onChange={(event) => setEditForm((prev) => ({ ...prev, maxDiscount: event.target.value }))} className="h-8" placeholder="max" />
                    </div>
                  ) : (
                    <>
                      {coupon.discountType === "percent" ? `${coupon.discountValue}%` : `₹${coupon.discountValue}`}
                      {coupon.maxDiscount ? ` (max ₹${coupon.maxDiscount})` : ""}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === coupon.id ? (
                    <Input value={editForm.minSubtotal} onChange={(event) => setEditForm((prev) => ({ ...prev, minSubtotal: event.target.value }))} className="h-8" placeholder="min" />
                  ) : (coupon.minSubtotal ? `₹${coupon.minSubtotal}` : "-")}
                </td>
                <td className="px-4 py-3">
                  {editingId === coupon.id ? (
                    <Input value={editForm.usageLimit} onChange={(event) => setEditForm((prev) => ({ ...prev, usageLimit: event.target.value }))} className="h-8" placeholder="limit" />
                  ) : (typeof coupon.usageLimit === "number" ? `${coupon.usedCount}/${coupon.usageLimit}` : `${coupon.usedCount}`)}
                </td>
                <td className="px-4 py-3 text-xs">
                  {editingId === coupon.id ? (
                    <div className="space-y-1">
                      <Input value={editForm.startsAt} onChange={(event) => setEditForm((prev) => ({ ...prev, startsAt: event.target.value }))} className="h-8" placeholder="startsAt ISO" />
                      <Input value={editForm.endsAt} onChange={(event) => setEditForm((prev) => ({ ...prev, endsAt: event.target.value }))} className="h-8" placeholder="endsAt ISO" />
                    </div>
                  ) : (
                    <>
                      {coupon.startsAt ? coupon.startsAt : "-"}
                      <br />
                      {coupon.endsAt ? coupon.endsAt : "-"}
                    </>
                  )}
                </td>
                <td className="px-4 py-3">
                  {editingId === coupon.id ? (
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={editForm.active}
                        onChange={(event) => setEditForm((prev) => ({ ...prev, active: event.target.checked }))}
                      />
                      {editForm.active ? "Active" : "Inactive"}
                    </label>
                  ) : (coupon.active ? "Active" : "Inactive")}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {editingId === coupon.id ? (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => saveEdit(coupon.id)} disabled={saving}>Save</Button>
                        <Button type="button" variant="ghost" size="sm" onClick={cancelEdit} disabled={saving}>Cancel</Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="outline" size="sm" onClick={() => startEdit(coupon)}>Edit</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => toggleActive(coupon)}>
                          {coupon.active ? "Deactivate" : "Activate"}
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {sortedCoupons.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-muted-foreground" colSpan={8}>
                  No coupons found.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
