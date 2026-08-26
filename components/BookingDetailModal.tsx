"use client";

import { X, Phone, Calendar, Clock, MapPin } from "lucide-react";
import { AdminBooking } from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

export default function BookingDetailModal({ booking, onClose }: { booking: AdminBooking; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl mb-1">{booking.patient.name}</h2>
        <p className="text-sm text-ink-muted mb-5">
          {booking.patient.gender} · {booking.patient.age}y ·{" "}
          <span className="inline-flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" /> {booking.patient.phone}
          </span>
        </p>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-bg-alt rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-ink-muted mb-1">Status</p>
            <p className="text-sm font-semibold text-ink">{booking.status}</p>
          </div>
          <div className="bg-bg-alt rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-ink-muted mb-1">Priority</p>
            <p className="text-sm font-semibold text-ink">{booking.priority}</p>
          </div>
          <div className="bg-bg-alt rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-ink-muted mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Date
            </p>
            <p className="text-sm font-semibold text-ink">{booking.date}</p>
          </div>
          <div className="bg-bg-alt rounded-xl p-3">
            <p className="text-[10px] font-bold uppercase text-ink-muted mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Slot
            </p>
            <p className="text-sm font-semibold text-ink">{booking.slot}</p>
          </div>
        </div>

        {booking.center && (
          <div className="bg-mint border border-mint-line rounded-xl p-3 mb-5">
            <p className="text-[10px] font-bold uppercase text-teal-dark mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> Assigned center
            </p>
            <p className="text-sm font-semibold text-teal-dark">
              {booking.center.name} — {booking.center.branch}
            </p>
            {booking.assignedAt && (
              <p className="text-xs text-teal-dark/70 mt-0.5">
                Assigned {new Date(booking.assignedAt).toLocaleString("en-IN")}
              </p>
            )}
          </div>
        )}

        {booking.sampleStatus !== "Not Applicable" && (
          <div className="bg-bg-alt rounded-xl p-3 mb-5">
            <p className="text-[10px] font-bold uppercase text-ink-muted mb-1">Sample status</p>
            <p className="text-sm font-semibold text-ink">{booking.sampleStatus}</p>
          </div>
        )}

        <p className="text-[10px] font-bold uppercase text-ink-muted mb-2">Tests booked</p>
        <ul className="border border-border rounded-xl divide-y divide-border mb-5">
          {booking.items.map((it, i) => (
            <li key={i} className="flex justify-between px-3.5 py-2.5 text-sm">
              <span className="text-ink">
                {it.name}
                {it.qty > 1 ? ` × ${it.qty}` : ""}
              </span>
              <span className="text-ink-muted">{fmtPrice(it.price * it.qty)}</span>
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="text-xs text-ink-muted">
            Created {new Date(booking.createdAt).toLocaleString("en-IN")}
          </span>
          <span className="font-sora font-bold text-lg text-primary-dark">{fmtPrice(booking.total)}</span>
        </div>
      </div>
    </div>
  );
}
