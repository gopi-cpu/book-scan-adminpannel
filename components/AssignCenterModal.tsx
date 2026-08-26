"use client";

import { useState } from "react";
import { X, Search, MapPin } from "lucide-react";
import { AdminBooking, CenterOption } from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

export default function AssignCenterModal({
  booking,
  options,
  loading,
  onAssign,
  onClose
}: {
  booking: AdminBooking;
  options: CenterOption[];
  loading: boolean;
  onAssign: (centerId: number) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = options.filter((c) => `${c.name} ${c.branch}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-md p-6 relative max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl mb-1">Assign diagnostic center</h2>
        <p className="text-sm text-ink-muted mb-4">
          {booking.patient.name} — {booking.items.map((i) => i.name).join(", ")}
        </p>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search center..."
            className="w-full border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none focus:border-teal"
          />
        </div>

        <div className="flex-1 overflow-y-auto border border-border rounded-xl">
          {loading ? (
            <p className="text-sm text-ink-muted text-center py-8">Loading centers...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-ink-muted text-center py-8">No centers match.</p>
          ) : (
            filtered.map((c) => {
              const isCurrent = booking.center?.id === c.id;
              return (
                <button
                  key={c.id}
                  onClick={() => onAssign(c.id)}
                  disabled={isCurrent}
                  className={`w-full flex items-center justify-between text-left px-4 py-3 text-sm border-b border-border last:border-b-0 ${
                    isCurrent ? "bg-mint" : "hover:bg-bg-alt"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-ink-muted flex-shrink-0" />
                    <span>
                      <span className="font-semibold text-ink">{c.name}</span>
                      <span className="text-ink-muted"> — {c.branch}</span>
                      {isCurrent && (
                        <span className="ml-2 text-[10px] font-bold uppercase text-teal-dark">Current</span>
                      )}
                    </span>
                  </span>
                  {c.totalPrice != null && (
                    <span className="text-xs text-ink-muted flex-shrink-0 ml-2">
                      {fmtPrice(c.totalPrice)}
                      {!c.hasCustomPricing && " · list"}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}