"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchDashboard, DashboardStats, ApiError } from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

const CARDS: { key: keyof DashboardStats; label: string; color: string }[] = [
  { key: "total", label: "Total bookings", color: "bg-primary text-white" },
  { key: "today", label: "Booked today", color: "bg-mint text-teal-dark" },
  { key: "pending", label: "Pending", color: "bg-[#FDEAEA] text-[#A32D2D]" },
  { key: "assigned", label: "Assigned", color: "bg-sky text-[#2E6690]" },
  { key: "completed", label: "Completed", color: "bg-bg-alt text-ink-muted" }
];

export default function DashboardPage() {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    adminFetchDashboard(token)
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load dashboard."));
  }, [token]);

  return (
    <div>
      <h1 className="text-2xl mb-6">Dashboard overview</h1>
      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      {!stats ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {CARDS.map((c) => (
              <div key={c.key} className={`rounded-2xl p-5 ${c.color}`}>
                <p className="text-3xl font-sora font-bold">{stats[c.key] as number}</p>
                <p className="text-xs font-semibold opacity-80 mt-1">{c.label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-lg mb-4">Revenue</h2>
              <p className="text-3xl font-sora font-bold text-primary-dark">{fmtPrice(stats.revenue)}</p>
              <p className="text-xs text-ink-muted mt-1">Sum of all non-cancelled bookings</p>
            </div>

            <div className="bg-white border border-border rounded-2xl p-6">
              <h2 className="text-lg mb-4">Bookings by diagnostic center</h2>
              {stats.byCenter.length === 0 ? (
                <p className="text-sm text-ink-muted">No centers yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.byCenter.map((c) => (
                    <div key={c.id} className="flex items-center justify-between text-sm">
                      <span className="text-ink">
                        {c.name} <span className="text-ink-muted">— {c.branch}</span>
                      </span>
                      <span className="font-bold text-primary-dark">{c.bookings}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
