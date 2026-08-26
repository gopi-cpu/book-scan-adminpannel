"use client";

import { useEffect, useState } from "react";
import { UserPlus, Scan, FlaskConical, Package } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchLeads, adminUpdateLeadStatus, Lead, ApiError } from "@/lib/api";
import CreateBookingModal from "@/components/CreateBookingModal";

const STATUS_CLASS: Record<string, string> = {
  New: "bg-[#FDEAEA] text-[#A32D2D]",
  Contacted: "bg-gold-bg text-gold",
  Converted: "bg-mint text-teal-dark",
  Closed: "bg-bg-alt text-ink-muted"
};

const MODALITY_META: Record<string, { label: string; icon: typeof Scan }> = {
  scan: { label: "Scan", icon: Scan },
  pathology: { label: "Pathology", icon: FlaskConical },
  package: { label: "Package", icon: Package }
};

export default function LeadsPage() {
  const { token } = useAuth();
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [error, setError] = useState("");
  const [bookingLead, setBookingLead] = useState<Lead | null>(null);

  async function load() {
    if (!token) return;
    try {
      setLeads(await adminFetchLeads(token));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load leads.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleStatusChange(id: string, status: string) {
    if (!token) return;
    try {
      const updated = await adminUpdateLeadStatus(token, id, status);
      setLeads((prev) => (prev ? prev.map((l) => (l.id === id ? updated : l)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update this lead.");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl">Leads</h1>
        <p className="text-sm text-ink-muted">{leads ? `${leads.length} leads` : "Loading..."}</p>
      </div>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <div className="border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-alt text-left">
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Name</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Phone</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Modality</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Message</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Submitted</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Status</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!leads ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  Loading...
                </td>
              </tr>
            ) : leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-ink-muted">
                  No leads yet. Submissions from the contact form on the customer site will show up here.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3.5 font-semibold text-ink">{lead.name}</td>
                  <td className="px-4 py-3.5 text-ink-muted">{lead.phone}</td>
                  <td className="px-4 py-3.5">
                    {lead.modality ? (
                      (() => {
                        const meta = MODALITY_META[lead.modality!];
                        const Icon = meta.icon;
                        return (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-dark bg-sky px-2 py-1 rounded-full">
                            <Icon className="w-3 h-3" /> {meta.label}
                          </span>
                        );
                      })()
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-ink-muted max-w-[240px] truncate">{lead.message || "—"}</td>
                  <td className="px-4 py-3.5 text-ink-muted whitespace-nowrap">
                    {new Date(lead.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </td>
                  <td className="px-4 py-3.5">
                    <select
                      value={lead.status}
                      onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-none outline-none ${STATUS_CLASS[lead.status]}`}
                    >
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Converted">Converted</option>
                      <option value="Closed">Closed</option>
                    </select>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => setBookingLead(lead)}
                      className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal px-3 py-1.5 rounded-lg hover:brightness-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Create booking
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {bookingLead && (
        <CreateBookingModal
          initialName={bookingLead.name}
          initialPhone={bookingLead.phone}
          initialModality={bookingLead.modality}
          leadId={bookingLead.id}
          onClose={() => setBookingLead(null)}
          onCreated={() => {
            setBookingLead(null);
            load();
          }}
        />
      )}
    </div>
  );
}
