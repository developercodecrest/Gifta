"use client";

import { useMemo, useState } from "react";
import { Eye, LayoutGrid, List, Pencil, Table2, Trash2 } from "lucide-react";
import { AdminEmptyState } from "@/app/admin/_components/admin-surface";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

type AdminUser = {
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  updatedAt: string;
};

type ViewMode = "grid" | "list" | "table";
const roles = ["user", "storeOwner", "sadmin"] as const;

export function UsersClient({ users }: { users: AdminUser[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...users]
      .filter((user) => {
        if (!query) return true;
        return [user.fullName, user.email, user.phone, user.userId]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  }, [users, search]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-[1.4rem] border border-border/70 bg-card/85 p-4 lg:grid-cols-[minmax(0,1.4fr)_auto_auto]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, user ID" />
        <div className="flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-[#5f5047]">
          {sorted.length} users
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
        <AdminEmptyState title="No users matched" description="Try a broader search to locate the account you want to review or edit." />
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="app-table-head text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Updated</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((user) => (
                  <tr key={user.userId} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{user.fullName}</td>
                    <td className="px-4 py-3 text-[#5f5047]">{user.email}</td>
                    <td className="px-4 py-3 text-[#5f5047]">{user.phone ?? "-"}</td>
                    <td className="px-4 py-3 text-[#5f5047]">{new Date(user.updatedAt).toLocaleString()}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><UserRowActions user={user} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sorted.map((user) => (
            <Card key={user.userId} className="border-border/70 bg-background/80"><CardContent className="flex min-h-36 items-start justify-between gap-3 p-4">
              <div className="space-y-1.5">
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-sm text-[#5f5047]">{user.email}</p>
                <p className="text-xs text-[#74655c]">{user.userId}</p>
              </div>
              <UserRowActions user={user} />
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((user) => (
            <Card key={user.userId} className="border-border/70 bg-background/80"><CardContent className="flex min-h-44 flex-col space-y-2 p-5">
              <p className="font-semibold">{user.fullName}</p>
              <p className="text-sm text-[#5f5047]">{user.email}</p>
              <p className="text-xs text-[#74655c]">{user.phone ?? "-"}</p>
              <div className="mt-auto"><UserRowActions user={user} /></div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

function UserRowActions({ user }: { user: AdminUser }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? "");
  const [role, setRole] = useState<(typeof roles)[number]>("user");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, role }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update user");
        return;
      }
      setEditOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to update user");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users/${user.userId}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete user");
        return;
      }
      setDeleteOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to delete user");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{user.fullName}</DialogTitle><DialogDescription>User details</DialogDescription></DialogHeader>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Email: {user.email}</p>
            <p>Phone: {user.phone ?? "-"}</p>
            <p>ID: {user.userId}</p>
            <p>Updated: {new Date(user.updatedAt).toLocaleString()}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit user</DialogTitle><DialogDescription>Update profile and role</DialogDescription></DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Full name</Label><Input value={fullName} onChange={(event) => setFullName(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Email</Label><Input value={email} onChange={(event) => setEmail(event.target.value)} /></div>
            <div className="space-y-1.5"><Label>Phone</Label><Input value={phone} onChange={(event) => setPhone(event.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <select value={role} onChange={(event) => setRole(event.target.value as (typeof roles)[number])} className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm">
                {roles.map((entry) => (<option key={entry} value={entry}>{entry}</option>))}
              </select>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete user</DialogTitle><DialogDescription>Remove this user account.</DialogDescription></DialogHeader>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={() => void remove()} disabled={saving}>{saving ? "Deleting..." : "Confirm"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
