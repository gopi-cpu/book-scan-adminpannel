"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Search, Download, ChevronLeft, ChevronRight, Plus, Eye } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminFetchBookings,
  adminFetchCenters,
  adminAssignBooking,
  adminUpdateBookingStatus,
  adminFetchCenterOptions,
  adminExportBookingsCsv,
  adminFetchCatalog,
  AdminBooking,
  DiagnosticCenter,
  CenterOption,
  BookingFilters,
  ApiError
} from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";
import LiveResponseTime from "@/components/LiveResponseTime";
import CreateBookingModal from "@/components/CreateBookingModal";
import BookingDetailModal from "@/components/BookingDetailModal";
import AssignCenterModal from "@/components/AssignCenterModal";

const STATUS_CLASS: Record<string, string> = {
  Pending: "bg-[#DC2626] text-white",
  Assigned: "bg-[#2563EB] text-white",
  Upcoming: "bg-teal text-white",
  Completed: "bg-[#166534] text-white",
  Cancelled: "bg-[#6B7280] text-white line-through"
};

const PRIORITY_CLASS: Record<string, string> = {
  Normal: "bg-[#166534] text-white",
  Urgent: "bg-[#B45309] text-white",
  High: "bg-[#DC2626] text-white"
};

const PAGE_SIZE = 15;
const AUTO_REFRESH_MS = 10000;

function genderColor(gender: string): string {
  const g = gender.toLowerCase();
  if (g.startsWith("m")) return "text-[#2563EB]";
  if (g.startsWith("f")) return "text-[#DB2777]";
  return "text-ink-muted";
}

const emptyFilters = {
  search: "",
  dateFrom: "",
  dateTo: "",
  centerId: "",
  status: "",
  priority: "",
  sampleStatus: "",
  modality: "",
  testType: ""
};

