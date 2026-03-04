"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  userId: string;
  defaultName: string;
  defaultEmail: string;
  defaultPhone?: string;
  defaultRole?: string;
};

const roles = ["user", "storeOwner", "sadmin"] as const;

export function UserActions({ userId, defaultName, defaultEmail, defaultPhone, defaultRole }: Props) {
  const router = useRouter();
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [role, setRole] = useState((defaultRole ?? "user") as (typeof roles)[number]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, role }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update user");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to update user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this user?")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete user");
        return;
      }
      router.refresh();
    } catch {
      setError("Unable to delete user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-2 space-y-2 border-t border-border pt-2">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" />
        <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone" />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
          className="h-10 rounded-md border border-border bg-background px-2 text-sm"
        >
          {roles.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" size="sm" variant="destructive" onClick={remove} disabled={saving}>Delete</Button>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
