"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, RotateCcw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  adminFetchCenters,
  adminFetchCenterPrices,
  adminSetCenterPrice,
  adminResetCenterPrice,
  DiagnosticCenter,
  CenterPrice,
  ApiError
} from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

export default function CenterPricingPage() {
  const { token } = useAuth();
  const params = useParams();
  const router = useRouter();
  const centerId = Number(params.id);

  const [center, setCenter] = useState<DiagnosticCenter | null>(null);
  const [prices, setPrices] = useState<CenterPrice[] | null>(null);
  const [edited, setEdited] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");

  async function load() {
    if (!token) return;
    try {
      const [centers, priceList] = await Promise.all([
        adminFetchCenters(token),
        adminFetchCenterPrices(token, centerId)
      ]);
      setCenter(centers.find((c) => c.id === centerId) || null);
      setPrices(priceList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load pricing.");
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, centerId]);

  async function handleSave(catalogItemId: number) {
    if (!token) return;
    const raw = edited[catalogItemId];
    const value = Number(raw);
    if (!raw || Number.isNaN(value) || value < 0) {
      setError("Enter a valid price.");
      return;
    }
    setBusyId(catalogItemId);
    try {
      await adminSetCenterPrice(token, centerId, catalogItemId, value);
      setPrices((prev) =>
        prev ? prev.map((p) => (p.catalogItemId === catalogItemId ? { ...p, price: value, hasCustomPrice: true } : p)) : prev
      );
      setEdited((prev) => {
        const next = { ...prev };
        delete next[catalogItemId];
        return next;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not save this price.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleReset(catalogItemId: number) {
    if (!token) return;
    setBusyId(catalogItemId);
    try {
      await adminResetCenterPrice(token, centerId, catalogItemId);
      setPrices((prev) =>
        prev
          ? prev.map((p) => (p.catalogItemId === catalogItemId ? { ...p, price: p.defaultPrice, hasCustomPrice: false } : p))
          : prev
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not reset this price.");
    } finally {
      setBusyId(null);
    }
  }

  const filtered = prices?.filter((p) => p.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <button
        onClick={() => router.push("/centers")}
        className="flex items-center gap-1.5 text-sm font-semibold text-teal-dark mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to centers
      </button>

      <h1 className="text-2xl mb-1">
        Pricing — {center ? `${center.name}, ${center.branch}` : "Loading..."}
      </h1>
      <p className="text-sm text-ink-muted mb-6">
        Set what this center charges for each test. Anything without a custom price uses the
        catalog&apos;s list price shown to customers — that customer-facing price never changes here.
      </p>

      {error && <p className="text-sm font-semibold text-[#A32D2D] mb-4">{error}</p>}

      <input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search tests..."
        className="border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal w-full max-w-sm mb-4"
      />

      <div className="border border-border rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-bg-alt text-left">
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Test</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Catalog price</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">This center&apos;s price</th>
              <th className="px-4 py-3 font-bold text-xs uppercase tracking-wide text-ink-muted">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!filtered ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-muted">
                  No matching tests.
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.catalogItemId} className="border-b border-border last:border-b-0">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.group}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{fmtPrice(p.defaultPrice)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={0}
                        value={edited[p.catalogItemId] ?? p.price}
                        onChange={(e) => setEdited((prev) => ({ ...prev, [p.catalogItemId]: e.target.value }))}
                        className={`w-28 border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-teal ${
                          p.hasCustomPrice ? "border-teal-dark bg-mint font-semibold text-teal-dark" : "border-border"
                        }`}
                      />
                      {p.hasCustomPrice && (
                        <span className="text-[10px] font-bold uppercase text-teal-dark bg-mint px-1.5 py-0.5 rounded">
                          Custom
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSave(p.catalogItemId)}
                        disabled={busyId === p.catalogItemId || edited[p.catalogItemId] === undefined}
                        className="text-xs font-bold text-white bg-teal px-3 py-1.5 rounded-lg disabled:opacity-40"
                      >
                        Save
                      </button>
                      {p.hasCustomPrice && (
                        <button
                          onClick={() => handleReset(p.catalogItemId)}
                          disabled={busyId === p.catalogItemId}
                          className="flex items-center gap-1 text-xs font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
                          title="Reset to catalog price"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
