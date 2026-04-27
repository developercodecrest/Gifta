"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Eye, LayoutGrid, List, Pencil, Table2, Trash2 } from "lucide-react";
import { AdminEmptyState } from "@/app/admin/_components/admin-surface";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminOrderDto, ProfileDto } from "@/types/api";

type AdminOrder = AdminOrderDto;

type ViewMode = "grid" | "list" | "table";
const statuses: AdminOrder["status"][] = ["placed", "packed", "out-for-delivery", "delivered", "cancelled"];

function formatAddress(value?: {
  line1?: string;
  city?: string;
  state?: string;
  pinCode?: string;
  country?: string;
}): string | undefined {
  if (!value) return undefined;
  const formatted = [value.line1, value.city, value.state, value.pinCode, value.country]
    .map((entry) => entry?.trim())
    .filter(Boolean)
    .join(", ");
  return formatted || undefined;
}

function getCustomerDetails(order: AdminOrder, profile?: ProfileDto): {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
} {
  const primaryAddress = profile?.addresses?.[0];
  return {
    name: profile?.fullName || order.customerName || order.deliveryAddress?.receiverName || "Unknown customer",
    email: profile?.email || order.customerEmail,
    phone:
      profile?.phone ||
      order.customerPhone ||
      primaryAddress?.receiverPhone ||
      primaryAddress?.receiverPhones?.[0] ||
      order.deliveryAddress?.receiverPhone,
    address: formatAddress(primaryAddress) || formatAddress(order.deliveryAddress),
  };
}

