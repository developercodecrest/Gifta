"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { UploadCloud } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { uploadFileToCloudinary } from "@/lib/client/cloudinary-upload";

type Address = {
  label: string;
  receiverName: string;
  receiverPhone: string;
  line1: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;
};

export default function AccountPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const uploadProfileImage = async (file: File) => {
    setError(null);
    try {
      const url = await uploadFileToCloudinary(file, {
        folder: "gifta/profiles",
        resourceType: "image",
        onProgress: setImageUploadProgress,
      });
      setProfileImage(url);
      setImageUploadProgress(100);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "Unable to upload profile image.");
    }
  };

  useEffect(() => {
    fetch("/api/profile")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: {
            fullName?: string;
            email?: string;
            phone?: string;
            profileImage?: string;
            addresses?: Address[];
          };
          error?: { message?: string };
        };

        if (!response.ok || !payload.success || !payload.data) {
          setError(payload.error?.message ?? "Unable to load profile.");
          return;
        }

        setFullName(payload.data.fullName ?? "");
        setEmail(payload.data.email ?? "");
        setPhone(payload.data.phone ?? "");
        setProfileImage(payload.data.profileImage ?? "");
        setAddresses(payload.data.addresses ?? []);
      })
      .catch(() => setError("Unable to load profile."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/notifications")
      .then(async (response) => {
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { unreadCount?: number };
        };

        if (!response.ok || !payload.success || !payload.data) {
          return;
        }

        setUnreadNotifications(payload.data.unreadCount ?? 0);
      })
      .catch(() => {
        return;
      });
  }, []);

  const addAddress = () => {
    setAddresses((prev) => [
      ...prev,
      {
        label: `Address ${prev.length + 1}`,
        receiverName: fullName,
        receiverPhone: phone,
        line1: "",
        city: "",
        state: "",
        pinCode: "",
        country: "India",
      },
    ]);
  };

  const updateAddress = (index: number, field: keyof Address, value: string) => {
    setAddresses((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry)),
    );
  };

  const removeAddress = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  const saveProfile = async () => {
    setError(null);
    setStatus(null);

    if (!fullName.trim() || !phone.trim()) {
      setError("Name and phone are required.");
      return;
    }

    if (addresses.length < 1) {
      setError("At least one address is required.");
      return;
    }

    try {
      setSaving(true);
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          profileImage,
          addresses,
        }),
      });

      const payload = (await response.json()) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to save profile.");
        return;
      }

      setStatus("Profile saved.");
    } catch {
      setError("Unable to save profile.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-[#5f5047]">Loading profile...</p>;
  }

  return (
    <div className="space-y-6 sm:space-y-7">
      <header className="rounded-4xl border border-border bg-card p-5 sm:p-7">
        <Badge variant="secondary">My profile</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">My account</h1>
        <p className="mt-2 text-sm text-[#5f5047]">Manage your personal details and delivery addresses.</p>
        <div className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/notifications">View notifications {unreadNotifications > 0 ? `(${unreadNotifications})` : ""}</Link>
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/auth/sign-in" })}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <Card className="rounded-4xl border-border bg-card/85">
        <CardContent className="space-y-4 p-5">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-[#74655c]">Personal details</p>
            <Separator />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Profile image</Label>
              <div className="flex flex-wrap items-center gap-3">
                {profileImage ? (
                  <div className="relative h-16 w-16 overflow-hidden rounded-full border border-border">
                    <Image src={profileImage} alt="Profile" fill className="object-cover" sizes="64px" />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-border text-xs text-muted-foreground">
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
                      void uploadProfileImage(file);
                      event.currentTarget.value = "";
                    }}
                  />
                </label>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div className="h-full bg-primary transition-all" style={{ width: `${imageUploadProgress}%` }} />
              </div>
            </div>
            <Field label="Full name">
              <Input value={fullName} onChange={(event) => setFullName(event.target.value)} />
            </Field>
            <Field label="Email">
              <Input value={email} disabled readOnly />
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <h2 className="text-lg font-semibold">Saved addresses</h2>
            <Button type="button" variant="outline" onClick={addAddress}>Add address</Button>
          </div>
          <Separator />

          <div className="space-y-4">
            {addresses.map((address, index) => (
              <div key={`${address.label}-${index}`} className="rounded-2xl border border-border bg-background/60 p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold">Address {index + 1}</p>
                  {addresses.length > 1 ? (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeAddress(index)}>
                      Remove
                    </Button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Address label">
                    <Input value={address.label} onChange={(event) => updateAddress(index, "label", event.target.value)} />
                  </Field>
                  <Field label="Receiver name">
                    <Input value={address.receiverName} onChange={(event) => updateAddress(index, "receiverName", event.target.value)} />
                  </Field>
                  <Field label="Receiver phone">
                    <Input value={address.receiverPhone} onChange={(event) => updateAddress(index, "receiverPhone", event.target.value)} />
                  </Field>
                  <Field label="Address line">
                    <Input value={address.line1} onChange={(event) => updateAddress(index, "line1", event.target.value)} />
                  </Field>
                  <Field label="City">
                    <Input value={address.city} onChange={(event) => updateAddress(index, "city", event.target.value)} />
                  </Field>
                  <Field label="State">
                    <Input value={address.state} onChange={(event) => updateAddress(index, "state", event.target.value)} />
                  </Field>
                  <Field label="PIN code">
                    <Input value={address.pinCode} onChange={(event) => updateAddress(index, "pinCode", event.target.value)} />
                  </Field>
                  <Field label="Country">
                    <Input value={address.country} onChange={(event) => updateAddress(index, "country", event.target.value)} />
                  </Field>
                </div>
              </div>
            ))}
          </div>

          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="button" onClick={saveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1">
      <Label className="text-xs uppercase tracking-wide text-[#74655c]">{label}</Label>
      {children}
    </label>
  );
}
