"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  | "pickupAddress"
>;

async function getApiErrorMessage(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as {
    error?: { message?: string };
  };

  return payload.error?.message ?? fallback;
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

export function AdminOrderShipmentActions({
  order,
  className,
}: {
  order: ShipmentActionOrder;
  className?: string;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDelhiveryOrder = (order.shippingProvider ?? "delhivery") === "delhivery";
  if (!isDelhiveryOrder) {
    return null;
  }

  const reloadPage = () => {
    window.location.reload();
  };

  const retryShipment = async () => {
    setSaving(true);
    setError(null);

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

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to update shipment"));
        return;
      }

      reloadPage();
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

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to update e-waybill"));
        return;
      }

      reloadPage();
    } catch {
      setError("Unable to update e-waybill");
    } finally {
      setSaving(false);
    }
  };

  const downloadLabelPdf = async () => {
    setSaving(true);
    setError(null);
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

      if (!response.ok) {
        setError(await getApiErrorMessage(response, "Unable to schedule pickup"));
        return;
      }

      reloadPage();
    } catch {
      setError("Unable to schedule pickup");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
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

      <Button size="sm" variant="outline" onClick={() => void downloadLabelPdf()} disabled={saving || !order.shippingAwb}>
        Download Label PDF
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

      {error ? <p className="w-full text-xs text-destructive">{error}</p> : null}
    </div>
  );
}