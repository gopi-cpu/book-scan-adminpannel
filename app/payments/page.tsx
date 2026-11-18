"use client";

import { useEffect, useState } from "react";
import { CreditCard, CheckCircle2, Clock, XCircle, Search, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchPayments, AdminPayment } from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

export default function AdminPaymentsPage() {
  const { token } = useAuth();
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    if (!token) return;
    try {
      setLoading(true);
      const data = await adminFetchPayments(token);
      setPayments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [token]);

  const filtered = payments.filter((p) => {
    const matchesSearch =
      !filter ||
      String(p.bookingId || "").toLowerCase().includes(filter.toLowerCase()) ||
      String(p.userName || "").toLowerCase().includes(filter.toLowerCase()) ||
      String(p.userPhone || "").includes(filter) ||
      String(p.paymentId || "").toLowerCase().includes(filter.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "paid" && (p.status === "paid" || p.status === "Completed")) ||
      (statusFilter === "pending" && (p.status === "pending" || p.status === "Pending")) ||
      (statusFilter === "failed" && (p.status === "failed" || p.status === "Cancelled"));

    return matchesSearch && matchesStatus;
  });

  const totalCollected = payments
    .filter((p) => p.status === "paid" || p.status === "Completed")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary-dark">Payments &amp; Transactions</h1>
          <p className="text-sm text-ink-muted">Track online Razorpay transactions, collection dues, and payment statuses</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-border px-4 py-2 rounded-xl shadow-2xs">
            <span className="text-[10px] uppercase font-bold text-ink-muted block">Total Paid Revenue</span>
            <b className="text-lg font-sora font-extrabold text-teal-dark">{fmtPrice(totalCollected)}</b>
          </div>
          <button
            onClick={load}
            className="p-2.5 rounded-xl border border-border bg-white hover:border-teal transition cursor-pointer text-ink-muted hover:text-teal"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search by Booking ID, Patient Name, Phone, or Payment ID..."
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl text-sm outline-none focus:border-teal bg-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed / Cancelled</option>
        </select>
      </div>

      <div className="bg-white border border-border rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-alt border-b border-border text-xs uppercase tracking-wider text-ink-muted">
            <tr>
              <th className="px-5 py-3 font-bold">Booking / Payment ID</th>
              <th className="px-5 py-3 font-bold">Patient / Customer</th>
              <th className="px-5 py-3 font-bold">Amount</th>
              <th className="px-5 py-3 font-bold">Payment Method</th>
              <th className="px-5 py-3 font-bold">Status</th>
              <th className="px-5 py-3 font-bold">Date &amp; Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  Loading payments...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-ink-muted">
                  No payment records found.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isPaid = item.status === "paid" || item.status === "Completed";
                const isPending = item.status === "pending" || item.status === "Pending";
                return (
                  <tr key={String(item.id)} className="hover:bg-bg-alt/50 transition">
                    <td className="px-5 py-3.5">
                      <span className="font-bold text-primary-dark block">#{item.bookingId || item.id}</span>
                      {item.paymentId && (
                        <span className="text-[11px] font-mono text-ink-muted block truncate max-w-[150px]">
                          {item.paymentId}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <b className="text-primary-dark block font-semibold">{item.userName}</b>
                      <span className="text-xs text-ink-muted">{item.userPhone || "—"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <b className="font-sora text-sm text-primary-dark">{fmtPrice(item.amount)}</b>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-ink">
                        <CreditCard className="w-3.5 h-3.5 text-teal" />
                        <span>{item.method || "Pay at Collection"}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          isPaid
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : isPending
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-rose-50 text-rose-700 border border-rose-200"
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : isPending ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span className="capitalize">{item.status}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ink-muted whitespace-nowrap">
                      {item.createdAt ? new Date(item.createdAt).toLocaleString("en-IN") : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
