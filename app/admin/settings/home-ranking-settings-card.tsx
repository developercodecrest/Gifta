"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HomeRankingConfig } from "@/types/api";

type Props = {
  initialConfig: HomeRankingConfig;
};

export function HomeRankingSettingsCard({ initialConfig }: Props) {
  const [config, setConfig] = useState<HomeRankingConfig>(initialConfig);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateField = <S extends keyof HomeRankingConfig, K extends keyof HomeRankingConfig[S]>(
    section: S,
    key: K,
    value: number,
  ) => {
    setConfig((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setStatus(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/settings/home-ranking", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      const payload = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        data?: HomeRankingConfig;
        error?: { message?: string };
      };

      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error?.message ?? "Unable to save home ranking configuration");
      }

      setConfig(payload.data);
      setStatus("Home ranking configuration updated.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save home ranking configuration");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-5 p-4">
        <div className="space-y-1">
          <p className="font-semibold">Home Ranking Configuration</p>
          <p className="text-sm text-muted-foreground">Tune how Trending, Best Sellers, and Signature Picks are ranked on the home page.</p>
        </div>

        <section className="space-y-3 rounded-lg border border-border/70 p-3">
          <p className="text-sm font-semibold">Trending</p>
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label="Recent Quantity Weight"
              value={config.trending.recentQuantityWeight}
              onChange={(value) => updateField("trending", "recentQuantityWeight", value)}
            />
            <NumberField
              label="Recent Orders Weight"
              value={config.trending.recentOrdersWeight}
              onChange={(value) => updateField("trending", "recentOrdersWeight", value)}
            />
            <NumberField
              label="Rating Weight"
              value={config.trending.ratingWeight}
              onChange={(value) => updateField("trending", "ratingWeight", value)}
            />
            <NumberField
              label="Reviews Weight"
              value={config.trending.reviewsWeight}
              onChange={(value) => updateField("trending", "reviewsWeight", value)}
            />
            <NumberField
              label="Offer Coverage Weight"
              value={config.trending.offerWeight}
              onChange={(value) => updateField("trending", "offerWeight", value)}
            />
            <NumberField
              label="Featured Boost"
              value={config.trending.featuredBoost}
              onChange={(value) => updateField("trending", "featuredBoost", value)}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border/70 p-3">
          <p className="text-sm font-semibold">Best Sellers</p>
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label="Total Quantity Weight"
              value={config.bestSellers.totalQuantityWeight}
              onChange={(value) => updateField("bestSellers", "totalQuantityWeight", value)}
            />
            <NumberField
              label="Total Orders Weight"
              value={config.bestSellers.totalOrdersWeight}
              onChange={(value) => updateField("bestSellers", "totalOrdersWeight", value)}
            />
            <NumberField
              label="Revenue Weight"
              value={config.bestSellers.revenueWeight}
              onChange={(value) => updateField("bestSellers", "revenueWeight", value)}
              step="0.001"
            />
            <NumberField
              label="Rating Weight"
              value={config.bestSellers.ratingWeight}
              onChange={(value) => updateField("bestSellers", "ratingWeight", value)}
            />
            <NumberField
              label="Reviews Weight"
              value={config.bestSellers.reviewsWeight}
              onChange={(value) => updateField("bestSellers", "reviewsWeight", value)}
            />
          </div>
        </section>

        <section className="space-y-3 rounded-lg border border-border/70 p-3">
          <p className="text-sm font-semibold">Signature Picks</p>
          <div className="grid gap-3 md:grid-cols-2">
            <NumberField
              label="Premium Signal Weight"
              value={config.signaturePicks.premiumSignalWeight}
              onChange={(value) => updateField("signaturePicks", "premiumSignalWeight", value)}
            />
            <NumberField
              label="Quality Weight"
              value={config.signaturePicks.qualityWeight}
              onChange={(value) => updateField("signaturePicks", "qualityWeight", value)}
            />
            <NumberField
              label="Discount Weight"
              value={config.signaturePicks.discountWeight}
              onChange={(value) => updateField("signaturePicks", "discountWeight", value)}
            />
            <NumberField
              label="Trust Weight"
              value={config.signaturePicks.trustWeight}
              onChange={(value) => updateField("signaturePicks", "trustWeight", value)}
            />
            <NumberField
              label="Demand Weight"
              value={config.signaturePicks.demandWeight}
              onChange={(value) => updateField("signaturePicks", "demandWeight", value)}
            />
            <NumberField
              label="Signature Price Threshold"
              value={config.signaturePicks.signaturePriceThreshold}
              onChange={(value) => updateField("signaturePicks", "signaturePriceThreshold", value)}
            />
            <NumberField
              label="High Price Threshold"
              value={config.signaturePicks.highPriceThreshold}
              onChange={(value) => updateField("signaturePicks", "highPriceThreshold", value)}
            />
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => void save()}
            disabled={saving}
            className="bg-[#cd9933] text-white hover:bg-[#b8872d]"
          >
            {saving ? "Saving..." : "Save ranking config"}
          </Button>
          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        step={step}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          onChange(Number.isFinite(parsed) ? parsed : 0);
        }}
      />
    </div>
  );
}
