"use client";

import Link from "next/link";
import { useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock3,
  FileDown,
  FileText,
  MapPin,
  Package2,
  Pencil,
  RefreshCcw,
  Route,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import { AdminOrderDto } from "@/types/api";

type ShipmentActionOrder = Pick<
  AdminOrderDto,
  | "id"
  | "storeId"
  | "orderRef"
  | "quantity"
  | "status"
  | "shippingProvider"
  | "shippingProviderStatus"
  | "shippingAwb"
  | "shippingPickupRequestId"
  | "pickupAddress"
>;

type PickupFormState = {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  expectedPackageCount: string;
};

type EditShipmentFormState = {
  name: string;
  phone: string;
  add: string;
  productsDesc: string;
};

type EwaybillFormState = {
  dcn: string;
  ewbn: string;
};

type ApiErrorPayload = {
  error?: unknown;
};

async function getApiErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as ApiErrorPayload;
  const messages = collectApiMessages(payload.error);
  return messages[0] ?? fallback;
}

function collectApiMessages(payload: unknown, depth = 0): string[] {
  if (depth > 5 || payload === null || payload === undefined) {
    return [];
  }

  if (typeof payload === "string") {
    const value = payload.trim();
    return value ? [value] : [];
  }

  if (typeof payload === "number" || typeof payload === "boolean") {
    return [String(payload)];
  }

  if (Array.isArray(payload)) {
    return Array.from(new Set(payload.flatMap((entry) => collectApiMessages(entry, depth + 1))));
  }

  if (typeof payload !== "object") {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const prioritizedKeys = [
    "message",
    "pickup_location",
    "error",
    "errors",
    "details",
    "upstream",
    "detail",
    "reason",
    "description",
  ];

  const messages: string[] = [];
  for (const key of prioritizedKeys) {
    if (key in record) {
      messages.push(...collectApiMessages(record[key], depth + 1));
    }
  }

  if (!messages.length) {
    for (const value of Object.values(record)) {
      messages.push(...collectApiMessages(value, depth + 1));
    }
  }

  return Array.from(new Set(messages.map((value) => value.trim()).filter(Boolean)));
}

function parseDownloadFileName(headerValue: string | null, fallback: string) {
  if (!headerValue) {
    return fallback;
  }

  const match = headerValue.match(/filename="?([^";]+)"?/i);
  return match?.[1]?.trim() || fallback;
}

function triggerBrowserDownload(blob: Blob, fileName: string) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

function triggerJsonDownload(data: unknown, fileName: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });

  triggerBrowserDownload(blob, fileName);
}

function buildDefaultPickupForm(order: ShipmentActionOrder): PickupFormState {
  return {
    pickupLocation: order.pickupAddress?.receiverName ?? order.storeId ?? "",
    pickupDate: new Date().toISOString().slice(0, 10),
    pickupTime: "11:00:00",
    expectedPackageCount: String(Math.max(1, order.quantity || 1)),
  };
}

function buildDefaultEditForm(): EditShipmentFormState {
  return {
    name: "",
    phone: "",
    add: "",
    productsDesc: "",
  };
}

function buildDefaultEwaybillForm(): EwaybillFormState {
  return {
    dcn: "",
    ewbn: "",
  };
}

function normalizePickupTime(value: string) {
  if (/^\d{2}:\d{2}:\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{2}:\d{2}$/.test(value)) {
    return `${value}:00`;
  }

  return value;
}

type DelhiveryDocumentType = "SIGNATURE_URL" | "RVP_QC_IMAGE" | "EPOD" | "SELLER_RETURN_IMAGE";

