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

export function IntegrationTestCard() {
  const [pinCode, setPinCode] = useState("400001");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [razorpay, setRazorpay] = useState<RazorpayHealth | null>(null);
  const [delhivery, setDelhivery] = useState<DelhiveryHealth | null>(null);

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
      </CardContent>
    </Card>
  );
}
