"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchTracker, TrackerReport, ApiError } from "@/lib/api";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function cellClass(count: number): string {
  if (count === 0) return "bg-bg-alt text-ink-muted";
  if (count <= 3) return "bg-gold-bg text-gold";
  if (count <= 9) return "bg-mint text-teal-dark";
  return "bg-teal text-white font-bold";
}

export default function TrackerPage() {
  const { token } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [report, setReport] = useState<TrackerReport | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    adminFetchTracker(token, year, month)
      .then(setReport)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Could not load the tracker."));
  }, [token, year, month]);

  const days = report ? Array.from({ length: report.daysInMonth }, (_, i) => i + 1) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl">Diagnostic center tracker</h1>
        <div className="flex gap-2">
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal bg-white"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-teal bg-white"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      {!report ? (
        <p className="text-sm text-ink-muted">Loading...</p>
      ) : report.centers.length === 0 ? (
        <div className="border border-border rounded-2xl py-14 text-center text-ink-muted text-sm">
          No bookings created in {MONTHS[month - 1]} {year} yet.
        </div>
      ) : (
        <div className="border border-border rounded-2xl overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              <tr>
                <th className="sticky left-0 bg-bg-alt px-3 py-2.5 text-left font-bold text-ink-muted uppercase border-b border-r border-border min-w-[200px]">
                  Diagnostic Center
                </th>
                <th className="px-2 py-2.5 text-center font-bold text-ink-muted uppercase border-b border-r border-border bg-bg-alt min-w-[70px]">
                  Total
                </th>
                {days.map((d) => (
                  <th key={d} className="px-2 py-2.5 text-center font-semibold text-ink-muted border-b border-border bg-bg-alt min-w-[36px]">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.centers.map((c) => (
                <tr key={c.id ?? "unassigned"}>
                  <td className="sticky left-0 bg-white px-3 py-2.5 border-r border-b border-border font-semibold text-ink">
                    {c.name}
                    {c.branch && <span className="text-ink-muted font-normal"> — {c.branch}</span>}
                  </td>
                  <td className="px-2 py-2.5 text-center border-r border-b border-border font-bold text-primary-dark bg-bg-alt">
                    {c.total}
                  </td>
                  {days.map((d) => {
                    const count = c.byDay[d] || 0;
                    return (
                      <td key={d} className={`px-2 py-2.5 text-center border-b border-border ${cellClass(count)}`}>
                        {count || ""}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
