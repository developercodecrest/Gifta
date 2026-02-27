"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
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

const DISMISS_KEY = "gifta-profile-onboarding-dismissed";

export function ProfileOnboardingGate() {
  const { status, data } = useSession();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);
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
    if (typeof window === "undefined") return;
    const storageKey = `${DISMISS_KEY}:${data?.user?.email ?? data?.user?.name ?? "guest"}`;
    const isDismissed = window.localStorage.getItem(storageKey) === "1";
    setDismissed(isDismissed);
  }, [data?.user?.email, data?.user?.name]);

  const markDismissed = () => {
    if (typeof window !== "undefined") {
      const storageKey = `${DISMISS_KEY}:${data?.user?.email ?? data?.user?.name ?? "guest"}`;
      window.localStorage.setItem(storageKey, "1");
    }
    setDismissed(true);
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setOpen(false);
      return;
    }

    if (dismissed) {
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
        if (!dismissed) {
          setOpen(true);
        }
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [defaultName, dismissed, status]);

  const submit = async () => {
    setError(null);
    const normalize = (value: string) => {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const fullName = normalize(form.fullName);
    const phone = normalize(form.phone);
    const receiverName = normalize(form.receiverName);
    const receiverPhone = normalize(form.receiverPhone);
    const line1 = normalize(form.line1);
    const city = normalize(form.city);
    const state = normalize(form.state);
    const pinCode = normalize(form.pinCode);
    const country = normalize(form.country);

    const hasAnyAddressValue = Boolean(receiverName || receiverPhone || line1 || city || state || pinCode || country);
    const hasCompleteAddress = Boolean(receiverName && receiverPhone && line1 && city && state && pinCode && country);

    if (hasAnyAddressValue && !hasCompleteAddress) {
      setError("To save an address, please complete all address fields, or leave them blank.");
      return;
    }

    try {
      setSaving(true);
      const payloadBody: {
        fullName?: string;
        phone?: string;
        addresses?: Array<{
          label: string;
          receiverName: string;
          receiverPhone: string;
          line1: string;
          city: string;
          state: string;
          pinCode: string;
          country: string;
        }>;
      } = {};

      if (fullName) payloadBody.fullName = fullName;
      if (phone) payloadBody.phone = phone;
      if (hasCompleteAddress) {
        payloadBody.addresses = [
          {
            label: "Primary",
            receiverName: receiverName!,
            receiverPhone: receiverPhone!,
            line1: line1!,
            city: city!,
            state: state!,
            pinCode: pinCode!,
            country: country!,
          },
        ];
      }

      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to save profile.");
        return;
      }

      setOpen(false);
      markDismissed();
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
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          markDismissed();
        }
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Complete your profile</DialogTitle>
          <DialogDescription>
            You can skip this for now and add details later from your account.
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setOpen(false);
              markDismissed();
            }}
            disabled={saving}
          >
            Skip for now
          </Button>
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