export function OrdersClient({ orders }: { orders: AdminOrder[] }) {
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | AdminOrder["status"]>("all");
  const [userProfilesById, setUserProfilesById] = useState<Record<string, ProfileDto>>({});

  useEffect(() => {
    let cancelled = false;

    fetch("/api/admin/users")
      .then(async (response) => {
        const payload = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          data?: ProfileDto[];
        };

        if (!response.ok || !payload.success || !Array.isArray(payload.data) || cancelled) {
          return;
        }

        const mapped = payload.data.reduce<Record<string, ProfileDto>>((acc, profile) => {
          if (profile.userId?.trim()) {
            acc[profile.userId.trim()] = profile;
          }
          return acc;
        }, {});

        setUserProfilesById(mapped);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...orders]
      .filter((order) => {
        if (status !== "all" && order.status !== status) return false;
        if (!query) return true;
        return [order.id, order.customerName, order.customerEmail, order.storeId, order.productId, order.shippingAwb]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [orders, search, status]);

  const pendingCount = sorted.filter((order) => ["placed", "packed", "out-for-delivery"].includes(order.status)).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-2.5 rounded-[1.25rem] border border-border/70 bg-card/85 p-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_auto_auto]">
        <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order, customer, store, AWB" />
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | AdminOrder["status"])} className="min-h-11 rounded-full border border-input bg-background px-4 py-2 text-sm">
          <option value="all">All statuses</option>
          {statuses.map((entry) => (
            <option key={entry} value={entry}>{entry}</option>
          ))}
        </select>
        <div className="flex items-center rounded-full border border-border bg-background px-4 py-2 text-sm text-[#5f5047]">
          {sorted.length} orders • {pendingCount} pending
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
        <AdminEmptyState title="No orders matched" description="Broaden the search or status filter to inspect more of the fulfillment queue." />
      ) : viewMode === "table" ? (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="app-table-head text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5">Order</th>
                  <th className="px-3 py-2.5">Customer</th>
                  <th className="px-3 py-2.5">Customization</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Payment</th>
                  <th className="px-3 py-2.5">Amount</th>
                  <th className="px-3 py-2.5">Created</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((order) => {
                  const profile = order.customerUserId ? userProfilesById[order.customerUserId] : undefined;
                  const customer = getCustomerDetails(order, profile);
                  return (
                    <tr key={order.id} className="border-t border-border align-top">
                      <td className="px-3 py-2.5 font-medium">
                        <p>{order.id}</p>
                        <p className="text-xs font-normal text-muted-foreground">Qty {order.quantity}</p>
                        <p className="text-xs font-normal text-muted-foreground">Store {order.storeId}</p>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        <p className="text-sm font-medium text-foreground">{customer.name}</p>
                        <p>{customer.email ?? "No email"}</p>
                        <p>{customer.phone ?? "No phone"}</p>
                        {order.customerUserId ? <p>User {order.customerUserId}</p> : null}
                        {customer.address ? <p className="line-clamp-2">{customer.address}</p> : null}
                      </td>
                      <td className="px-3 py-2.5"><CustomizationPreview customization={order.customization} /></td>
                      <td className="px-3 py-2.5"><Badge variant="secondary">{order.status}</Badge></td>
                      <td className="px-3 py-2.5 text-xs text-muted-foreground">
                        {(order.paymentMethod ?? "razorpay").toUpperCase()} · {order.transactionStatus ?? "pending"}
                        <br />
                        {(order.shippingProvider ?? "delhivery").toUpperCase()} · {order.shippingProviderStatus ?? "pending-shipment"}
                        <br />
                        AWB {order.shippingAwb ?? "-"}
                      </td>
                      <td className="px-3 py-2.5">₹{order.totalAmount}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="px-3 py-2.5"><div className="flex justify-end"><OrderRowActions order={order} /></div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-3">
          {sorted.map((order) => {
            const profile = order.customerUserId ? userProfilesById[order.customerUserId] : undefined;
            const customer = getCustomerDetails(order, profile);
            return (
              <Card key={order.id} className="border-border/70 bg-background/80">
                <CardContent className="flex min-h-32 items-start justify-between gap-3 p-3.5">
                  <div className="space-y-1.5">
                    <p className="font-semibold">{order.id}</p>
                    <p className="text-sm text-[#5f5047]">{customer.name} • Qty {order.quantity}</p>
                    <p className="text-xs text-[#74655c]">{customer.email ?? "No email"} • {customer.phone ?? "No phone"}</p>
                    <p className="text-xs text-[#74655c]">Store {order.storeId} • Product {order.productId}</p>
                    <p className="text-xs text-[#74655c]">{(order.paymentMethod ?? "razorpay").toUpperCase()} • {order.transactionStatus ?? "pending"}</p>
                    <p className="text-xs text-[#74655c]">{(order.shippingProvider ?? "delhivery").toUpperCase()} • {order.shippingProviderStatus ?? "pending-shipment"}</p>
                    {customer.address ? <p className="text-xs text-[#74655c] line-clamp-2">{customer.address}</p> : null}
                    <CustomizationPreview customization={order.customization} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge variant="secondary">{order.status}</Badge>
                    <p className="font-semibold">₹{order.totalAmount}</p>
                    <OrderRowActions order={order} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {sorted.map((order) => {
            const profile = order.customerUserId ? userProfilesById[order.customerUserId] : undefined;
            const customer = getCustomerDetails(order, profile);
            return (
              <Card key={order.id} className="border-border/70 bg-background/80">
                <CardContent className="flex min-h-44 flex-col space-y-2 p-4">
                  <p className="font-semibold">{order.id}</p>
                  <p className="text-sm text-[#5f5047]">{customer.name}</p>
                  <p className="text-xs text-[#74655c]">{customer.email ?? "No email"}</p>
                  <p className="text-xs text-[#74655c]">{customer.phone ?? "No phone"}</p>
                  <p className="text-sm text-[#5f5047]">{order.status}</p>
                  <p className="text-xs text-[#74655c]">{(order.paymentMethod ?? "razorpay").toUpperCase()} · {order.transactionStatus ?? "pending"}</p>
                  <p className="text-xs text-[#74655c]">{(order.shippingProvider ?? "delhivery").toUpperCase()} · {order.shippingProviderStatus ?? "pending-shipment"}</p>
                  <CustomizationPreview customization={order.customization} />
                  <p className="font-semibold">₹{order.totalAmount}</p>
                  <div className="mt-auto"><OrderRowActions order={order} /></div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomizationPreview({ customization }: { customization?: AdminOrder["customization"] }) {
  const images = customization?.images ?? [];
  if (!images.length) {
    return <p className="text-xs text-muted-foreground">No customization media</p>;
  }

  const preview = images.slice(0, 3);
  const remaining = images.length - preview.length;

  return (
    <div className="flex items-center gap-1.5">
      {preview.map((image, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${image}-${index}`}
          src={image}
          alt={`Customization ${index + 1}`}
          className="h-9 w-9 rounded border border-border object-cover"
        />
      ))}
      {remaining > 0 ? (
        <span className="rounded border border-border bg-muted px-2 py-1 text-xs text-muted-foreground">+{remaining}</span>
      ) : null}
    </div>
  );
}

function OrderRowActions({ order }: { order: AdminOrder }) {
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

  const retryShipment = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/retry`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to retry shipment");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to retry shipment");
    } finally {
      setSaving(false);
    }
  };

  const editShipment = async () => {
    const name = window.prompt("Consignee name (leave blank to skip):", "") ?? "";
    const phone = window.prompt("Consignee phone (leave blank to skip):", "") ?? "";
    const add = window.prompt("Consignee address (leave blank to skip):", "") ?? "";
    const productsDesc = window.prompt("Products description (leave blank to skip):", "") ?? "";

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/update`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(name.trim() ? { name } : {}),
          ...(phone.trim() ? { phone } : {}),
          ...(add.trim() ? { add } : {}),
          ...(productsDesc.trim() ? { productsDesc } : {}),
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update shipment");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to update shipment");
    } finally {
      setSaving(false);
    }
  };

  const cancelShipment = async () => {
    if (!window.confirm("Cancel this Delhivery shipment?")) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/cancel`, {
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to cancel shipment");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to cancel shipment");
    } finally {
      setSaving(false);
    }
  };

  const updateEwaybill = async () => {
    const dcn = window.prompt("Invoice number (dcn):", "") ?? "";
    const ewbn = window.prompt("E-waybill number (ewbn):", "") ?? "";

    if (!dcn.trim() || !ewbn.trim()) {
      setError("Invoice number and e-waybill number are required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/ewaybill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dcn, ewbn }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to update e-waybill");
        return;
      }
      window.location.reload();
    } catch {
      setError("Unable to update e-waybill");
    } finally {
      setSaving(false);
    }
  };

  const generateLabel = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/label?pdf=true&pdfSize=4R`, {
        method: "GET",
      });
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        data?: { labelUrl?: string };
        error?: { message?: string };
      };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to generate shipping label");
        return;
      }

      if (payload.data?.labelUrl) {
        window.open(payload.data.labelUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("Label generated but URL is unavailable in response");
      }
    } catch {
      setError("Unable to generate shipping label");
    } finally {
      setSaving(false);
    }
  };

  const schedulePickup = async () => {
    const pickupLocation = window.prompt("Pickup location name:", order.pickupAddress?.receiverName ?? order.storeId) ?? "";
    const pickupDate = window.prompt("Pickup date (YYYY-MM-DD):", new Date().toISOString().slice(0, 10)) ?? "";
    const pickupTime = window.prompt("Pickup time (HH:mm:ss):", "11:00:00") ?? "";
    const expectedPackageCountRaw = window.prompt("Expected package count:", String(Math.max(1, order.quantity || 1))) ?? "";

    if (!pickupLocation.trim() || !pickupDate.trim() || !pickupTime.trim()) {
      setError("Pickup location, date, and time are required");
      return;
    }

    const expectedPackageCount = Number(expectedPackageCountRaw);
    if (!Number.isFinite(expectedPackageCount) || expectedPackageCount < 1) {
      setError("Expected package count must be a positive number");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/pickup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pickupLocation,
          pickupDate,
          pickupTime,
          expectedPackageCount,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; error?: { message?: string } };
      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "Unable to schedule pickup");
        return;
      }

      window.location.reload();
    } catch {
      setError("Unable to schedule pickup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild size="sm" variant="outline">
        <Link href={`/admin/orders/${encodeURIComponent(order.id)}`}>
          <Eye className="h-4 w-4" /> View
        </Link>
      </Button>

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

      <Button size="sm" variant="outline" onClick={() => void retryShipment()} disabled={saving}>
        Retry Ship
      </Button>

      <Button size="sm" variant="outline" onClick={() => void editShipment()} disabled={saving || !order.shippingAwb}>
        Edit Ship
      </Button>

      <Button size="sm" variant="destructive" onClick={() => void cancelShipment()} disabled={saving || !order.shippingAwb}>
        Cancel Ship
      </Button>

      <Button size="sm" variant="outline" onClick={() => void updateEwaybill()} disabled={saving || !order.shippingAwb}>
        Update EWB
      </Button>

      <Button size="sm" variant="outline" onClick={() => void generateLabel()} disabled={saving || !order.shippingAwb}>
        Label
      </Button>

      <Button size="sm" variant="outline" onClick={() => void schedulePickup()} disabled={saving}>
        Pickup
      </Button>

      {order.shippingAwb ? (
        <Button asChild size="sm" variant="outline">
          <Link
            href={`https://www.delhivery.com/track/package/${encodeURIComponent(order.shippingAwb)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Track
          </Link>
        </Button>
      ) : null}

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
