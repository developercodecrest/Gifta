"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AdminEmptyState } from "@/app/admin/_components/admin-surface";
import { ApiEnvelope, VendorOnboardingStatus, VendorOnboardingSubmissionDto } from "@/types/api";

type Props = {
  initialItems: VendorOnboardingSubmissionDto[];
};

const statusOptions: Array<{ label: string; value: "all" | VendorOnboardingStatus }> = [
  { label: "All", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Approved", value: "approved" },
  { label: "Rejected", value: "rejected" },
];

export function VendorOnboardingClient({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [status, setStatus] = useState<"all" | VendorOnboardingStatus>("pending");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!query) return true;
      return [item.businessName, item.ownerName, item.email, item.category, item.city, item.state]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [items, q, status]);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (status !== "all") params.set("status", status);
      params.set("page", "1");
      params.set("pageSize", "100");

      const response = await fetch(`/api/admin/vendor-onboarding?${params.toString()}`);
      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<VendorOnboardingSubmissionDto[]>;
      if (!response.ok || !payload.success) {
        setError(payload.success ? "Unable to fetch submissions" : payload.error.message);
        return;
      }

      setItems(payload.data);
    } catch {
      setError("Unable to fetch submissions");
    } finally {
      setLoading(false);
    }
  };

  const review = async (id: string, decision: "approve" | "reject") => {
    setBusyId(id);
    setError(null);

    const reason = decision === "reject" ? window.prompt("Optional rejection reason", "") ?? "" : "";

    try {
      const response = await fetch(`/api/admin/vendor-onboarding/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, reason: reason.trim() || undefined }),
      });

      const payload = (await response.json().catch(() => ({}))) as ApiEnvelope<VendorOnboardingSubmissionDto>;
      if (!response.ok || !payload.success) {
        setError(payload.success ? "Unable to review submission" : payload.error.message);
        return;
      }

      setItems((current) => current.map((item) => (item.id === id ? payload.data : item)));
    } catch {
      setError("Unable to review submission");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.7fr)_auto_auto]">
        <Input value={q} onChange={(event) => setQ(event.target.value)} placeholder="Search by business, owner, email, city" />
        <select value={status} onChange={(event) => setStatus(event.target.value as "all" | VendorOnboardingStatus)} className="h-11 rounded-md border border-input bg-background px-3 text-sm">
          {statusOptions.map((entry) => (
            <option key={entry.value} value={entry.value}>{entry.label}</option>
          ))}
        </select>
        <Button type="button" variant="outline" onClick={reload} disabled={loading}>{loading ? "Refreshing..." : "Refresh"}</Button>
        <div className="flex items-center justify-end text-sm text-[#5f5047]">{filtered.length} request(s)</div>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!filtered.length ? (
        <AdminEmptyState title="No onboarding requests" description="New vendor submissions will appear here for super-admin approval." />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="app-table-head text-left text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-3 py-2.5">Business</th>
                  <th className="px-3 py-2.5">Owner</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Submitted</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => (
                  <tr key={item.id} className="border-t border-border">
                    <td className="px-3 py-2.5 font-medium">
                      <p>{item.businessName}</p>
                      <p className="text-xs text-[#74655c]">{item.category || "Uncategorized"}</p>
                    </td>
                    <td className="px-3 py-2.5">
                      <p>{item.ownerName || "-"}</p>
                      <p className="text-xs text-[#74655c]">{item.ownerPhone || ""}</p>
                    </td>
                    <td className="px-3 py-2.5">{item.email}</td>
                    <td className="px-3 py-2.5">{[item.city, item.state, item.pincode].filter(Boolean).join(", ") || "-"}</td>
                    <td className="px-3 py-2.5">
                      <Badge variant={item.status === "approved" ? "default" : item.status === "pending" ? "secondary" : "outline"}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5">{new Date(item.submittedAt).toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          size="sm"
                          className="bg-[#cd9933] text-white hover:bg-[#b7892f]"
                          disabled={busyId === item.id || item.status !== "pending"}
                          onClick={() => review(item.id, "approve")}
                        >
                          {busyId === item.id ? "Working..." : "Approve"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busyId === item.id || item.status !== "pending"}
                          onClick={() => review(item.id, "reject")}
                        >
                          Reject
                        </Button>
                      </div>
                      {item.status === "approved" && item.approvedStoreId ? (
                        <p className="mt-1 text-right text-xs text-[#74655c]">Store: {item.approvedStoreId}</p>
                      ) : null}
                      {item.status === "rejected" && item.rejectionReason ? (
                        <p className="mt-1 text-right text-xs text-[#74655c]">Reason: {item.rejectionReason}</p>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
