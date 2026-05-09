import Link from "next/link";
import {
  ArrowRight,
  FileDown,
  FileText,
  Pencil,
  RefreshCcw,
  Route,
  Truck,
} from "lucide-react";
import { ensureAdminAccess } from "@/app/admin/_utils";
import { AdminHero, AdminSection } from "@/app/admin/_components/admin-surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DelhiveryGuideCanvas } from "./guide-canvas";

const actionSequence = [
  {
    step: "01",
    title: "Create / Retry shipment",
    description: "Start here when the row still has no AWB or the earlier shipment call failed.",
    detail: "This creates the Delhivery shipment and already attempts the first pickup request behind the scenes.",
    icon: RefreshCcw,
  },
  {
    step: "02",
    title: "Edit shipment",
    description: "Correct consignee name, phone, address, or product description before dispatch slips out.",
    detail: "Use this before label reprints or pickup recovery whenever the package metadata changed.",
    icon: Pencil,
  },
  {
    step: "03",
    title: "Update EWB",
    description: "Attach the invoice number and e-waybill once the compliance details are ready.",
    detail: "Keep this ahead of label print and dispatch handoff whenever the lane requires an e-waybill.",
    icon: FileText,
  },
  {
    step: "04",
    title: "Download shipping label PDF",
    description: "Print the Delhivery AWB label once the shipment payload is correct and the desk is ready.",
    detail: "This uses Delhivery's packing-slip API for the printable AWB label, not a receipt or proof-of-delivery document.",
    icon: FileDown,
  },
  {
    step: "05",
    title: "Request pickup",
    description: "Use the custom popup when the original pickup request needs a refresh or a new slot.",
    detail: "Treat this as a recovery tool, because shipment creation already tries the first pickup request.",
    icon: Truck,
  },
  {
    step: "06",
    title: "Track or cancel",
    description: "Track after handoff; cancel only when the shipment must be stopped before the route progresses.",
    detail: "Track is the normal continuation. Cancel is the exception path and should stay at the end.",
    icon: Route,
  },
] as const;

const decisionCards = [
  {
    title: "No AWB on the row",
    action: "Create / Retry shipment",
    description: "Do not jump into pickup first. Create the shipment so the row gets its AWB, shipment ID, and the automatic pickup attempt.",
  },
  {
    title: "Address or receiver changed",
    action: "Edit shipment",
    description: "Correct the shipment payload before you print again or ask Delhivery for another pickup window.",
  },
  {
    title: "Invoice and e-waybill ready",
    action: "Update EWB",
    description: "Push the invoice number and e-waybill before final dispatch so the shipment record stays aligned with paperwork.",
  },
  {
    title: "Label desk needs the print file",
    action: "Download shipping label PDF",
    description: "Use the proxied AWB label PDF when packaging is complete and the shipment data is already verified.",
  },
  {
    title: "Pickup request was missed",
    action: "Request pickup",
    description: "Open the custom popup and reschedule the pickup with the right location, date, time, and package count.",
  },
  {
    title: "Customer asks for live status",
    action: "Track",
    description: "Open Delhivery tracking only after the shipment is live. Keep cancel isolated for true stop-ship cases.",
  },
] as const;

export default async function AdminDelhiveryGuidePage() {
  await ensureAdminAccess("orders");

  return (
    <div className="space-y-6">
      <AdminHero
        eyebrow="Delhivery guide"
        title="Operational playbook for shipment control"
        description="Use the order actions in a fixed sequence so the desk can create, correct, print, recover pickup, and track Delhivery shipments without second-guessing the workflow."
        actions={(
          <Button asChild variant="outline">
            <Link href="/admin/orders">Back to orders</Link>
          </Button>
        )}
        stats={[
          { label: "Core actions", value: "6", tone: "warm" },
          { label: "Auto pickup stage", value: "1", tone: "mint" },
          { label: "Recovery dialog", value: "Pickup", tone: "sun" },
          { label: "Exception path", value: "Cancel last", tone: "warm" },
        ]}
      />

      <AdminSection
        title="Canvas flow map"
        description="This canvas diagram shows the intended Delhivery sequence used by the admin order controls, including the automatic pickup attempt that happens during shipment creation."
      >
        <DelhiveryGuideCanvas />
      </AdminSection>

      <AdminSection
        title="Action sequence"
        description="Read the shipment buttons from left to right. The UI now follows this order so the team can operate consistently."
      >
        <div className="overflow-x-auto pb-2">
          <div className="flex min-w-max items-stretch gap-3">
            {actionSequence.map((entry, index) => {
              const Icon = entry.icon;

              return (
                <div key={entry.step} className="flex items-center gap-3">
                  <Card className="w-67.5 border-[#ead8b2] bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(255,248,234,0.95))] shadow-[0_24px_60px_-48px_rgba(116,84,26,0.3)]">
                    <CardContent className="space-y-4 p-5">
                      <div className="flex items-center justify-between gap-3">
                        <Badge className="bg-[#cd9933] text-white hover:bg-[#cd9933]">Step {entry.step}</Badge>
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#fff4df] text-[#9e7526]">
                          <Icon className="h-5 w-5" />
                        </span>
                      </div>
                      <div className="space-y-2">
                        <h3 className="font-display text-xl font-semibold tracking-[-0.04em] text-foreground">{entry.title}</h3>
                        <p className="text-sm leading-6 text-[#5f5047]">{entry.description}</p>
                      </div>
                      <div className="rounded-[1.35rem] border border-dashed border-[#ead8b2] bg-white/85 px-4 py-3 text-sm leading-6 text-[#6d5a4d]">
                        {entry.detail}
                      </div>
                    </CardContent>
                  </Card>

                  {index < actionSequence.length - 1 ? (
                    <div className="flex h-full items-center justify-center px-1">
                      <svg width="76" height="18" viewBox="0 0 76 18" fill="none" aria-hidden="true" className="text-[#b88d43]">
                        <path d="M1 9H67" stroke="currentColor" strokeWidth="2.2" strokeDasharray="7 7" strokeLinecap="round" />
                        <path d="M58 2L67 9L58 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </AdminSection>

      <AdminSection
        title="Decision shortcuts"
        description="Use these cues when someone on the desk asks which Delhivery button should be pressed next."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {decisionCards.map((card) => (
            <Card key={card.title} className="border-[#ead8b2] bg-white/90 shadow-[0_22px_55px_-48px_rgba(116,84,26,0.3)]">
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9e7526]">Situation</p>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-foreground">{card.title}</h3>
                  </div>
                  <ArrowRight className="mt-1 h-4 w-4 text-[#cd9933]" />
                </div>
                <div className="rounded-[1.25rem] bg-[#fff6e3] px-4 py-3 text-sm font-semibold text-[#7f5e1e]">
                  {card.action}
                </div>
                <p className="text-sm leading-6 text-[#5f5047]">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Operating note"
        description="The admin order page now follows the same sequence shown here, and the Pickup action opens a custom popup instead of browser prompts."
      >
        <div className="rounded-[1.8rem] border border-[#e4cf9e] bg-[linear-gradient(135deg,rgba(255,250,239,0.96),rgba(251,241,217,0.95))] p-6 text-sm leading-7 text-[#5f5047]">
          <p>
            Delhivery shipment creation in this codebase already attempts a pickup request once the AWB is created. The new pickup popup is meant for manual recovery, rescheduling, or updating the pickup slot with cleaner data entry. Keep <span className="font-semibold text-foreground">Cancel Ship</span> at the far end of the sequence so the desk reads it as the exception path, not the default next step.
          </p>
        </div>
      </AdminSection>
    </div>
  );
}