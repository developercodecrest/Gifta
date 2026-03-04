"use client";

import { useMemo, useState } from "react";
import { Eye, Filter, LayoutGrid, List, Pencil, Table2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
import { Label } from "@/components/ui/label";

type AdminOrder = {
  id: string;
  storeId: string;
  productId: string;
  quantity: number;
  totalAmount: number;
  customerName: string;
  status: "placed" | "packed" | "out-for-delivery" | "delivered" | "cancelled";
  createdAt: string;
};

type ViewMode = "grid" | "list" | "table";
const statuses: AdminOrder["status"][] = ["placed", "packed", "out-for-delivery", "delivered", "cancelled"];

export function OrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const sorted = useMemo(
    () => [...orders].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()),
    [orders],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-card p-3">
        <div className="flex items-center gap-2">
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
        <Button variant="outline" size="sm"><Filter className="h-4 w-4" /> Filters</Button>
      </div>

      {viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => (
                  <tr key={order.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{order.id}</td>
                    <td className="px-4 py-3 text-muted-foreground">{order.customerName}</td>
                    <td className="px-4 py-3"><Badge variant="secondary">{order.status}</Badge></td>
                    <td className="px-4 py-3">₹{order.totalAmount}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3"><div className="flex justify-end"><OrderRowActions order={order} /></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sorted.map((order) => (
            <Card key={order.id}><CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="space-y-1.5">
                <p className="font-semibold">{order.id}</p>
                <p className="text-sm text-muted-foreground">{order.customerName} • Qty {order.quantity}</p>
                <p className="text-xs text-muted-foreground">Store {order.storeId} • Product {order.productId}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant="secondary">{order.status}</Badge>
                <p className="font-semibold">₹{order.totalAmount}</p>
                <OrderRowActions order={order} />
              </div>
            </CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sorted.map((order) => (
            <Card key={order.id}><CardContent className="space-y-2 p-5">
              <p className="font-semibold">{order.id}</p>
              <p className="text-sm text-muted-foreground">{order.customerName}</p>
              <p className="text-sm text-muted-foreground">{order.status}</p>
              <p className="font-semibold">₹{order.totalAmount}</p>
              <OrderRowActions order={order} />
            </CardContent></Card>
          ))}
        </div>
      )}
    </div>
  );
}

function OrderRowActions({ order }: { order: AdminOrder }) {
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [status, setStatus] = useState<AdminOrder["status"]>(order.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update order");
        return;
      }
      setEditOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to update order");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, { method: "DELETE" });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to delete order");
        return;
      }
      setDeleteOpen(false);
      window.location.reload();
    } catch {
      setError("Unable to delete order");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Eye className="h-4 w-4" /> View</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>{order.id}</DialogTitle><DialogDescription>Order details</DialogDescription></DialogHeader>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Customer: {order.customerName}</p>
            <p>Status: {order.status}</p>
            <p>Amount: ₹{order.totalAmount}</p>
            <p>Qty: {order.quantity}</p>
            <p>Store: {order.storeId}</p>
            <p>Product: {order.productId}</p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild><Button size="sm" variant="outline"><Pencil className="h-4 w-4" /> Edit</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit order</DialogTitle><DialogDescription>Update status</DialogDescription></DialogHeader>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as AdminOrder["status"])}
              className="min-h-11 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              {statuses.map((entry) => (<option key={entry} value={entry}>{entry}</option>))}
            </select>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={() => void save()} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild><Button size="sm" variant="destructive"><Trash2 className="h-4 w-4" /> Delete</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete order</DialogTitle><DialogDescription>Remove this order record.</DialogDescription></DialogHeader>
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