export default function AdminBookingsPage() {
  const { token } = useAuth();
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(emptyFilters);
  const searchParams = useSearchParams();
  const [allCenters, setAllCenters] = useState<DiagnosticCenter[]>([]);
  const [testTypes, setTestTypes] = useState<string[]>([]);
  const [assignOpenFor, setAssignOpenFor] = useState<string | null>(null);
  const [centerOptions, setCenterOptions] = useState<Record<string, CenterOption[]>>({});
  const [loadingOptionsFor, setLoadingOptionsFor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingBooking, setViewingBooking] = useState<AdminBooking | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function currentFilters(): BookingFilters {
    return { page, limit: PAGE_SIZE, ...filters };
  }

  async function load(silent = false) {
    if (!token) return;
    try {
      const result = await adminFetchBookings(token, currentFilters());
      setBookings(result.bookings);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      if (!silent) setError("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load bookings.");
    }
  }

  async function loadCenterOptionsFor(bookingId: string) {
    if (!token || centerOptions[bookingId]) return;
    setLoadingOptionsFor(bookingId);
    try {
      const options = await adminFetchCenterOptions(token, bookingId);
      setCenterOptions((prev) => ({ ...prev, [bookingId]: options }));
    } catch {
      // silent — dropdown just won't have priced options yet, reopening retries
    } finally {
      setLoadingOptionsFor(null);
    }
  }

  function openAssignDropdown(bookingId: string) {
    setAssignOpenFor(bookingId);
    loadCenterOptionsFor(bookingId);
  }

  // Seed the search filter from ?search= if the top header search box sent us here.
  useEffect(() => {
    const q = searchParams.get("search");
    if (q) setFilters((prev) => ({ ...prev, search: q }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!token) return;
    adminFetchCenters(token).then((c) => setAllCenters(c.filter((x) => x.active))).catch(() => {});
    adminFetchCatalog(token)
      .then((items) => setTestTypes(Array.from(new Set(items.map((i) => i.group))).sort()))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    load();
    pollRef.current = setInterval(() => load(true), AUTO_REFRESH_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, page, filters]);

  function updateFilter(key: keyof typeof emptyFilters, value: string) {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setPage(1);
    setFilters(emptyFilters);
  }

  async function handleExport() {
    if (!token) return;
    setExporting(true);
    try {
      const blob = await adminExportBookingsCsv(token, currentFilters());
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "bookings.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not export bookings.");
    } finally {
      setExporting(false);
    }
  }

  async function handleAssign(bookingId: string, centerId: number) {
    if (!token) return;
    setBusyId(bookingId);
    try {
      const updated = await adminAssignBooking(token, bookingId, centerId);
      setBookings((prev) => (prev ? prev.map((b) => (b.id === bookingId ? updated : b)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not assign this booking.");
    } finally {
      setBusyId(null);
    }
  }

  async function handlePriorityChange(bookingId: string, priority: string) {
    if (!token) return;
    setBusyId(bookingId);
    try {
      const updated = await adminUpdateBookingStatus(token, bookingId, { priority });
      setBookings((prev) => (prev ? prev.map((b) => (b.id === bookingId ? updated : b)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update priority.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleStatusChange(bookingId: string, status: string) {
    if (!token) return;
    setBusyId(bookingId);
    try {
      const updated = await adminUpdateBookingStatus(token, bookingId, { status });
      setBookings((prev) => (prev ? prev.map((b) => (b.id === bookingId ? updated : b)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update status.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleSampleStatusChange(bookingId: string, sampleStatus: string) {
    if (!token) return;
    setBusyId(bookingId);
    try {
      const updated = await adminUpdateBookingStatus(token, bookingId, { sampleStatus });
      setBookings((prev) => (prev ? prev.map((b) => (b.id === bookingId ? updated : b)) : prev));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not update sample status.");
    } finally {
      setBusyId(null);
    }
  }

  const selectCls =
    "text-xs border border-border rounded-lg px-2.5 py-2 outline-none focus:border-teal bg-white w-full";

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <p className="text-sm text-ink-muted">
          {bookings ? `${total} booking${total === 1 ? "" : "s"}` : "Loading..."}
          <span className="text-xs text-ink-muted/70 ml-2">Auto-refreshes every 10s</span>
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-teal px-3.5 py-2 rounded-lg hover:brightness-95"
          >
            <Plus className="w-3.5 h-3.5" /> Create booking
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#6D28D9] px-3.5 py-2 rounded-lg hover:brightness-110 disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" /> {exporting ? "Exporting..." : "Download"}
          </button>
          <button
            onClick={() => load()}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-[#6D28D9] px-3.5 py-2 rounded-lg hover:brightness-110"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
        <input
          value={filters.search}
          onChange={(e) => updateFilter("search", e.target.value)}
          placeholder="Search by patient name or phone..."
          className="w-full border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:border-teal bg-white"
        />
      </div>

      <div className="bg-bg-alt border border-border rounded-2xl p-3 mb-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mb-2.5">
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">From date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => updateFilter("dateFrom", e.target.value)}
              className={selectCls}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">To date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => updateFilter("dateTo", e.target.value)}
              className={selectCls}
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Branch</label>
            <select value={filters.centerId} onChange={(e) => updateFilter("centerId", e.target.value)} className={selectCls}>
              <option value="">All branches</option>
              {allCenters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.branch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Priority</label>
            <select value={filters.priority} onChange={(e) => updateFilter("priority", e.target.value)} className={selectCls}>
              <option value="">All priorities</option>
              <option value="Normal">Normal</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Report status</label>
            <select value={filters.sampleStatus} onChange={(e) => updateFilter("sampleStatus", e.target.value)} className={selectCls}>
              <option value="">All</option>
              <option value="Not Applicable">Not applicable</option>
              <option value="Pending Collection">Pending Collection</option>
              <option value="Collected">Collected</option>
              <option value="In Transit">In Transit</option>
              <option value="Received at Lab">Received at Lab</option>
              <option value="Report Ready">Report Ready</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Status</label>
            <select value={filters.status} onChange={(e) => updateFilter("status", e.target.value)} className={selectCls}>
              <option value="">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Assigned">Assigned</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Modality</label>
            <select value={filters.modality} onChange={(e) => updateFilter("modality", e.target.value)} className={selectCls}>
              <option value="">All modalities</option>
              <option value="scan">Scan</option>
              <option value="pathology">Pathology</option>
              <option value="package">Package</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">Test type</label>
            <select value={filters.testType} onChange={(e) => updateFilter("testType", e.target.value)} className={selectCls}>
              <option value="">All test types</option>
              {testTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1 lg:col-span-2 flex justify-end">
            <button onClick={clearFilters} className="text-xs font-semibold text-teal-dark hover:underline">
              Clear all filters
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <div className="border border-border rounded-2xl overflow-x-auto">
        <table className="w-full text-sm min-w-[1250px]">
          <thead>
            <tr className="border-b border-border bg-bg-alt text-left">
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">#</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Patient</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Modality</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Created At</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Response Time</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Assigned To</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Assigned At</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Priority</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Status</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Sample</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!bookings ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-ink-muted">
                  Loading...
                </td>
              </tr>
            ) : bookings.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-10 text-center text-ink-muted">
                  No bookings match these filters.
                </td>
              </tr>
            ) : (
              bookings.map((b, i) => (
                <tr key={b.id} className="border-b border-border last:border-b-0 align-top">
                  <td className="px-4 py-4 text-ink-muted">{(page - 1) * PAGE_SIZE + i + 1}</td>
                  <td className="px-4 py-4">
                    <p className="font-semibold text-ink">{b.patient.name}</p>
                    <p className={`text-xs font-semibold ${genderColor(b.patient.gender)}`}>
                      {b.patient.gender} · {b.patient.age}y
                    </p>
                    <p className="text-xs text-ink-muted mt-1">
                      {b.items.map((it) => it.name).join(", ")} · {fmtPrice(b.total)}
                    </p>
                  </td>
                  <td className="px-4 py-4 uppercase text-xs font-semibold text-ink-muted">{b.modality}</td>
                  <td className="px-4 py-4 text-xs text-ink-muted whitespace-nowrap">
                    {new Date(b.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    <br />
                    {new Date(b.createdAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                  </td>
                  <td className="px-4 py-4 text-xs text-[#C4692B] font-semibold whitespace-nowrap">
                    <LiveResponseTime createdAt={b.createdAt} assignedAt={b.assignedAt} />
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => openAssignDropdown(b.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg max-w-[220px] truncate text-left ${
                        b.center ? "bg-[#166534] text-white" : "bg-[#7C3AED] text-white"
                      }`}
                    >
                      {b.center ? `${b.center.name} — ${b.center.branch}` : "Assign"}
                    </button>
                  </td>
                  <td className="px-4 py-4 text-xs text-ink-muted whitespace-nowrap">
                    {b.assignedAt
                      ? new Date(b.assignedAt).toLocaleString("en-IN", { day: "2-digit", month: "2-digit", hour: "numeric", minute: "2-digit" })
                      : "—"}
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={b.priority}
                      disabled={busyId === b.id}
                      onChange={(e) => handlePriorityChange(b.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-none outline-none appearance-none cursor-pointer ${PRIORITY_CLASS[b.priority]}`}
                    >
                      <option value="Normal">Normal</option>
                      <option value="Urgent">Urgent</option>
                      <option value="High">High</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    <select
                      value={b.status}
                      disabled={busyId === b.id}
                      onChange={(e) => handleStatusChange(b.id, e.target.value)}
                      className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border-none outline-none appearance-none cursor-pointer ${STATUS_CLASS[b.status]}`}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="px-4 py-4">
                    {b.items.some((it) => it.type === "pathology") ? (
                      <select
                        value={b.sampleStatus}
                        disabled={busyId === b.id}
                        onChange={(e) => handleSampleStatusChange(b.id, e.target.value)}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border outline-none focus:border-teal bg-white"
                      >
                        <option value="Pending Collection">Pending Collection</option>
                        <option value="Collected">Collected</option>
                        <option value="In Transit">In Transit</option>
                        <option value="Received at Lab">Received at Lab</option>
                        <option value="Report Ready">Report Ready</option>
                      </select>
                    ) : (
                      <span className="text-xs text-ink-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      onClick={() => setViewingBooking(b)}
                      className="w-7 h-7 rounded-full bg-sky text-[#2E6690] flex items-center justify-center hover:brightness-95"
                      title="View details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {bookings && bookings.length > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-xs text-ink-muted">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="flex items-center gap-1 text-xs font-semibold border border-border rounded-lg px-3 py-1.5 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" /> Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="flex items-center gap-1 text-xs font-semibold border border-border rounded-lg px-3 py-1.5 disabled:opacity-40"
            >
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            load();
          }}
        />
      )}

      {viewingBooking && (
        <BookingDetailModal booking={viewingBooking} onClose={() => setViewingBooking(null)} />
      )}

      {assignOpenFor &&
        (() => {
          const booking = bookings?.find((b) => b.id === assignOpenFor);
          if (!booking) return null;
          return (
            <AssignCenterModal
              booking={booking}
              options={centerOptions[assignOpenFor] || []}
              loading={loadingOptionsFor === assignOpenFor}
              onAssign={(centerId) => {
                handleAssign(assignOpenFor, centerId);
                setAssignOpenFor(null);
              }}
              onClose={() => setAssignOpenFor(null)}
            />
          );
        })()}
    </div>
  );
}