"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type ProductContentTabsProps = {
  descriptionHtml: string;
  howToPersonaliseHtml?: string;
  brandDetailsHtml?: string;
  disclaimerHtml?: string;
};

type TabKey = "description" | "how-to-personalise" | "brand-details" | "disclaimer";

type TabDefinition = {
  key: TabKey;
  label: string;
  html: string;
};

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function ensureRenderableHtml(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "<p class=\"text-sm text-[#5f5047]\">Details will be updated soon.</p>";
  }

  if (/[<>]/.test(trimmed)) {
    return trimmed;
  }

  return `<p>${trimmed}</p>`;
}

export function ProductContentTabs({
  descriptionHtml,
  howToPersonaliseHtml,
  brandDetailsHtml,
  disclaimerHtml,
}: ProductContentTabsProps) {
  const tabs = useMemo<TabDefinition[]>(
    () => [
      {
        key: "description",
        label: "Description",
        html: ensureRenderableHtml(descriptionHtml),
      },
      {
        key: "how-to-personalise",
        label: "How To Personalise",
        html: ensureRenderableHtml(howToPersonaliseHtml ?? ""),
      },
      {
        key: "brand-details",
        label: "Brand Details",
        html: ensureRenderableHtml(brandDetailsHtml ?? ""),
      },
      {
        key: "disclaimer",
        label: "Disclaimer",
        html: ensureRenderableHtml(disclaimerHtml ?? ""),
      },
    ],
    [brandDetailsHtml, descriptionHtml, disclaimerHtml, howToPersonaliseHtml],
  );

  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const activeContent = tabs.find((entry) => entry.key === activeTab) ?? tabs[0];

  return (
    <div className="rounded-3xl border border-[#ead7cb] bg-white/90 p-4 shadow-[0_16px_36px_-28px_rgba(64,40,22,0.4)] sm:p-5">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const hasContent = stripHtml(tab.html).length > 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] transition",
                activeTab === tab.key
                  ? "border-[#cd9933] bg-[#cd9933] text-white"
                  : "border-[#e6d6c8] bg-white text-[#5f5047] hover:border-[#cd9933]/60",
              )}
              title={hasContent ? tab.label : `${tab.label} (currently empty)`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      <div
        className="prose prose-sm mt-4 max-w-none text-[#1f1f1f] leading-7 prose-p:text-[#5f5047] prose-li:text-[#5f5047] prose-strong:text-[#3a2a22]"
        dangerouslySetInnerHTML={{ __html: activeContent.html }}
      />
    </div>
  );
}
