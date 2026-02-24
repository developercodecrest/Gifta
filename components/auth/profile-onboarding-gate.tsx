"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const onboardingSchema = z.object({
  fullName: z.string().trim().min(2),
  phone: z.string().trim().min(7),
  receiverName: z.string().trim().min(2),
  receiverPhone: z.string().trim().min(7),
  line1: z.string().trim().min(3),
  city: z.string().trim().min(2),
  state: z.string().trim().min(2),
  pinCode: z.string().trim().min(3),
  country: z.string().trim().min(2),
});

export function ProfileOnboardingGate() {
  const { status, data } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    receiverName: "",
    receiverPhone: "",
    line1: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",
  });

  const defaultName = useMemo(() => data?.user?.name ?? "", [data?.user?.name]);

  useEffect(() => {
    if (status !== "authenticated") {
      setOpen(false);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setLoading(true);
      const response = await fetch("/api/profile");
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        data?: {
          fullName?: string;
          phone?: string;
          addresses?: Array<{ receiverName?: string; receiverPhone?: string }>;
        };
      };

      if (cancelled) return;

      if (!response.ok || !payload.success || !payload.data) {
        setForm((prev) => ({
          ...prev,
          fullName: defaultName,
          receiverName: defaultName,
        }));
        setOpen(true);
        setLoading(false);
        return;
      }

      const profile = payload.data;

      const hasRequired =
        Boolean(profile.fullName?.trim()) &&
        Boolean(profile.phone?.trim()) &&
        Boolean(profile.addresses?.length);

      if (!hasRequired) {
        const primaryAddress = profile.addresses?.[0];
        const fallbackName = profile.fullName?.trim() || defaultName;
        setForm((prev) => ({
          ...prev,
          fullName: fallbackName,
          phone: profile.phone ?? "",
          receiverName: primaryAddress?.receiverName ?? fallbackName,
          receiverPhone: primaryAddress?.receiverPhone ?? profile.phone ?? "",
        }));
        setOpen(true);
      } else {
        setOpen(false);
      }

      setLoading(false);
    };

    fetchProfile().catch(() => {
      if (!cancelled) {
        setOpen(true);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [defaultName, status]);

  const submit = async () => {
    setError(null);
    const parsed = onboardingSchema.safeParse(form);

    if (!parsed.success) {
      setError("Please fill all required fields.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: form.fullName,
          phone: form.phone,
          addresses: [
            {
              label: "Primary",
              receiverName: form.receiverName,
              receiverPhone: form.receiverPhone,
              line1: form.line1,
              city: form.city,
              state: form.state,
              pinCode: form.pinCode,
              country: form.country,
            },
          ],
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to save profile.");
        return;
      }

      setOpen(false);
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (status !== "authenticated" || loading) {
    return null;
  }

  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            Please add your name, phone and at least one delivery address to continue.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))} />
          </Field>
          <Field label="Receiver name">
            <Input value={form.receiverName} onChange={(event) => setForm((prev) => ({ ...prev, receiverName: event.target.value }))} />
          </Field>
          <Field label="Receiver phone">
            <Input value={form.receiverPhone} onChange={(event) => setForm((prev) => ({ ...prev, receiverPhone: event.target.value }))} />
          </Field>
        </div>

        <Field label="Address line">
          <Input value={form.line1} onChange={(event) => setForm((prev) => ({ ...prev, line1: event.target.value }))} />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="City">
            <Input value={form.city} onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))} />
          </Field>
          <Field label="State">
            <Input value={form.state} onChange={(event) => setForm((prev) => ({ ...prev, state: event.target.value }))} />
          </Field>
          <Field label="PIN">
            <Input value={form.pinCode} onChange={(event) => setForm((prev) => ({ ...prev, pinCode: event.target.value }))} />
          </Field>
        </div>

        <Field label="Country">
          <Input value={form.country} onChange={(event) => setForm((prev) => ({ ...prev, country: event.target.value }))} />
        </Field>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <DialogFooter>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </label>
  );
}
