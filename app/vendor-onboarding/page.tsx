"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApiEnvelope, VendorOnboardingSubmissionDto } from "@/types/api";

type OnboardingState = {
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  alternatePhone: string;
  businessType: "individual" | "partnership" | "llp" | "private_limited" | "public_limited" | "other";
  legalName: string;
  gstNumber: string;
  panNumber: string;
  fssaiLicense: string;
  shopActLicense: string;
  category: string;
  subcategory: string;
  shortDescription: string;
  addressLine1: string;
  addressLine2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  deliveryRadiusKm: string;
  deliveryCharge: string;
  minOrderValue: string;
  openingTime: string;
  closingTime: string;
  orderPreparationTimeMinutes: string;
};

const vendorCategories = ["Retailer", "Wholesaler", "Manufacturer", "Trader", "Importer"];

const initialState: OnboardingState = {
  businessName: "",
  ownerName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  businessType: "individual",
  legalName: "",
  gstNumber: "",
  panNumber: "",
  fssaiLicense: "",
  shopActLicense: "",
  category: vendorCategories[0] ?? "",
  subcategory: "",
  shortDescription: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  deliveryRadiusKm: "5",
  deliveryCharge: "0",
  minOrderValue: "0",
  openingTime: "09:00",
  closingTime: "21:00",
  orderPreparationTimeMinutes: "30",
};

