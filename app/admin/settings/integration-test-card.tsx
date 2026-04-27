"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type RazorpayHealth = {
  configured: boolean;
  keyIdPresent: boolean;
  keySecretPresent: boolean;
  webhookSecretPresent: boolean;
  keyIdPreview?: string;
};

type DelhiveryHealth = {
  mode: "test" | "live";
  baseUrl: string;
  pincodePath: string;
  serviceability: {
    pinCode: string;
    serviceable: boolean;
    embargoed: boolean;
    remark?: string;
  };
  waybillAvailable: boolean;
  sampleWaybill?: string;
};

type WaybillSinglePayload = {
  waybill?: string;
  pool?: {
    insertedCount?: number;
    skippedCount?: number;
    totalRequested?: number;
  };
  raw?: unknown;
};

type WaybillBulkPayload = {
  count?: number;
  waybills?: string[];
  pool?: {
    insertedCount?: number;
    skippedCount?: number;
    totalRequested?: number;
  };
  raw?: unknown;
};

type WaybillMode = "single" | "bulk";

export function IntegrationTestCard() {
  const [pinCode, setPinCode] = useState("400001");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayHealth | null>(null);
  const [delhivery, setDelhivery] = useState<DelhiveryHealth | null>(null);
  const [waybillMode, setWaybillMode] = useState<WaybillMode>("single");
  const [waybillCountInput, setWaybillCountInput] = useState("25");
  const [isFetchingWaybills, setIsFetchingWaybills] = useState(false);
  const [waybillError, setWaybillError] = useState<string | null>(null);
  const [waybillSingle, setWaybillSingle] = useState<WaybillSinglePayload | null>(null);
  const [waybillBulk, setWaybillBulk] = useState<WaybillBulkPayload | null>(null);

  const runChecks = async () => {
    setIsChecking(true);
    setError(null);

    try {
      const [rzpRes, dlhRes] = await Promise.all([
        fetch("/api/admin/integrations/razorpay/health"),
        fetch(`/api/admin/integrations/delhivery/test?pinCode=${encodeURIComponent(pinCode)}`),
      ]);

      const rzpPayload = await rzpRes.json();
      const dlhPayload = await dlhRes.json();

      if (!rzpRes.ok || !rzpPayload.success) {
        throw new Error(rzpPayload?.error?.message ?? "Unable to test Razorpay config.");
      }

      if (!dlhRes.ok || !dlhPayload.success) {
        throw new Error(dlhPayload?.error?.message ?? "Unable to test Delhivery config.");
      }

      setRazorpay(rzpPayload.data as RazorpayHealth);
      setDelhivery(dlhPayload.data as DelhiveryHealth);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to run integration checks.");
    } finally {
      setIsChecking(false);
    }
  };

  const fetchWaybills = async () => {
    setIsFetchingWaybills(true);
    setWaybillError(null);
    setWaybillSingle(null);
    setWaybillBulk(null);

    try {
      let endpoint = "/api/admin/integrations/delhivery/waybill?mode=single";

      if (waybillMode === "bulk") {
        const count = Number(waybillCountInput);
        if (!Number.isFinite(count) || count < 1) {
          setWaybillError("Bulk count must be a positive number.");
          return;
        }

        endpoint = `/api/admin/integrations/delhivery/waybill?mode=bulk&count=${encodeURIComponent(String(Math.floor(count)))}`;
      }

      const response = await fetch(endpoint);
      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        data?: WaybillSinglePayload | WaybillBulkPayload;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message ?? "Unable to fetch Delhivery waybills.");
      }

      if (waybillMode === "single") {
        setWaybillSingle(payload.data as WaybillSinglePayload);
      } else {
        setWaybillBulk(payload.data as WaybillBulkPayload);
      }
    } catch (caughtError) {
      setWaybillError(caughtError instanceof Error ? caughtError.message : "Unable to fetch Delhivery waybills.");
    } finally {
      setIsFetchingWaybills(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-semibold">Payment & Delivery Health Check</p>
          <Badge variant="secondary">Admin</Badge>
        </div>

        <p className="text-sm text-muted-foreground">Validate Razorpay config and Delhivery serviceability/waybill setup in one click.</p>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={pinCode}
            onChange={(event) => setPinCode(event.target.value)}
            placeholder="Pincode"
            className="max-w-45"
          />
          <Button onClick={() => void runChecks()} disabled={isChecking || !pinCode.trim()}>
            {isChecking ? "Testing..." : "Run Integration Test"}
          </Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        {razorpay ? (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Razorpay</p>
            <p className="mt-1">Configured: {razorpay.configured ? "Yes" : "No"}</p>
            <p>Key ID: {razorpay.keyIdPresent ? razorpay.keyIdPreview ?? "Present" : "Missing"}</p>
            <p>Key Secret: {razorpay.keySecretPresent ? "Present" : "Missing"}</p>
            <p>Webhook Secret: {razorpay.webhookSecretPresent ? "Present" : "Missing"}</p>
          </div>
        ) : null}

        {delhivery ? (
          <div className="rounded-lg border border-border p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Delhivery</p>
            <p className="mt-1">Mode: {delhivery.mode.toUpperCase()}</p>
            <p>Base URL: {delhivery.baseUrl}</p>
            <p>Pincode: {delhivery.serviceability.pinCode}</p>
            <p>Serviceable: {delhivery.serviceability.serviceable ? "Yes" : "No"}</p>
            <p>Remark: {delhivery.serviceability.remark || "-"}</p>
            <p>Waybill available: {delhivery.waybillAvailable ? "Yes" : "No"}</p>
            <p>Sample waybill: {delhivery.sampleWaybill ?? "-"}</p>
          </div>
        ) : null}

        <div className="space-y-3 rounded-lg border border-border p-3 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">Delhivery Waybill Utility</p>
          <p>
            Prefetch waybills here and store them for later manifest creation. Avoid immediate fetch-and-use in the same flow.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={waybillMode}
              onChange={(event) => setWaybillMode(event.target.value as WaybillMode)}
              className="min-h-10 rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="single">Single</option>
              <option value="bulk">Bulk</option>
            </select>

            {waybillMode === "bulk" ? (
              <Input
                value={waybillCountInput}
                onChange={(event) => setWaybillCountInput(event.target.value)}
                placeholder="Count"
                inputMode="numeric"
                className="max-w-32"
              />
            ) : null}

            <Button onClick={() => void fetchWaybills()} disabled={isFetchingWaybills}>
              {isFetchingWaybills ? "Fetching..." : "Fetch Waybill"}
            </Button>
          </div>

          {waybillError ? <p className="text-sm text-destructive">{waybillError}</p> : null}

          {waybillSingle?.waybill ? (
            <div className="rounded-md border border-border/70 bg-background/80 p-2.5 text-xs">
              <p className="text-muted-foreground">Single waybill</p>
              <p className="font-mono text-sm text-foreground">{waybillSingle.waybill}</p>
              <p className="mt-1 text-muted-foreground">
                Pool insert: {waybillSingle.pool?.insertedCount ?? 0} inserted, {waybillSingle.pool?.skippedCount ?? 0} skipped
              </p>
            </div>
          ) : null}

          {Array.isArray(waybillBulk?.waybills) && waybillBulk.waybills.length ? (
            <div className="rounded-md border border-border/70 bg-background/80 p-2.5 text-xs">
              <p className="text-muted-foreground">
                Bulk waybills fetched: {waybillBulk.waybills.length}
                {typeof waybillBulk.count === "number" ? ` (requested ${waybillBulk.count})` : ""}
              </p>
              <p className="mt-1 text-muted-foreground">
                Pool insert: {waybillBulk.pool?.insertedCount ?? 0} inserted, {waybillBulk.pool?.skippedCount ?? 0} skipped
              </p>
              <p className="mt-1 break-all font-mono text-foreground">{waybillBulk.waybills.join(", ")}</p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
