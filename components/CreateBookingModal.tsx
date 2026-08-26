"use client";

import { useEffect, useState } from "react";
import { X, Search, Scan, FlaskConical, Package } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { adminFetchCatalog, adminCreateBookingForCustomer, AdminCatalogItem, ApiError } from "@/lib/api";
import { fmtPrice } from "@/lib/catalog";

const SLOTS = [
  "7:00 AM – 8:00 AM",
  "9:00 AM – 10:00 AM",
  "11:00 AM – 12:00 PM",
  "2:00 PM – 3:00 PM",
  "4:00 PM – 5:00 PM",
  "6:00 PM – 7:00 PM"
];

const MODALITIES = [
  { value: "scan", label: "Scan", icon: Scan },
  { value: "pathology", label: "Pathology", icon: FlaskConical },
  { value: "package", label: "Package", icon: Package }
] as const;

export default function CreateBookingModal({
  initialName = "",
  initialPhone = "",
  initialModality,
  leadId,
  onClose,
  onCreated
}: {
  initialName?: string;
  initialPhone?: string;
  initialModality?: string;
  leadId?: string;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { token } = useAuth();
  const [catalog, setCatalog] = useState<AdminCatalogItem[]>([]);
  const [modality, setModality] = useState(
    ["scan", "pathology", "package"].includes(initialModality || "") ? initialModality! : ""
  );
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Record<string, number>>({});

  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    adminFetchCatalog(token).then(setCatalog).catch(() => setError("Could not load the catalog."));
  }, [token]);

  function handleModalityChange(next: string) {
    setModality(next);
    setSelected({});
  }

  const modalityItems = modality ? catalog.filter((c) => c.type === modality) : [];
  const filtered = modalityItems.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const selectedItems = catalog.filter((c) => selected[c.slug]);
  const total = selectedItems.reduce((sum, i) => sum + i.now * (selected[i.slug] || 1), 0);

  function toggleItem(slug: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[slug]) delete next[slug];
      else next[slug] = 1;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;
    if (!name.trim() || !phone.trim() || !age.trim() || !gender || !date || !slot || selectedItems.length === 0) {
      setError("Fill in patient details, pick at least one test, and choose a date and slot.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await adminCreateBookingForCustomer(token, {
        name: name.trim(),
        phone: phone.trim(),
        age: age.trim(),
        gender,
        items: selectedItems.map((i) => ({ slug: i.slug, name: i.name, type: i.type, price: i.now, qty: selected[i.slug] })),
        date,
        slot,
        total,
        leadId
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create this booking.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-ink-muted hover:text-ink">
          <X className="w-5 h-5" />
        </button>
        <h2 className="text-xl mb-5">Create booking</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Patient name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Age</label>
              <input
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Sex</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal bg-white"
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-border rounded-lg px-3.5 py-2.5 text-sm outline-none focus:border-teal"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Time slot</label>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlot(s)}
                  className={`text-xs font-semibold px-2 py-2 rounded-lg border ${
                    slot === s ? "bg-teal border-teal text-white" : "border-border text-ink"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Modality</label>
            <div className="grid grid-cols-3 gap-2">
              {MODALITIES.map((m) => {
                const Icon = m.icon;
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => handleModalityChange(m.value)}
                    className={`flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-2.5 rounded-lg border ${
                      modality === m.value ? "bg-primary border-primary text-white" : "border-border text-ink"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-ink-muted mb-1.5">Tests</label>
            {!modality ? (
              <p className="text-xs text-ink-muted bg-bg-alt border border-border rounded-lg px-3.5 py-3">
                Choose a modality above to see matching tests.
              </p>
            ) : (
              <>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search tests..."
                    className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:border-teal"
                  />
                </div>
                <div className="border border-border rounded-lg max-h-48 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <p className="text-xs text-ink-muted px-3 py-4 text-center">No tests match.</p>
                  ) : (
                    filtered.map((item) => (
                      <label
                        key={item.slug}
                        className="flex items-center justify-between px-3 py-2 text-sm border-b border-border last:border-b-0 hover:bg-bg-alt cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <input type="checkbox" checked={!!selected[item.slug]} onChange={() => toggleItem(item.slug)} />
                          {item.name}
                        </span>
                        <span className="text-ink-muted">{fmtPrice(item.now)}</span>
                      </label>
                    ))
                  )}
                </div>
              </>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-[#A32D2D]">{error}</p>}

          <div className="flex items-center justify-between border-t border-border pt-4">
            <span className="font-sora font-bold text-lg text-primary-dark">{fmtPrice(total)}</span>
            <button
              type="submit"
              disabled={submitting}
              className="bg-teal text-white font-semibold text-sm px-6 py-2.5 rounded-lg disabled:opacity-60"
            >
              {submitting ? "Creating..." : "Create booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