export function AdminOrderShipmentActions({
  order,
  className,
  compact = false,
}: {
  order: ShipmentActionOrder;
  className?: string;
  compact?: boolean;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [ewaybillError, setEwaybillError] = useState<string | null>(null);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [ewaybillOpen, setEwaybillOpen] = useState(false);
  const [pickupOpen, setPickupOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditShipmentFormState>(() => buildDefaultEditForm());
  const [ewaybillForm, setEwaybillForm] = useState<EwaybillFormState>(() => buildDefaultEwaybillForm());
  const [pickupForm, setPickupForm] = useState<PickupFormState>(() => buildDefaultPickupForm(order));

  const isDelhiveryOrder = (order.shippingProvider ?? "delhivery") === "delhivery";
  if (!isDelhiveryOrder) {
    return null;
  }

  const pickupButtonLabel = order.shippingPickupRequestId ? "Pickup Again" : "Request Pickup";
  const actionButtonClassName = compact ? "w-full justify-start" : undefined;
  const hasAwb = Boolean(order.shippingAwb?.trim());
  const missingAwbMessage = "Create / Retry shipment first to generate an AWB. Edit, E-waybill, label, and cancel need an existing shipment.";
  const workflowSteps = [
    "Create / Retry",
    "Edit Ship",
    "Update EWB",
    "Shipping Label PDF",
    pickupButtonLabel,
    order.shippingAwb ? "Track" : "Track later",
    "Cancel last",
  ];

  const resetPickupState = () => {
    setPickupForm(buildDefaultPickupForm(order));
    setPickupError(null);
  };

  const resetEditState = () => {
    setEditForm(buildDefaultEditForm());
    setEditError(null);
  };

  const resetEwaybillState = () => {
    setEwaybillForm(buildDefaultEwaybillForm());
    setEwaybillError(null);
  };

  const handleEditOpenChange = (open: boolean) => {
    setEditOpen(open);
    if (open) {
      setError(null);
      resetEditState();
      return;
    }

    resetEditState();
  };

  const handleEwaybillOpenChange = (open: boolean) => {
    setEwaybillOpen(open);
    if (open) {
      setError(null);
      resetEwaybillState();
      return;
    }

    resetEwaybillState();
  };

  const handlePickupOpenChange = (open: boolean) => {
    setPickupOpen(open);
    if (open) {
      setError(null);
      resetPickupState();
      return;
    }

    resetPickupState();
  };

  const beginAction = () => {
    setSaving(true);
    setError(null);
    setEditError(null);
    setEwaybillError(null);
    setPickupError(null);
  };

  const reloadPage = () => {
    window.location.reload();
  };

  const retryShipment = async () => {
    beginAction();

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/retry`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to retry shipment"));
        return;
      }

      reloadPage();
    } catch {
      setError("Unable to retry shipment");
    } finally {
      setSaving(false);
    }
  };

  const editShipment = async () => {
    if (!hasAwb) {
      setEditError(missingAwbMessage);
      return;
    }

    const name = editForm.name.trim();
    const phone = editForm.phone.trim();
    const add = editForm.add.trim();
    const productsDesc = editForm.productsDesc.trim();

    if (!name && !phone && !add && !productsDesc) {
      setEditError("Provide at least one shipment field to update");
      return;
    }

    beginAction();
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

      if (!response.ok) {
        setEditError(await getApiErrorMessage(response, "Unable to update shipment"));
        return;
      }

      setEditOpen(false);
      reloadPage();
    } catch {
      setEditError("Unable to update shipment");
    } finally {
      setSaving(false);
    }
  };

  const cancelShipment = async () => {
    if (!hasAwb) {
      setError(missingAwbMessage);
      return;
    }

    if (!window.confirm("Cancel this Delhivery shipment?")) {
      return;
    }

    beginAction();
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/cancel`, {
        method: "POST",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to cancel shipment"));
        return;
      }

      reloadPage();
    } catch {
      setError("Unable to cancel shipment");
    } finally {
      setSaving(false);
    }
  };

  const updateEwaybill = async () => {
    if (!hasAwb) {
      setEwaybillError(missingAwbMessage);
      return;
    }

    const dcn = ewaybillForm.dcn.trim();
    const ewbn = ewaybillForm.ewbn.trim();

    if (!dcn || !ewbn) {
      setEwaybillError("Invoice number and e-waybill number are required");
      return;
    }

    beginAction();
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/ewaybill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dcn, ewbn }),
      });

      if (!response.ok) {
        setEwaybillError(await getApiErrorMessage(response, "Unable to update e-waybill"));
        return;
      }

      setEwaybillOpen(false);
      reloadPage();
    } catch {
      setEwaybillError("Unable to update e-waybill");
    } finally {
      setSaving(false);
    }
  };

  const downloadLabelPdf = async () => {
    if (!hasAwb) {
      setError(missingAwbMessage);
      return;
    }

    beginAction();
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/label-download?pdfSize=4R`, {
        method: "GET",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to download shipping label PDF"));
        return;
      }

      const blob = await response.blob();
      const fallbackName = `delhivery-label-${order.shippingAwb ?? order.id}-4r.pdf`;
      const fileName = parseDownloadFileName(response.headers.get("Content-Disposition"), fallbackName);
      triggerBrowserDownload(blob, fileName);
    } catch {
      setError("Unable to download shipping label PDF");
    } finally {
      setSaving(false);
    }
  };

  const downloadLabelData = async () => {
    if (!hasAwb) {
      setError(missingAwbMessage);
      return;
    }

    beginAction();
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/shipping/label?pdf=false&pdfSize=4R`, {
        method: "GET",
      });

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to download shipping label data"));
        return;
      }

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        data?: {
          labelData?: unknown;
          raw?: unknown;
        };
      };

      if (!payload.success) {
        setError("Unable to download shipping label data");
        return;
      }

      triggerJsonDownload(
        payload.data?.labelData ?? payload.data?.raw ?? payload.data ?? {},
        `delhivery-label-data-${order.shippingAwb ?? order.id}.json`,
      );
    } catch {
      setError("Unable to download shipping label data");
    } finally {
      setSaving(false);
    }
  };

  const openPackageDocument = (docType: DelhiveryDocumentType) => {
    if (!hasAwb) {
      setError(missingAwbMessage);
      return;
    }

    window.open(
      `/api/admin/orders/${order.id}/shipping/document-download?docType=${encodeURIComponent(docType)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const schedulePickup = async () => {
    const pickupLocation = pickupForm.pickupLocation.trim();
    const pickupDate = pickupForm.pickupDate.trim();
    const pickupTime = normalizePickupTime(pickupForm.pickupTime.trim());

    if (!pickupLocation || !pickupDate || !pickupTime) {
      setPickupError("Pickup location, date, and time are required");
      return;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(pickupDate)) {
      setPickupError("Pickup date must be in YYYY-MM-DD format");
      return;
    }

    if (!/^\d{2}:\d{2}:\d{2}$/.test(pickupTime)) {
      setPickupError("Pickup time must be in HH:mm:ss format");
      return;
    }

    const expectedPackageCount = Number(pickupForm.expectedPackageCount);
    if (!Number.isFinite(expectedPackageCount) || expectedPackageCount < 1) {
      setPickupError("Expected package count must be a positive number");
      return;
    }

    beginAction();
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

      if (!response.ok) {
        setPickupError(await getApiErrorMessage(response, "Unable to schedule pickup"));
        return;
      }

      setPickupOpen(false);
      reloadPage();
    } catch {
      setPickupError("Unable to schedule pickup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("w-full space-y-3", compact && "space-y-2", className)}>
      {compact ? (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#74655c]">
          <Badge className="bg-[#fff4df] text-[#9e7526] hover:bg-[#fff4df]">
            {order.shippingProviderStatus ?? "pending-shipment"}
          </Badge>
          {order.shippingAwb ? <Badge variant="outline">AWB {order.shippingAwb}</Badge> : null}
          {order.shippingPickupRequestId ? <Badge variant="outline">Pickup {order.shippingPickupRequestId}</Badge> : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#74655c]">
          <Badge className="bg-[#fff4df] text-[#9e7526] hover:bg-[#fff4df]">Suggested Delhivery flow</Badge>
          {!hasAwb ? <Badge variant="outline">AWB pending</Badge> : null}
          {workflowSteps.map((step, index) => (
            <span
              key={`${step}-${index}`}
              className="rounded-full border border-[#ead8b2] bg-white/80 px-3 py-1 font-medium"
            >
              {index + 1}. {step}
            </span>
          ))}
        </div>
      )}

      {!hasAwb ? (
        <p className="text-xs text-[#8a6a2d]">
          AWB is not created for this row yet. Use Create / Retry first, then edit, update E-waybill, download label, and cancel will submit normally.
        </p>
      ) : null}

      {hasAwb && !compact ? (
        <p className="text-xs text-[#74655c]">
          Shipping Label PDF is the Delhivery AWB label from the packing-slip API. Label Data downloads the raw payload for custom rendering, not a receipt.
        </p>
      ) : null}

      {hasAwb && !compact ? (
        <p className="text-xs text-[#74655c]">
          EPOD, Signature, and QC Images come from Delhivery's package-document API and are separate from the shipping label.
        </p>
      ) : null}

      <div className={cn("flex flex-wrap gap-2", compact && "grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3") }>
        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => void retryShipment()} disabled={saving}>
          <RefreshCcw className="h-3.5 w-3.5" />
          Create / Retry
        </Button>

        <Dialog open={editOpen} onOpenChange={handleEditOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className={actionButtonClassName} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
              <Pencil className="h-3.5 w-3.5" />
              Edit Ship
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden border-[#ead8b2] bg-[linear-gradient(145deg,rgba(255,252,246,0.98),rgba(250,241,221,0.98)_55%,rgba(243,224,185,0.9)_100%)] p-0 shadow-[0_40px_120px_-48px_rgba(116,84,26,0.55)] sm:max-w-3xl">
            <div className="relative grid max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[0.92fr_1.08fr]">
              <div className="space-y-5 border-b border-[#ead8b2] bg-white/45 p-6 lg:border-b-0 lg:border-r">
                <DialogHeader className="space-y-3 text-left">
                  <Badge className="w-fit bg-[#cd9933] text-white hover:bg-[#cd9933]">Delhivery shipment edit</Badge>
                  <DialogTitle className="font-display text-3xl tracking-[-0.05em] text-[#2f2217]">
                    Update consignee and parcel details
                  </DialogTitle>
                  <DialogDescription className="max-w-md leading-6 text-[#6d5a4d]">
                    Correct destination details before the label desk reprints or the pickup team reattempts handoff.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-[1.45rem] border border-[#e4cf9e] bg-white/80 p-4 shadow-[0_18px_45px_-38px_rgba(116,84,26,0.35)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Package2 className="h-4 w-4 text-[#cd9933]" />
                    Shipment context
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-[#5f5047]">
                    <p><span className="font-semibold text-foreground">Order:</span> {order.orderRef}</p>
                    <p><span className="font-semibold text-foreground">Store:</span> {order.storeId}</p>
                    <p><span className="font-semibold text-foreground">AWB:</span> {order.shippingAwb ?? "Not created yet"}</p>
                    <p><span className="font-semibold text-foreground">Shipment status:</span> {order.shippingProviderStatus ?? "pending-shipment"}</p>
                  </div>
                </div>

                <div className="rounded-[1.45rem] border border-dashed border-[#e4cf9e] bg-[#fff9ee] p-4 text-sm text-[#5f5047]">
                  Leave any field blank if it should remain unchanged. At least one field is required before the update can be submitted.
                </div>

                {!hasAwb ? (
                  <div className="rounded-[1.45rem] border border-dashed border-[#e4cf9e] bg-[#fff9ee] p-4 text-sm text-[#5f5047]">
                    This row does not have an AWB yet. Create the shipment first, then apply shipment edits.
                  </div>
                ) : null}
              </div>

              <form
                className="bg-white/72 p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void editShipment();
                }}
              >
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-name-${order.id}`}>Consignee name</Label>
                      <Input
                        id={`edit-name-${order.id}`}
                        value={editForm.name}
                        onChange={(event) => setEditForm((current) => ({ ...current, name: event.target.value }))}
                        className="border-[#e4cf9e] bg-white"
                        placeholder="Receiver name"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor={`edit-phone-${order.id}`}>Consignee phone</Label>
                      <Input
                        id={`edit-phone-${order.id}`}
                        value={editForm.phone}
                        onChange={(event) => setEditForm((current) => ({ ...current, phone: event.target.value }))}
                        className="border-[#e4cf9e] bg-white"
                        placeholder="Receiver phone"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-address-${order.id}`}>Consignee address</Label>
                    <textarea
                      id={`edit-address-${order.id}`}
                      value={editForm.add}
                      onChange={(event) => setEditForm((current) => ({ ...current, add: event.target.value }))}
                      className="flex min-h-28 w-full rounded-md border border-[#e4cf9e] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Updated address line for Delhivery"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`edit-products-${order.id}`}>Products description</Label>
                    <textarea
                      id={`edit-products-${order.id}`}
                      value={editForm.productsDesc}
                      onChange={(event) => setEditForm((current) => ({ ...current, productsDesc: event.target.value }))}
                      className="flex min-h-24 w-full rounded-md border border-[#e4cf9e] bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      placeholder="Describe the parcel contents for the updated shipment"
                    />
                  </div>
                </div>

                {editError ? <p className="mt-4 text-sm text-destructive">{editError}</p> : null}

                <DialogFooter className="mt-6 border-t border-[#ead8b2] pt-4">
                  <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={saving}>
                    Close
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Updating..." : "Apply Shipment Update"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={ewaybillOpen} onOpenChange={handleEwaybillOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className={actionButtonClassName} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
              <FileText className="h-3.5 w-3.5" />
              Update EWB
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden border-[#ead8b2] bg-[linear-gradient(145deg,rgba(255,252,246,0.98),rgba(250,241,221,0.98)_55%,rgba(243,224,185,0.9)_100%)] p-0 shadow-[0_40px_120px_-48px_rgba(116,84,26,0.55)] sm:max-w-2xl">
            <div className="relative grid max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
              <div className="space-y-5 border-b border-[#ead8b2] bg-white/50 p-6 lg:border-b-0 lg:border-r">
                <DialogHeader className="space-y-3 text-left">
                  <Badge className="w-fit bg-[#cd9933] text-white hover:bg-[#cd9933]">Delhivery e-waybill</Badge>
                  <DialogTitle className="font-display text-3xl tracking-[-0.05em] text-[#2f2217]">
                    Attach invoice and e-waybill details
                  </DialogTitle>
                  <DialogDescription className="max-w-md leading-6 text-[#6d5a4d]">
                    Keep the Delhivery shipment aligned with invoice paperwork before the package moves further in the route.
                  </DialogDescription>
                </DialogHeader>

                <div className="rounded-[1.45rem] border border-[#e4cf9e] bg-white/82 p-4 shadow-[0_18px_45px_-38px_rgba(116,84,26,0.35)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <FileText className="h-4 w-4 text-[#cd9933]" />
                    Reference snapshot
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-[#5f5047]">
                    <p><span className="font-semibold text-foreground">Order:</span> {order.orderRef}</p>
                    <p><span className="font-semibold text-foreground">AWB:</span> {order.shippingAwb ?? "Not created yet"}</p>
                    <p><span className="font-semibold text-foreground">Store:</span> {order.storeId}</p>
                  </div>
                </div>

                <div className="rounded-[1.45rem] border border-dashed border-[#e4cf9e] bg-[#fff9ee] p-4 text-sm text-[#5f5047]">
                  Delhivery requires both values. Use the invoice number as <span className="font-semibold text-foreground">DCN</span> and the transport e-waybill as <span className="font-semibold text-foreground">EWBN</span>.
                </div>

                {!hasAwb ? (
                  <div className="rounded-[1.45rem] border border-dashed border-[#e4cf9e] bg-[#fff9ee] p-4 text-sm text-[#5f5047]">
                    This row does not have an AWB yet. Create the shipment first, then attach invoice and e-waybill details.
                  </div>
                ) : null}
              </div>

              <form
                className="bg-white/72 p-6"
                onSubmit={(event) => {
                  event.preventDefault();
                  void updateEwaybill();
                }}
              >
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor={`ewaybill-dcn-${order.id}`}>Invoice number (DCN)</Label>
                    <Input
                      id={`ewaybill-dcn-${order.id}`}
                      value={ewaybillForm.dcn}
                      onChange={(event) => setEwaybillForm((current) => ({ ...current, dcn: event.target.value }))}
                      className="border-[#e4cf9e] bg-white"
                      placeholder="Invoice reference"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`ewaybill-ewbn-${order.id}`}>E-waybill number (EWBN)</Label>
                    <Input
                      id={`ewaybill-ewbn-${order.id}`}
                      value={ewaybillForm.ewbn}
                      onChange={(event) => setEwaybillForm((current) => ({ ...current, ewbn: event.target.value }))}
                      className="border-[#e4cf9e] bg-white"
                      placeholder="Government e-waybill number"
                    />
                  </div>
                </div>

                {ewaybillError ? <p className="mt-4 text-sm text-destructive">{ewaybillError}</p> : null}

                <DialogFooter className="mt-6 border-t border-[#ead8b2] pt-4">
                  <Button type="button" variant="outline" onClick={() => setEwaybillOpen(false)} disabled={saving}>
                    Close
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Updating..." : "Save E-waybill"}
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>

        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => void downloadLabelPdf()} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <FileDown className="h-3.5 w-3.5" />
          Shipping Label PDF
        </Button>

        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => void downloadLabelData()} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <FileText className="h-3.5 w-3.5" />
          Label Data
        </Button>

        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => openPackageDocument("EPOD")} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <FileDown className="h-3.5 w-3.5" />
          EPOD
        </Button>

        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => openPackageDocument("SIGNATURE_URL")} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <FileText className="h-3.5 w-3.5" />
          Signature
        </Button>

        <Button size="sm" variant="outline" className={actionButtonClassName} onClick={() => openPackageDocument("RVP_QC_IMAGE")} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <FileText className="h-3.5 w-3.5" />
          QC Images
        </Button>

        <Dialog open={pickupOpen} onOpenChange={handlePickupOpenChange}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline" className={actionButtonClassName} disabled={saving}>
              <Truck className="h-3.5 w-3.5" />
              {pickupButtonLabel}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[calc(100vh-2rem)] overflow-hidden border-[#ead8b2] bg-[linear-gradient(145deg,rgba(255,252,246,0.98),rgba(250,241,221,0.98)_55%,rgba(243,224,185,0.92)_100%)] p-0 shadow-[0_40px_120px_-48px_rgba(116,84,26,0.55)] sm:max-w-3xl">
        <div className="relative max-h-[calc(100vh-2rem)] overflow-y-auto">
          <div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_right,rgba(205,153,51,0.25),transparent_58%)]" />

          <div className="relative grid gap-0 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-5 p-6">
              <DialogHeader className="space-y-3 text-left">
                <div className="flex flex-wrap gap-2">
                  <Badge className="w-fit bg-[#cd9933] text-white hover:bg-[#cd9933]">Delhivery pickup</Badge>
                  {order.shippingPickupRequestId ? (
                    <Badge className="w-fit bg-white/90 text-[#9e7526] hover:bg-white/90">
                      Existing request {order.shippingPickupRequestId}
                    </Badge>
                  ) : null}
                </div>
                <DialogTitle className="font-display text-3xl tracking-[-0.05em] text-[#2f2217]">
                  Schedule pickup without browser prompts
                </DialogTitle>
                <DialogDescription className="max-w-xl leading-6 text-[#6d5a4d]">
                  Use this panel when the shipment needs a fresh pickup request or a schedule correction. Shipment creation already attempts one pickup request automatically.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.45rem] border border-[#e4cf9e] bg-white/75 p-4 shadow-[0_20px_45px_-38px_rgba(116,84,26,0.35)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <Package2 className="h-4 w-4 text-[#cd9933]" />
                    Shipment context
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-[#5f5047]">
                    <p><span className="font-semibold text-foreground">Order:</span> {order.orderRef}</p>
                    <p><span className="font-semibold text-foreground">Store:</span> {order.storeId}</p>
                    <p><span className="font-semibold text-foreground">AWB:</span> {order.shippingAwb ?? "Not created yet"}</p>
                    <p><span className="font-semibold text-foreground">Package count:</span> {Math.max(1, order.quantity || 1)}</p>
                  </div>
                </div>

                <div className="rounded-[1.45rem] border border-[#e4cf9e] bg-[#fff8ea] p-4 shadow-[0_20px_45px_-38px_rgba(116,84,26,0.35)]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    <MapPin className="h-4 w-4 text-[#cd9933]" />
                    Pickup source
                  </div>
                  <div className="mt-3 space-y-1.5 text-sm text-[#5f5047]">
                    {order.pickupAddress ? (
                      <>
                        <p className="font-semibold text-foreground">{order.pickupAddress.receiverName ?? order.storeId}</p>
                        <p>{order.pickupAddress.receiverPhone ?? "Phone unavailable"}</p>
                        <p>{order.pickupAddress.line1}</p>
                        <p>{order.pickupAddress.city}, {order.pickupAddress.state} {order.pickupAddress.pinCode}</p>
                      </>
                    ) : (
                      <p>Pickup address is not stored on this row yet, so the form falls back to the store ID.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-[1.6rem] border border-[#e4cf9e] bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(255,247,229,0.94))] p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <AlertTriangle className="h-4 w-4 text-[#cd9933]" />
                  Recommended checks
                </div>
                <div className="mt-3 space-y-2 text-sm text-[#5f5047]">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#cd9933] text-xs font-semibold text-white">1</span>
                    <p>Create the shipment first if the AWB is still missing.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#cd9933] text-xs font-semibold text-white">2</span>
                    <p>Edit shipment data or update the e-waybill before requesting a corrected pickup slot.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#cd9933] text-xs font-semibold text-white">3</span>
                    <p>Use Pickup Again when the original Delhivery pickup request was missed or needs a new time window.</p>
                  </div>
                </div>
              </div>
            </div>

            <form
              className="border-t border-[#ead8b2] bg-white/68 p-6 lg:border-l lg:border-t-0"
              onSubmit={(event) => {
                event.preventDefault();
                void schedulePickup();
              }}
            >
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor={`pickup-location-${order.id}`}>Pickup location name</Label>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7526]" />
                    <Input
                      id={`pickup-location-${order.id}`}
                      value={pickupForm.pickupLocation}
                      onChange={(event) => setPickupForm((current) => ({ ...current, pickupLocation: event.target.value }))}
                      className="border-[#e4cf9e] bg-white pl-10"
                      placeholder="Warehouse or pickup desk name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`pickup-date-${order.id}`}>Pickup date</Label>
                    <div className="relative">
                      <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7526]" />
                      <Input
                        id={`pickup-date-${order.id}`}
                        type="date"
                        value={pickupForm.pickupDate}
                        onChange={(event) => setPickupForm((current) => ({ ...current, pickupDate: event.target.value }))}
                        className="border-[#e4cf9e] bg-white pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`pickup-time-${order.id}`}>Pickup time</Label>
                    <div className="relative">
                      <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7526]" />
                      <Input
                        id={`pickup-time-${order.id}`}
                        type="time"
                        step={1}
                        value={pickupForm.pickupTime}
                        onChange={(event) => setPickupForm((current) => ({ ...current, pickupTime: event.target.value }))}
                        className="border-[#e4cf9e] bg-white pl-10"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`pickup-packages-${order.id}`}>Expected package count</Label>
                  <div className="relative">
                    <Package2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9e7526]" />
                    <Input
                      id={`pickup-packages-${order.id}`}
                      type="number"
                      min={1}
                      step={1}
                      value={pickupForm.expectedPackageCount}
                      onChange={(event) => setPickupForm((current) => ({ ...current, expectedPackageCount: event.target.value }))}
                      className="border-[#e4cf9e] bg-white pl-10"
                    />
                  </div>
                </div>

                <div className="rounded-[1.4rem] border border-dashed border-[#e4cf9e] bg-[#fffaf0] px-4 py-3 text-sm text-[#5f5047]">
                  Delhivery expects the pickup time in <span className="font-semibold text-foreground">HH:mm:ss</span> format. If your browser returns only hours and minutes, this form will append the seconds automatically.
                </div>
              </div>

              {pickupError ? <p className="mt-4 text-sm text-destructive">{pickupError}</p> : null}

              <DialogFooter className="mt-6 border-t border-[#ead8b2] pt-4">
                <Button type="button" variant="outline" onClick={() => setPickupOpen(false)} disabled={saving}>
                  Close
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Scheduling..." : order.shippingPickupRequestId ? "Update Pickup Request" : "Schedule Pickup"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </div>
          </DialogContent>
        </Dialog>

        {order.shippingAwb ? (
          <Button asChild size="sm" variant="outline" className={actionButtonClassName}>
            <Link
              href={`https://www.delhivery.com/track/package/${encodeURIComponent(order.shippingAwb)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Route className="h-3.5 w-3.5" />
              Track
            </Link>
          </Button>
        ) : null}

        <Button size="sm" variant="destructive" className={actionButtonClassName} onClick={() => void cancelShipment()} disabled={saving} title={!hasAwb ? missingAwbMessage : undefined}>
          <XCircle className="h-3.5 w-3.5" />
          Cancel Ship
        </Button>
      </div>

      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}