export default function VendorOnboardingPage() {
  const [state, setState] = useState<OnboardingState>(initialState);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<VendorOnboardingSubmissionDto | null>(null);

  const canSubmit = useMemo(
    () => Boolean(state.businessName.trim() && state.ownerName.trim() && state.email.trim() && state.phone.trim() && state.category.trim()),
    [state],
  );

  const updateField = <TKey extends keyof OnboardingState>(key: TKey, value: OnboardingState[TKey]) => {
    setState((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      store: {
        basicInfo: {
          name: state.businessName.trim(),
          slug: "",
          logo: "",
          banner: "",
          shortDescription: state.shortDescription.trim(),
          longDescription: "",
          category: state.category.trim(),
          subcategory: state.subcategory.trim(),
        },
        owner: {
          fullName: state.ownerName.trim(),
          email: state.email.trim().toLowerCase(),
          phone: state.phone.trim(),
          alternatePhone: state.alternatePhone.trim(),
          profileImage: "",
        },
        business: {
          businessType: state.businessType,
          legalName: state.legalName.trim(),
          gstNumber: state.gstNumber.trim(),
          panNumber: state.panNumber.trim(),
          fssaiLicense: state.fssaiLicense.trim(),
          drugLicense: "",
          shopActLicense: state.shopActLicense.trim(),
        },
        location: {
          addressLine1: state.addressLine1.trim(),
          addressLine2: state.addressLine2.trim(),
          landmark: state.landmark.trim(),
          city: state.city.trim(),
          state: state.state.trim(),
          pincode: state.pincode.trim(),
          country: state.country.trim() || "India",
          geo: {
            latitude: null,
            longitude: null,
          },
        },
        delivery: {
          isPickupAvailable: false,
          deliveryRadiusKm: Number(state.deliveryRadiusKm) || 0,
          deliveryChargeType: "fixed" as const,
          deliveryCharge: Number(state.deliveryCharge) || 0,
          minDeliveryCharge: 0,
          maxDeliveryCharge: 0,
          estimatedDeliveryTimeMinutes: 60,
          timeSlots: [],
        },
        payment: {
          accountHolderName: "",
          accountNumber: "",
          ifscCode: "",
          upiId: "",
          bankProofImage: "",
        },
        productSettings: {
          defaultTaxRate: 0,
          measurementUnits: ["kg", "piece", "liter"],
          minOrderValue: Number(state.minOrderValue) || 0,
          returnPolicy: "",
          replacementPolicy: "",
        },
        operations: {
          workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"],
          openingTime: state.openingTime,
          closingTime: state.closingTime,
          holidayMode: false,
          orderPreparationTimeMinutes: Number(state.orderPreparationTimeMinutes) || 30,
        },
        media: {
          gallery: [],
          introVideo: "",
        },
        catalog: {
          categories: [],
        },
        marketing: {
          couponsEnabled: true,
          featured: false,
          adBudget: 0,
        },
        aiInsights: {
          pricingSuggestionsEnabled: true,
          inventoryAlertsEnabled: true,
          salesInsightsEnabled: true,
          complianceAlertsEnabled: true,
          productRecommendationsEnabled: true,
        },
        meta: {
          status: "pending" as const,
          isVerified: false,
          profileCompletion: 20,
          createdAt: "",
          updatedAt: "",
        },
      },
    };

    try {
      const response = await fetch("/api/vendor-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = (await response.json().catch(() => ({}))) as ApiEnvelope<{ submission: VendorOnboardingSubmissionDto; message: string }>;
      if (!response.ok || !result.success) {
        setError(result.success ? "Unable to submit onboarding" : result.error.message);
        return;
      }

      setSuccess(result.data.submission);
      setState(initialState);
    } catch {
      setError("Unable to submit onboarding right now. Please try again in a few minutes.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6 md:py-14">
      <div className="mb-6 rounded-3xl border border-[#f0d8a7] bg-[linear-gradient(135deg,#fffaf0,#fff5de)] p-6 shadow-[0_20px_80px_-50px_rgba(89,58,10,0.45)] md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#9e7526]">Partner With Gifta</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">Vendor Onboarding</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 md:text-base">
          Complete the onboarding form and submit your business details. Your request will stay in pending status until reviewed and approved by a super-admin.
        </p>
      </div>

      <Card className="border-[#ead7ad] bg-white shadow-[0_26px_90px_-60px_rgba(56,40,11,0.45)]">
        <CardHeader>
          <CardTitle>Business Details</CardTitle>
          <CardDescription>Fill the required details accurately. Approved vendors can sign in using the same email address.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Business name" value={state.businessName} onChange={(event) => updateField("businessName", event.target.value)} required />
              <Input placeholder="Owner full name" value={state.ownerName} onChange={(event) => updateField("ownerName", event.target.value)} required />
              <Input type="email" placeholder="Owner email" value={state.email} onChange={(event) => updateField("email", event.target.value)} required />
              <Input placeholder="Owner phone" value={state.phone} onChange={(event) => updateField("phone", event.target.value)} required />
              <Input placeholder="Alternate phone" value={state.alternatePhone} onChange={(event) => updateField("alternatePhone", event.target.value)} />
              <select
                className="h-11 rounded-md border border-input bg-background px-3 text-sm"
                value={state.businessType}
                onChange={(event) => updateField("businessType", event.target.value as OnboardingState["businessType"])}
              >
                <option value="individual">Individual</option>
                <option value="partnership">Partnership</option>
                <option value="llp">LLP</option>
                <option value="private_limited">Private Limited</option>
                <option value="public_limited">Public Limited</option>
                <option value="other">Other</option>
              </select>
              <select className="h-11 rounded-md border border-input bg-background px-3 text-sm" value={state.category} onChange={(event) => updateField("category", event.target.value)}>
                {vendorCategories.map((entry) => (
                  <option key={entry} value={entry}>{entry}</option>
                ))}
              </select>
              <Input placeholder="Subcategory" value={state.subcategory} onChange={(event) => updateField("subcategory", event.target.value)} />
              <Input placeholder="Legal business name" value={state.legalName} onChange={(event) => updateField("legalName", event.target.value)} />
              <Input placeholder="GST number" value={state.gstNumber} onChange={(event) => updateField("gstNumber", event.target.value)} />
              <Input placeholder="PAN number" value={state.panNumber} onChange={(event) => updateField("panNumber", event.target.value)} />
              <Input placeholder="FSSAI license" value={state.fssaiLicense} onChange={(event) => updateField("fssaiLicense", event.target.value)} />
              <Input placeholder="Shop act license" value={state.shopActLicense} onChange={(event) => updateField("shopActLicense", event.target.value)} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Input placeholder="Address line 1" value={state.addressLine1} onChange={(event) => updateField("addressLine1", event.target.value)} />
              <Input placeholder="Address line 2" value={state.addressLine2} onChange={(event) => updateField("addressLine2", event.target.value)} />
              <Input placeholder="Landmark" value={state.landmark} onChange={(event) => updateField("landmark", event.target.value)} />
              <Input placeholder="City" value={state.city} onChange={(event) => updateField("city", event.target.value)} />
              <Input placeholder="State" value={state.state} onChange={(event) => updateField("state", event.target.value)} />
              <Input placeholder="Pincode" value={state.pincode} onChange={(event) => updateField("pincode", event.target.value)} />
              <Input placeholder="Country" value={state.country} onChange={(event) => updateField("country", event.target.value)} />
              <Input placeholder="Short description" value={state.shortDescription} onChange={(event) => updateField("shortDescription", event.target.value)} />
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {success ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Submitted successfully. Submission ID: <span className="font-semibold">{success.id}</span>. Status: <span className="font-semibold">{success.status}</span>.
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={submitting || !canSubmit} className="bg-[#cd9933] text-white hover:bg-[#b7892f]">
                {submitting ? "Submitting..." : "Submit for approval"}
              </Button>
              <Button asChild variant="outline">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
